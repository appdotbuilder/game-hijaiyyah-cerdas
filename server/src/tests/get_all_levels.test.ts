import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameLevelsTable } from '../db/schema';
import { getAllLevels } from '../handlers/get_all_levels';

describe('getAllLevels', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no levels exist', async () => {
    const result = await getAllLevels();
    expect(result).toEqual([]);
  });

  it('should return all game levels', async () => {
    // Insert test levels
    await db.insert(gameLevelsTable).values([
      {
        level_number: 1,
        name: 'First Letters',
        description: 'Learn your first Hijaiyyah letters',
        questions_required: 10,
        letters_introduced: [1, 2, 3],
        is_unlocked: true
      },
      {
        level_number: 2,
        name: 'Building Words',
        description: 'Combine letters to form simple words',
        questions_required: 15,
        letters_introduced: [4, 5, 6],
        is_unlocked: false
      }
    ]).execute();

    const result = await getAllLevels();

    expect(result).toHaveLength(2);
    
    // Verify first level
    expect(result[0].level_number).toEqual(1);
    expect(result[0].name).toEqual('First Letters');
    expect(result[0].description).toEqual('Learn your first Hijaiyyah letters');
    expect(result[0].questions_required).toEqual(10);
    expect(result[0].letters_introduced).toEqual([1, 2, 3]);
    expect(result[0].is_unlocked).toEqual(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second level
    expect(result[1].level_number).toEqual(2);
    expect(result[1].name).toEqual('Building Words');
    expect(result[1].description).toEqual('Combine letters to form simple words');
    expect(result[1].questions_required).toEqual(15);
    expect(result[1].letters_introduced).toEqual([4, 5, 6]);
    expect(result[1].is_unlocked).toEqual(false);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return levels ordered by level_number', async () => {
    // Insert levels in random order
    await db.insert(gameLevelsTable).values([
      {
        level_number: 3,
        name: 'Advanced Level',
        description: 'Advanced Hijaiyyah practice',
        questions_required: 20,
        letters_introduced: [7, 8, 9],
        is_unlocked: false
      },
      {
        level_number: 1,
        name: 'Beginner Level',
        description: 'Start your journey',
        questions_required: 5,
        letters_introduced: [1, 2],
        is_unlocked: true
      },
      {
        level_number: 2,
        name: 'Intermediate Level',
        description: 'Continue learning',
        questions_required: 10,
        letters_introduced: [3, 4, 5],
        is_unlocked: false
      }
    ]).execute();

    const result = await getAllLevels();

    expect(result).toHaveLength(3);
    
    // Verify correct ordering
    expect(result[0].level_number).toEqual(1);
    expect(result[0].name).toEqual('Beginner Level');
    
    expect(result[1].level_number).toEqual(2);
    expect(result[1].name).toEqual('Intermediate Level');
    
    expect(result[2].level_number).toEqual(3);
    expect(result[2].name).toEqual('Advanced Level');
  });

  it('should handle levels with null descriptions', async () => {
    // Insert level with null description
    await db.insert(gameLevelsTable).values({
      level_number: 1,
      name: 'Basic Level',
      description: null,
      questions_required: 8,
      letters_introduced: [1, 2, 3, 4],
      is_unlocked: true
    }).execute();

    const result = await getAllLevels();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Basic Level');
    expect(result[0].description).toBeNull();
    expect(result[0].letters_introduced).toEqual([1, 2, 3, 4]);
  });

  it('should handle levels with empty letters_introduced array', async () => {
    // Insert level with empty letters array
    await db.insert(gameLevelsTable).values({
      level_number: 1,
      name: 'Review Level',
      description: 'Review previous letters',
      questions_required: 5,
      letters_introduced: [],
      is_unlocked: true
    }).execute();

    const result = await getAllLevels();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Review Level');
    expect(result[0].letters_introduced).toEqual([]);
    expect(Array.isArray(result[0].letters_introduced)).toBe(true);
  });

  it('should handle multiple levels with mixed unlock states', async () => {
    // Insert multiple levels with different unlock states
    await db.insert(gameLevelsTable).values([
      {
        level_number: 1,
        name: 'Level 1',
        description: 'First level',
        questions_required: 5,
        letters_introduced: [1],
        is_unlocked: true
      },
      {
        level_number: 2,
        name: 'Level 2',
        description: 'Second level',
        questions_required: 8,
        letters_introduced: [2, 3],
        is_unlocked: true
      },
      {
        level_number: 3,
        name: 'Level 3',
        description: 'Third level',
        questions_required: 12,
        letters_introduced: [4, 5, 6],
        is_unlocked: false
      }
    ]).execute();

    const result = await getAllLevels();

    expect(result).toHaveLength(3);
    
    // Check unlock states
    expect(result[0].is_unlocked).toEqual(true);
    expect(result[1].is_unlocked).toEqual(true);
    expect(result[2].is_unlocked).toEqual(false);
    
    // Verify letters_introduced arrays are properly typed
    expect(Array.isArray(result[0].letters_introduced)).toBe(true);
    expect(Array.isArray(result[1].letters_introduced)).toBe(true);
    expect(Array.isArray(result[2].letters_introduced)).toBe(true);
    expect(result[0].letters_introduced).toEqual([1]);
    expect(result[1].letters_introduced).toEqual([2, 3]);
    expect(result[2].letters_introduced).toEqual([4, 5, 6]);
  });
});