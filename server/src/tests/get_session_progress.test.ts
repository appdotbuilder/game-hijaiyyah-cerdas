import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameSessionsTable, gameAnswersTable, gameLevelsTable, questionsTable, hijaiyyahLettersTable } from '../db/schema';
import { getSessionProgress } from '../handlers/get_session_progress';
import { eq } from 'drizzle-orm';

describe('getSessionProgress', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should return null for non-existent session', async () => {
        const result = await getSessionProgress(999);
        expect(result).toBeNull();
    });

    it('should return progress for session with no answers', async () => {
        // Create a test session
        const sessionResult = await db.insert(gameSessionsTable)
            .values({
                player_name: 'Test Player',
                current_level: 1,
                current_score: 0,
                lives_remaining: 3,
                is_active: true
            })
            .returning()
            .execute();

        const sessionId = sessionResult[0].id;

        // Create a level for completion percentage calculation
        await db.insert(gameLevelsTable)
            .values({
                level_number: 1,
                name: 'Level 1',
                questions_required: 10,
                letters_introduced: [1, 2],
                is_unlocked: true
            })
            .execute();

        const result = await getSessionProgress(sessionId);

        expect(result).not.toBeNull();
        expect(result?.session.id).toBe(sessionId);
        expect(result?.session.player_name).toBe('Test Player');
        expect(result?.session.current_level).toBe(1);
        expect(result?.totalQuestions).toBe(0);
        expect(result?.correctAnswers).toBe(0);
        expect(result?.averageTimePerQuestion).toBe(0);
        expect(result?.completionPercentage).toBe(0);
        expect(result?.recentAnswers).toEqual([]);
    });

    it('should calculate correct statistics for session with answers', async () => {
        // Create prerequisite data
        const letterResult = await db.insert(hijaiyyahLettersTable)
            .values({
                letter: 'ا',
                name: 'Alif',
                pronunciation: 'alif',
                level: 1
            })
            .returning()
            .execute();

        const levelResult = await db.insert(gameLevelsTable)
            .values({
                level_number: 1,
                name: 'Level 1',
                questions_required: 10,
                letters_introduced: [letterResult[0].id],
                is_unlocked: true
            })
            .returning()
            .execute();

        const sessionResult = await db.insert(gameSessionsTable)
            .values({
                player_name: 'Test Player',
                current_level: 1,
                current_score: 150,
                lives_remaining: 2,
                is_active: true
            })
            .returning()
            .execute();

        const questionResult = await db.insert(questionsTable)
            .values({
                type: 'visual_identification',
                level_id: levelResult[0].id,
                letter_id: letterResult[0].id,
                correct_answer: 'Alif',
                options: ['Alif', 'Ba', 'Ta', 'Tha']
            })
            .returning()
            .execute();

        const sessionId = sessionResult[0].id;
        const questionId = questionResult[0].id;

        // Create test answers one by one to ensure proper ordering - 3 correct, 2 incorrect
        await db.insert(gameAnswersTable)
            .values({
                session_id: sessionId,
                question_id: questionId,
                selected_answer: 'Alif',
                is_correct: true,
                time_taken_seconds: 5,
                points_earned: 10
            })
            .execute();

        await db.insert(gameAnswersTable)
            .values({
                session_id: sessionId,
                question_id: questionId,
                selected_answer: 'Alif',
                is_correct: true,
                time_taken_seconds: 3,
                points_earned: 15
            })
            .execute();

        await db.insert(gameAnswersTable)
            .values({
                session_id: sessionId,
                question_id: questionId,
                selected_answer: 'Ba',
                is_correct: false,
                time_taken_seconds: 8,
                points_earned: 0
            })
            .execute();

        await db.insert(gameAnswersTable)
            .values({
                session_id: sessionId,
                question_id: questionId,
                selected_answer: 'Alif',
                is_correct: true,
                time_taken_seconds: 4,
                points_earned: 12
            })
            .execute();

        await db.insert(gameAnswersTable)
            .values({
                session_id: sessionId,
                question_id: questionId,
                selected_answer: 'Ta',
                is_correct: false,
                time_taken_seconds: 10,
                points_earned: 0
            })
            .execute();

        const result = await getSessionProgress(sessionId);

        expect(result).not.toBeNull();
        expect(result?.session.id).toBe(sessionId);
        expect(result?.session.player_name).toBe('Test Player');
        expect(result?.session.current_score).toBe(150);
        expect(result?.totalQuestions).toBe(5);
        expect(result?.correctAnswers).toBe(3);
        expect(result?.averageTimePerQuestion).toBe(6); // (5+3+8+4+10)/5 = 6
        expect(result?.completionPercentage).toBe(50); // 5/10 * 100 = 50%
        expect(result?.recentAnswers).toHaveLength(5);
        expect(result?.recentAnswers[0].is_correct).toBe(false); // Most recent answer should be the last inserted (Ta)
        expect(result?.recentAnswers[0].selected_answer).toBe('Ta');
    });

    it('should limit recent answers to 5 items', async () => {
        // Create prerequisite data
        const letterResult = await db.insert(hijaiyyahLettersTable)
            .values({
                letter: 'ا',
                name: 'Alif',
                pronunciation: 'alif',
                level: 1
            })
            .returning()
            .execute();

        const levelResult = await db.insert(gameLevelsTable)
            .values({
                level_number: 1,
                name: 'Level 1',
                questions_required: 10,
                letters_introduced: [letterResult[0].id],
                is_unlocked: true
            })
            .returning()
            .execute();

        const sessionResult = await db.insert(gameSessionsTable)
            .values({
                player_name: 'Test Player',
                current_level: 1,
                is_active: true
            })
            .returning()
            .execute();

        const questionResult = await db.insert(questionsTable)
            .values({
                type: 'visual_identification',
                level_id: levelResult[0].id,
                letter_id: letterResult[0].id,
                correct_answer: 'Alif',
                options: ['Alif', 'Ba', 'Ta', 'Tha']
            })
            .returning()
            .execute();

        const sessionId = sessionResult[0].id;
        const questionId = questionResult[0].id;

        // Create 8 test answers
        const testAnswers = Array.from({ length: 8 }, (_, i) => ({
            session_id: sessionId,
            question_id: questionId,
            selected_answer: 'Alif',
            is_correct: i % 2 === 0, // Alternate correct/incorrect
            time_taken_seconds: i + 1,
            points_earned: i % 2 === 0 ? 10 : 0
        }));

        await db.insert(gameAnswersTable)
            .values(testAnswers)
            .execute();

        const result = await getSessionProgress(sessionId);

        expect(result).not.toBeNull();
        expect(result?.totalQuestions).toBe(8);
        expect(result?.recentAnswers).toHaveLength(5); // Should be limited to 5
        expect(result?.correctAnswers).toBe(4); // Half should be correct
    });

    it('should handle completion percentage over 100%', async () => {
        // Create prerequisite data
        const letterResult = await db.insert(hijaiyyahLettersTable)
            .values({
                letter: 'ا',
                name: 'Alif',
                pronunciation: 'alif',
                level: 1
            })
            .returning()
            .execute();

        const levelResult = await db.insert(gameLevelsTable)
            .values({
                level_number: 1,
                name: 'Level 1',
                questions_required: 3, // Small requirement
                letters_introduced: [letterResult[0].id],
                is_unlocked: true
            })
            .returning()
            .execute();

        const sessionResult = await db.insert(gameSessionsTable)
            .values({
                player_name: 'Test Player',
                current_level: 1,
                is_active: true
            })
            .returning()
            .execute();

        const questionResult = await db.insert(questionsTable)
            .values({
                type: 'visual_identification',
                level_id: levelResult[0].id,
                letter_id: letterResult[0].id,
                correct_answer: 'Alif',
                options: ['Alif', 'Ba']
            })
            .returning()
            .execute();

        const sessionId = sessionResult[0].id;

        // Create 5 answers (more than required)
        const testAnswers = Array.from({ length: 5 }, (_, i) => ({
            session_id: sessionId,
            question_id: questionResult[0].id,
            selected_answer: 'Alif',
            is_correct: true,
            time_taken_seconds: 3,
            points_earned: 10
        }));

        await db.insert(gameAnswersTable)
            .values(testAnswers)
            .execute();

        const result = await getSessionProgress(sessionId);

        expect(result).not.toBeNull();
        expect(result?.totalQuestions).toBe(5);
        expect(result?.completionPercentage).toBe(100); // Should cap at 100%
    });

    it('should handle session with no corresponding level', async () => {
        // Create session without corresponding level
        const sessionResult = await db.insert(gameSessionsTable)
            .values({
                player_name: 'Test Player',
                current_level: 999, // Non-existent level
                is_active: true
            })
            .returning()
            .execute();

        const result = await getSessionProgress(sessionResult[0].id);

        expect(result).not.toBeNull();
        expect(result?.completionPercentage).toBe(0); // Should default to 0
        expect(result?.totalQuestions).toBe(0);
        expect(result?.correctAnswers).toBe(0);
        expect(result?.averageTimePerQuestion).toBe(0);
    });

    it('should verify database persistence of session data', async () => {
        // Create and verify session data persists
        const sessionResult = await db.insert(gameSessionsTable)
            .values({
                player_name: 'Persistent Player',
                current_level: 2,
                current_score: 75,
                lives_remaining: 1,
                is_active: false
            })
            .returning()
            .execute();

        const sessionId = sessionResult[0].id;

        // Verify data in database
        const dbSession = await db.select()
            .from(gameSessionsTable)
            .where(eq(gameSessionsTable.id, sessionId))
            .execute();

        expect(dbSession).toHaveLength(1);
        expect(dbSession[0].player_name).toBe('Persistent Player');
        expect(dbSession[0].current_level).toBe(2);
        expect(dbSession[0].current_score).toBe(75);
        expect(dbSession[0].lives_remaining).toBe(1);
        expect(dbSession[0].is_active).toBe(false);

        const result = await getSessionProgress(sessionId);
        expect(result?.session.is_active).toBe(false);
    });
});