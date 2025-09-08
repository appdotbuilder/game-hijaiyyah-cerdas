import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  gameSessionsTable, 
  questionsTable, 
  gameAnswersTable, 
  gameLevelsTable,
  hijaiyyahLettersTable 
} from '../db/schema';
import { type SubmitAnswerInput } from '../schema';
import { submitAnswer } from '../handlers/submit_answer';
import { eq } from 'drizzle-orm';

// Test helper function to create prerequisite data
const createTestData = async () => {
  // Create a hijaiyyah letter
  const letterResult = await db.insert(hijaiyyahLettersTable)
    .values({
      letter: 'ا',
      name: 'Alif',
      pronunciation: 'aa',
      level: 1
    })
    .returning()
    .execute();

  // Create a game level
  const levelResult = await db.insert(gameLevelsTable)
    .values({
      level_number: 1,
      name: 'Level 1',
      questions_required: 5,
      letters_introduced: [letterResult[0].id]
    })
    .returning()
    .execute();

  // Create an active game session
  const sessionResult = await db.insert(gameSessionsTable)
    .values({
      player_name: 'Test Player',
      current_level: 1,
      current_score: 50, // Starting with some score
      lives_remaining: 3,
      is_active: true
    })
    .returning()
    .execute();

  // Create a test question
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

  return {
    session: sessionResult[0],
    question: questionResult[0],
    level: levelResult[0],
    letter: letterResult[0]
  };
};

describe('submitAnswer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should process correct answer and calculate points with speed bonus', async () => {
    const { session, question } = await createTestData();

    const testInput: SubmitAnswerInput = {
      session_id: session.id,
      question_id: question.id,
      selected_answer: 'Alif', // Correct answer
      time_taken_seconds: 1.5 // Fast response
    };

    const result = await submitAnswer(testInput);

    // Verify answer record
    expect(result.session_id).toBe(session.id);
    expect(result.question_id).toBe(question.id);
    expect(result.selected_answer).toBe('Alif');
    expect(result.is_correct).toBe(true);
    expect(result.time_taken_seconds).toBe(1.5);
    expect(result.id).toBeDefined();
    expect(result.answered_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify points calculation (10 base + 5 speed bonus for fast answer)
    expect(result.points_earned).toBe(15);
  });

  it('should process correct answer with reduced speed bonus for slower response', async () => {
    const { session, question } = await createTestData();

    const testInput: SubmitAnswerInput = {
      session_id: session.id,
      question_id: question.id,
      selected_answer: 'Alif', // Correct answer
      time_taken_seconds: 4.5 // Slower response
    };

    const result = await submitAnswer(testInput);

    expect(result.is_correct).toBe(true);
    // Base points 10 + reduced speed bonus (5 - floor(4.5/2)) = 10 + 3 = 13
    expect(result.points_earned).toBe(13);
  });

  it('should process incorrect answer with penalty points', async () => {
    const { session, question } = await createTestData();

    const testInput: SubmitAnswerInput = {
      session_id: session.id,
      question_id: question.id,
      selected_answer: 'Ba', // Wrong answer
      time_taken_seconds: 2.0
    };

    const result = await submitAnswer(testInput);

    expect(result.is_correct).toBe(false);
    expect(result.selected_answer).toBe('Ba');
    expect(result.points_earned).toBe(-2); // Penalty for wrong answer
  });

  it('should update game session score', async () => {
    const { session, question } = await createTestData();
    const initialScore = session.current_score;

    const testInput: SubmitAnswerInput = {
      session_id: session.id,
      question_id: question.id,
      selected_answer: 'Alif',
      time_taken_seconds: 1.0
    };

    await submitAnswer(testInput);

    // Check that session score was updated
    const updatedSessions = await db.select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.id, session.id))
      .execute();

    const expectedScore = initialScore + 15; // 10 base + 5 speed bonus
    expect(updatedSessions[0].current_score).toBe(expectedScore);
  });

  it('should save answer record to database', async () => {
    const { session, question } = await createTestData();

    const testInput: SubmitAnswerInput = {
      session_id: session.id,
      question_id: question.id,
      selected_answer: 'Alif',
      time_taken_seconds: 3.0
    };

    const result = await submitAnswer(testInput);

    // Verify the answer was saved to database
    const savedAnswers = await db.select()
      .from(gameAnswersTable)
      .where(eq(gameAnswersTable.id, result.id))
      .execute();

    expect(savedAnswers).toHaveLength(1);
    const savedAnswer = savedAnswers[0];
    expect(savedAnswer.session_id).toBe(session.id);
    expect(savedAnswer.question_id).toBe(question.id);
    expect(savedAnswer.selected_answer).toBe('Alif');
    expect(savedAnswer.is_correct).toBe(true);
    expect(savedAnswer.time_taken_seconds).toBe(3); // Stored as integer
    expect(savedAnswer.answered_at).toBeInstanceOf(Date);
  });

  it('should handle very slow responses with no speed bonus', async () => {
    const { session, question } = await createTestData();

    const testInput: SubmitAnswerInput = {
      session_id: session.id,
      question_id: question.id,
      selected_answer: 'Alif',
      time_taken_seconds: 15.0 // Very slow response
    };

    const result = await submitAnswer(testInput);

    expect(result.is_correct).toBe(true);
    // Only base points, no speed bonus (5 - floor(15/2)) = 5 - 7 = -2, but max(0, -2) = 0
    expect(result.points_earned).toBe(10); // Just base points
  });

  it('should throw error for non-existent session', async () => {
    const { question } = await createTestData();

    const testInput: SubmitAnswerInput = {
      session_id: 99999, // Non-existent session
      question_id: question.id,
      selected_answer: 'Alif',
      time_taken_seconds: 2.0
    };

    await expect(submitAnswer(testInput)).rejects.toThrow(/session.*not found/i);
  });

  it('should throw error for inactive session', async () => {
    const { question } = await createTestData();

    // Create an inactive session
    const inactiveSessionResult = await db.insert(gameSessionsTable)
      .values({
        player_name: 'Inactive Player',
        current_level: 1,
        is_active: false
      })
      .returning()
      .execute();

    const testInput: SubmitAnswerInput = {
      session_id: inactiveSessionResult[0].id,
      question_id: question.id,
      selected_answer: 'Alif',
      time_taken_seconds: 2.0
    };

    await expect(submitAnswer(testInput)).rejects.toThrow(/session.*not active/i);
  });

  it('should throw error for non-existent question', async () => {
    const { session } = await createTestData();

    const testInput: SubmitAnswerInput = {
      session_id: session.id,
      question_id: 99999, // Non-existent question
      selected_answer: 'Alif',
      time_taken_seconds: 2.0
    };

    await expect(submitAnswer(testInput)).rejects.toThrow(/question.*not found/i);
  });
});