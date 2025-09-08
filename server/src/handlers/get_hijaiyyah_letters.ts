import { db } from '../db';
import { hijaiyyahLettersTable } from '../db/schema';
import { type HijaiyyahLetter } from '../schema';
import { asc } from 'drizzle-orm';

export const getHijaiyyahLetters = async (): Promise<HijaiyyahLetter[]> => {
  try {
    // Fetch all Hijaiyyah letters ordered by level and then by id for consistent ordering
    const results = await db.select()
      .from(hijaiyyahLettersTable)
      .orderBy(asc(hijaiyyahLettersTable.level), asc(hijaiyyahLettersTable.id))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch Hijaiyyah letters:', error);
    throw error;
  }
};