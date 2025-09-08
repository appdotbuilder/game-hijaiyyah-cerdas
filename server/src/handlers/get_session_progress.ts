import { db } from '../db';
import { gameSessionsTable, gameAnswersTable, gameLevelsTable } from '../db/schema';
import { type GameSession, type GameAnswer } from '../schema';
import { eq, desc, sql, count } from 'drizzle-orm';

export interface SessionProgress {
    session: GameSession;
    totalQuestions: number;
    correctAnswers: number;
    averageTimePerQuestion: number;
    completionPercentage: number;
    recentAnswers: GameAnswer[];
}

export async function getSessionProgress(sessionId: number): Promise<SessionProgress | null> {
    try {
        // Get the session details
        const sessionResult = await db.select()
            .from(gameSessionsTable)
            .where(eq(gameSessionsTable.id, sessionId))
            .execute();

        if (sessionResult.length === 0) {
            return null;
        }

        const session = sessionResult[0];

        // Get all answers for this session
        const allAnswers = await db.select()
            .from(gameAnswersTable)
            .where(eq(gameAnswersTable.session_id, sessionId))
            .orderBy(desc(gameAnswersTable.answered_at))
            .execute();

        // Get recent answers (last 5)
        const recentAnswers = allAnswers.slice(0, 5);

        // Calculate statistics
        const totalQuestions = allAnswers.length;
        const correctAnswers = allAnswers.filter(answer => answer.is_correct).length;
        
        // Calculate average time per question
        const totalTimeSeconds = allAnswers.reduce((sum, answer) => sum + answer.time_taken_seconds, 0);
        const averageTimePerQuestion = totalQuestions > 0 ? totalTimeSeconds / totalQuestions : 0;

        // Get the current level info to determine completion percentage
        const levelResult = await db.select()
            .from(gameLevelsTable)
            .where(eq(gameLevelsTable.level_number, session.current_level))
            .execute();

        let completionPercentage = 0;
        if (levelResult.length > 0) {
            const questionsRequired = levelResult[0].questions_required;
            completionPercentage = questionsRequired > 0 ? Math.min((totalQuestions / questionsRequired) * 100, 100) : 0;
        }

        return {
            session: {
                id: session.id,
                player_name: session.player_name,
                current_level: session.current_level,
                current_score: session.current_score,
                lives_remaining: session.lives_remaining,
                session_start: session.session_start,
                session_end: session.session_end,
                is_active: session.is_active,
                created_at: session.created_at
            },
            totalQuestions,
            correctAnswers,
            averageTimePerQuestion: Math.round(averageTimePerQuestion * 100) / 100, // Round to 2 decimal places
            completionPercentage: Math.round(completionPercentage * 100) / 100, // Round to 2 decimal places
            recentAnswers: recentAnswers.map(answer => ({
                id: answer.id,
                session_id: answer.session_id,
                question_id: answer.question_id,
                selected_answer: answer.selected_answer,
                is_correct: answer.is_correct,
                time_taken_seconds: answer.time_taken_seconds,
                points_earned: answer.points_earned,
                answered_at: answer.answered_at,
                created_at: answer.created_at
            }))
        };
    } catch (error) {
        console.error('Get session progress failed:', error);
        throw error;
    }
}