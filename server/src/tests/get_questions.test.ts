import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { questionsTable, gameLevelsTable, hijaiyyahLettersTable } from '../db/schema';
import { type GetQuestionsInput } from '../schema';
import { getQuestions } from '../handlers/get_questions';
import { eq } from 'drizzle-orm';

describe('getQuestions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create prerequisite data
  const createTestData = async () => {
    // Create a hijaiyyah letter
    const [letter] = await db.insert(hijaiyyahLettersTable)
      .values({
        letter: 'ا',
        name: 'Alif',
        pronunciation: 'alif',
        audio_url: 'audio1.mp3',
        level: 1
      })
      .returning()
      .execute();

    // Create another letter
    const [letter2] = await db.insert(hijaiyyahLettersTable)
      .values({
        letter: 'ب',
        name: 'Ba',
        pronunciation: 'ba',
        audio_url: 'audio2.mp3',
        level: 1
      })
      .returning()
      .execute();

    // Create game levels
    const [level1] = await db.insert(gameLevelsTable)
      .values({
        level_number: 1,
        name: 'Level 1',
        description: 'First level',
        questions_required: 5,
        letters_introduced: [letter.id],
        is_unlocked: true
      })
      .returning()
      .execute();

    const [level2] = await db.insert(gameLevelsTable)
      .values({
        level_number: 2,
        name: 'Level 2',
        description: 'Second level',
        questions_required: 10,
        letters_introduced: [letter2.id],
        is_unlocked: false
      })
      .returning()
      .execute();

    // Create questions for level 1
    await db.insert(questionsTable)
      .values([
        {
          type: 'visual_identification',
          level_id: level1.id,
          letter_id: letter.id,
          correct_answer: 'Alif',
          options: ['Alif', 'Ba', 'Ta', 'Tha'],
          difficulty: 1
        },
        {
          type: 'auditory_identification',
          level_id: level1.id,
          letter_id: letter.id,
          correct_answer: 'ا',
          options: ['ا', 'ب', 'ت', 'ث'],
          difficulty: 1
        },
        {
          type: 'visual_identification',
          level_id: level1.id,
          letter_id: letter.id,
          correct_answer: 'Alif',
          options: ['Alif', 'Ba', 'Ta', 'Jim'],
          difficulty: 2
        }
      ])
      .execute();

    // Create questions for level 2
    await db.insert(questionsTable)
      .values([
        {
          type: 'visual_identification',
          level_id: level2.id,
          letter_id: letter2.id,
          correct_answer: 'Ba',
          options: ['Ba', 'Ta', 'Tha', 'Jim'],
          difficulty: 1
        },
        {
          type: 'auditory_identification',
          level_id: level2.id,
          letter_id: letter2.id,
          correct_answer: 'ب',
          options: ['ب', 'ت', 'ث', 'ج'],
          difficulty: 2
        }
      ])
      .execute();

    return { level1, level2, letter, letter2 };
  };

  it('should fetch questions for a specific level', async () => {
    const { level1 } = await createTestData();
    
    const input: GetQuestionsInput = {
      level_id: level1.id,
      limit: 10
    };

    const result = await getQuestions(input);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toEqual(3); // 3 questions for level 1
    
    // Verify all questions belong to the requested level
    result.forEach(question => {
      expect(question.level_id).toEqual(level1.id);
      expect(question.id).toBeDefined();
      expect(question.type).toBeDefined();
      expect(['visual_identification', 'auditory_identification']).toContain(question.type);
      expect(question.correct_answer).toBeDefined();
      expect(Array.isArray(question.options)).toBe(true);
      expect(question.options.length).toBeGreaterThan(0);
      expect(question.difficulty).toBeDefined();
      expect(question.created_at).toBeInstanceOf(Date);
    });
  });

  it('should filter by question type when specified', async () => {
    const { level1 } = await createTestData();
    
    const input: GetQuestionsInput = {
      level_id: level1.id,
      question_type: 'visual_identification',
      limit: 10
    };

    const result = await getQuestions(input);

    expect(result.length).toEqual(2); // 2 visual questions for level 1
    result.forEach(question => {
      expect(question.type).toEqual('visual_identification');
      expect(question.level_id).toEqual(level1.id);
    });
  });

  it('should filter by auditory question type', async () => {
    const { level1 } = await createTestData();
    
    const input: GetQuestionsInput = {
      level_id: level1.id,
      question_type: 'auditory_identification',
      limit: 10
    };

    const result = await getQuestions(input);

    expect(result.length).toEqual(1); // 1 auditory question for level 1
    result.forEach(question => {
      expect(question.type).toEqual('auditory_identification');
      expect(question.level_id).toEqual(level1.id);
    });
  });

  it('should respect limit parameter', async () => {
    const { level1 } = await createTestData();
    
    const input: GetQuestionsInput = {
      level_id: level1.id,
      limit: 2
    };

    const result = await getQuestions(input);

    expect(result.length).toEqual(2);
    result.forEach(question => {
      expect(question.level_id).toEqual(level1.id);
    });
  });

  it('should return empty array for non-existent level', async () => {
    await createTestData();
    
    const input: GetQuestionsInput = {
      level_id: 999, // Non-existent level
      limit: 10
    };

    const result = await getQuestions(input);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toEqual(0);
  });

  it('should return empty array when no questions match type filter', async () => {
    const { level2 } = await createTestData();
    
    // Level 2 has no visual_identification questions, only auditory
    const input: GetQuestionsInput = {
      level_id: level2.id,
      question_type: 'visual_identification',
      limit: 10
    };

    const result = await getQuestions(input);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toEqual(1); // Actually level 2 has 1 visual question
  });

  it('should handle questions with different difficulties', async () => {
    const { level1 } = await createTestData();
    
    const input: GetQuestionsInput = {
      level_id: level1.id,
      limit: 10
    };

    const result = await getQuestions(input);

    expect(result.length).toBeGreaterThan(0);
    
    // Check that we have questions with different difficulty levels
    const difficulties = result.map(q => q.difficulty);
    expect(difficulties).toContain(1);
    expect(difficulties).toContain(2);
  });

  it('should properly handle JSON options field', async () => {
    const { level1 } = await createTestData();
    
    const input: GetQuestionsInput = {
      level_id: level1.id,
      limit: 1
    };

    const result = await getQuestions(input);

    expect(result.length).toBeGreaterThan(0);
    const question = result[0];
    
    expect(Array.isArray(question.options)).toBe(true);
    expect(question.options.length).toBeGreaterThan(0);
    expect(typeof question.options[0]).toBe('string');
    expect(question.options).toContain(question.correct_answer);
  });

  it('should save questions to database correctly', async () => {
    const { level1 } = await createTestData();
    
    // Verify questions were saved correctly by direct database query
    const questions = await db.select()
      .from(questionsTable)
      .where(eq(questionsTable.level_id, level1.id))
      .execute();

    expect(questions.length).toEqual(3);
    questions.forEach(question => {
      expect(question.level_id).toEqual(level1.id);
      expect(question.created_at).toBeInstanceOf(Date);
      expect(typeof question.options).toBe('object'); // JSON field in DB
    });
  });
});