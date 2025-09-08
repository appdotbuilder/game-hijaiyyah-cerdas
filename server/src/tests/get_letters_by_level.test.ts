import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hijaiyyahLettersTable } from '../db/schema';
import { getLettersByLevel } from '../handlers/get_letters_by_level';

describe('getLettersByLevel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return letters for a specific level', async () => {
    // Insert test letters for different levels
    await db.insert(hijaiyyahLettersTable).values([
      {
        letter: 'ا',
        name: 'Alif',
        pronunciation: 'alif',
        audio_url: '/audio/alif.mp3',
        level: 1
      },
      {
        letter: 'ب',
        name: 'Ba',
        pronunciation: 'ba',
        audio_url: '/audio/ba.mp3',
        level: 1
      },
      {
        letter: 'ت',
        name: 'Ta',
        pronunciation: 'ta',
        audio_url: '/audio/ta.mp3',
        level: 2
      }
    ]).execute();

    const level1Letters = await getLettersByLevel(1);

    expect(level1Letters).toHaveLength(2);
    expect(level1Letters.every(letter => letter.level === 1)).toBe(true);
    expect(level1Letters.map(letter => letter.letter)).toEqual(['ا', 'ب']);
    
    // Verify all fields are present and correct types
    level1Letters.forEach(letter => {
      expect(letter.id).toBeDefined();
      expect(typeof letter.letter).toBe('string');
      expect(typeof letter.name).toBe('string');
      expect(typeof letter.pronunciation).toBe('string');
      expect(letter.audio_url).toBeDefined();
      expect(typeof letter.level).toBe('number');
      expect(letter.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return letters for level 2', async () => {
    // Insert test letters
    await db.insert(hijaiyyahLettersTable).values([
      {
        letter: 'ا',
        name: 'Alif',
        pronunciation: 'alif',
        audio_url: '/audio/alif.mp3',
        level: 1
      },
      {
        letter: 'ت',
        name: 'Ta',
        pronunciation: 'ta',
        audio_url: '/audio/ta.mp3',
        level: 2
      },
      {
        letter: 'ث',
        name: 'Tha',
        pronunciation: 'tha',
        audio_url: '/audio/tha.mp3',
        level: 2
      }
    ]).execute();

    const level2Letters = await getLettersByLevel(2);

    expect(level2Letters).toHaveLength(2);
    expect(level2Letters.every(letter => letter.level === 2)).toBe(true);
    expect(level2Letters.map(letter => letter.letter)).toEqual(['ت', 'ث']);
  });

  it('should return empty array for non-existent level', async () => {
    // Insert some letters
    await db.insert(hijaiyyahLettersTable).values([
      {
        letter: 'ا',
        name: 'Alif',
        pronunciation: 'alif',
        audio_url: '/audio/alif.mp3',
        level: 1
      }
    ]).execute();

    const nonExistentLevelLetters = await getLettersByLevel(99);

    expect(nonExistentLevelLetters).toHaveLength(0);
    expect(Array.isArray(nonExistentLevelLetters)).toBe(true);
  });

  it('should handle letters with null audio_url', async () => {
    // Insert letter without audio URL
    await db.insert(hijaiyyahLettersTable).values([
      {
        letter: 'ج',
        name: 'Jim',
        pronunciation: 'jim',
        audio_url: null,
        level: 3
      }
    ]).execute();

    const letters = await getLettersByLevel(3);

    expect(letters).toHaveLength(1);
    expect(letters[0].audio_url).toBeNull();
    expect(letters[0].letter).toBe('ج');
    expect(letters[0].level).toBe(3);
  });

  it('should return multiple letters ordered by insertion', async () => {
    // Insert multiple letters for the same level
    const testLetters = [
      { letter: 'ح', name: 'Ha', pronunciation: 'ha', audio_url: '/audio/ha.mp3', level: 4 },
      { letter: 'خ', name: 'Kha', pronunciation: 'kha', audio_url: '/audio/kha.mp3', level: 4 },
      { letter: 'د', name: 'Dal', pronunciation: 'dal', audio_url: '/audio/dal.mp3', level: 4 },
      { letter: 'ذ', name: 'Dhal', pronunciation: 'dhal', audio_url: '/audio/dhal.mp3', level: 4 }
    ];

    await db.insert(hijaiyyahLettersTable).values(testLetters).execute();

    const letters = await getLettersByLevel(4);

    expect(letters).toHaveLength(4);
    expect(letters.every(letter => letter.level === 4)).toBe(true);
    expect(letters.map(letter => letter.letter)).toEqual(['ح', 'خ', 'د', 'ذ']);
    expect(letters.map(letter => letter.name)).toEqual(['Ha', 'Kha', 'Dal', 'Dhal']);
  });
});