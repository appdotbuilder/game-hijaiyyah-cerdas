import { db } from '../db';
import { questionsTable } from '../db/schema';
import { type GetQuestionsInput, type Question } from '../schema';
import { eq, and, sql, type SQL } from 'drizzle-orm';

export const getQuestions = async (input: GetQuestionsInput): Promise<Question[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by level_id
    conditions.push(eq(questionsTable.level_id, input.level_id));
    
    // Optionally filter by question type
    if (input.question_type) {
      conditions.push(eq(questionsTable.type, input.question_type));
    }

    // Build and execute query in one chain
    const results = await db.select()
      .from(questionsTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(sql`RANDOM()`)
      .limit(input.limit)
      .execute();

    // Transform results to match schema types
    return results.map(question => ({
      ...question,
      options: question.options as string[], // JSON field needs type assertion
      created_at: question.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    throw error;
  }
};