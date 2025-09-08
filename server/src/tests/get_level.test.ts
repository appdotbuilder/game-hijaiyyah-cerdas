import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameLevelsTable } from '../db/schema';
import { type GetLevelInput } from '../schema';
import { getLevel } from '../handlers/get_level';
import { eq } from 'drizzle-orm';

// Test inputs
const testInput: GetLevelInput = {
  level_number: 1
};

const testLevel = {
  level_number: 1,
  name: 'Alif Ba Ta',
  description: 'Introduction to the first three Hijaiyyah letters',
  questions_required: 10,
  letters_introduced: [1, 2, 3],
  is_unlocked: true
};

const testLevel2 = {
  level_number: 2,
  name: 'Tha Jeem Haa',
  description: 'Learning the next set of Hijaiyyah letters',
  questions_required: 15,
  letters_introduced: [4, 5, 6],
  is_unlocked: false
};

describe('getLevel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a level by level number', async () => {
    // Insert test level
    await db.insert(gameLevelsTable)
      .values(testLevel)
      .execute();

    const result = await getLevel(testInput);

    // Validate returned level
    expect(result).toBeDefined();
    expect(result!.level_number).toEqual(1);
    expect(result!.name).toEqual('Alif Ba Ta');
    expect(result!.description).toEqual('Introduction to the first three Hijaiyyah letters');
    expect(result!.questions_required).toEqual(10);
    expect(result!.letters_introduced).toEqual([1, 2, 3]);
    expect(result!.is_unlocked).toEqual(true);
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent level', async () => {
    // Try to get a level that doesn't exist
    const nonExistentInput: GetLevelInput = {
      level_number: 999
    };

    const result = await getLevel(nonExistentInput);

    expect(result).toBeNull();
  });

  it('should return the correct level when multiple levels exist', async () => {
    // Insert multiple levels
    await db.insert(gameLevelsTable)
      .values([testLevel, testLevel2])
      .execute();

    // Get level 2
    const input2: GetLevelInput = {
      level_number: 2
    };

    const result = await getLevel(input2);

    // Validate we got the correct level
    expect(result).toBeDefined();
    expect(result!.level_number).toEqual(2);
    expect(result!.name).toEqual('Tha Jeem Haa');
    expect(result!.description).toEqual('Learning the next set of Hijaiyyah letters');
    expect(result!.questions_required).toEqual(15);
    expect(result!.letters_introduced).toEqual([4, 5, 6]);
    expect(result!.is_unlocked).toEqual(false);
  });

  it('should handle level with null description', async () => {
    // Insert level with null description
    const levelWithNullDesc = {
      ...testLevel,
      description: null
    };

    await db.insert(gameLevelsTable)
      .values(levelWithNullDesc)
      .execute();

    const result = await getLevel(testInput);

    expect(result).toBeDefined();
    expect(result!.description).toBeNull();
    expect(result!.name).toEqual('Alif Ba Ta');
  });

  it('should correctly parse JSON letters_introduced array', async () => {
    // Insert level with complex letters array
    const complexLevel = {
      ...testLevel,
      letters_introduced: [1, 2, 3, 4, 5, 10, 15, 20]
    };

    await db.insert(gameLevelsTable)
      .values(complexLevel)
      .execute();

    const result = await getLevel(testInput);

    expect(result).toBeDefined();
    expect(Array.isArray(result!.letters_introduced)).toBe(true);
    expect(result!.letters_introduced).toEqual([1, 2, 3, 4, 5, 10, 15, 20]);
  });

  it('should save level to database correctly', async () => {
    // Insert test level
    await db.insert(gameLevelsTable)
      .values(testLevel)
      .execute();

    // Verify in database directly
    const levelsInDb = await db.select()
      .from(gameLevelsTable)
      .where(eq(gameLevelsTable.level_number, 1))
      .execute();

    expect(levelsInDb).toHaveLength(1);
    expect(levelsInDb[0].level_number).toEqual(1);
    expect(levelsInDb[0].name).toEqual('Alif Ba Ta');
    expect(levelsInDb[0].letters_introduced).toEqual([1, 2, 3]);
    expect(levelsInDb[0].created_at).toBeInstanceOf(Date);
  });
});