import { db } from '../db';
import { gameAnswersTable, gameSessionsTable, questionsTable } from '../db/schema';
import { type SubmitAnswerInput, type GameAnswer } from '../schema';
import { eq } from 'drizzle-orm';

export const submitAnswer = async (input: SubmitAnswerInput): Promise<GameAnswer> => {
  try {
    // First, verify the session exists and is active
    const session = await db.select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.id, input.session_id))
      .execute();

    if (session.length === 0) {
      throw new Error(`Game session with ID ${input.session_id} not found`);
    }

    if (!session[0].is_active) {
      throw new Error(`Game session with ID ${input.session_id} is not active`);
    }

    // Get the question to validate the answer
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.id, input.question_id))
      .execute();

    if (questions.length === 0) {
      throw new Error(`Question with ID ${input.question_id} not found`);
    }

    const question = questions[0];

    // Check if answer is correct
    const isCorrect = input.selected_answer === question.correct_answer;

    // Calculate points based on correctness and speed
    let pointsEarned = 0;
    if (isCorrect) {
      const basePoints = 10;
      // Speed bonus: up to 5 extra points for fast answers (under 2 seconds gets full bonus)
      const speedBonus = Math.max(0, 5 - Math.floor(input.time_taken_seconds / 2));
      pointsEarned = basePoints + speedBonus;
    } else {
      // Small penalty for wrong answers
      pointsEarned = -2;
    }

    // Insert the answer record
    const answerResult = await db.insert(gameAnswersTable)
      .values({
        session_id: input.session_id,
        question_id: input.question_id,
        selected_answer: input.selected_answer,
        is_correct: isCorrect,
        time_taken_seconds: Math.floor(input.time_taken_seconds), // Store as integer
        points_earned: pointsEarned
      })
      .returning()
      .execute();

    const newAnswer = answerResult[0];

    // Update the game session score
    const newScore = session[0].current_score + pointsEarned;
    await db.update(gameSessionsTable)
      .set({ current_score: newScore })
      .where(eq(gameSessionsTable.id, input.session_id))
      .execute();

    // Return the answer with proper type conversion
    return {
      ...newAnswer,
      time_taken_seconds: input.time_taken_seconds // Keep as number for API response
    };

  } catch (error) {
    console.error('Submit answer failed:', error);
    throw error;
  }
};