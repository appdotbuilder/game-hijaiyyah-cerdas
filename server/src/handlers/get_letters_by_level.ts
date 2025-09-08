import { db } from '../db';
import { hijaiyyahLettersTable } from '../db/schema';
import { type HijaiyyahLetter } from '../schema';
import { eq } from 'drizzle-orm';

export async function getLettersByLevel(levelNumber: number): Promise<HijaiyyahLetter[]> {
  try {
    const results = await db.select()
      .from(hijaiyyahLettersTable)
      .where(eq(hijaiyyahLettersTable.level, levelNumber))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get letters by level:', error);
    throw error;
  }
}