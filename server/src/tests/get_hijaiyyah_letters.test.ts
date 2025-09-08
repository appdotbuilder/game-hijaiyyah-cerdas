import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hijaiyyahLettersTable } from '../db/schema';
import { getHijaiyyahLetters } from '../handlers/get_hijaiyyah_letters';

describe('getHijaiyyahLetters', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no letters exist', async () => {
    const result = await getHijaiyyahLetters();
    expect(result).toEqual([]);
  });

  it('should return all Hijaiyyah letters', async () => {
    // Insert test data
    const testLetters = [
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
        audio_url: null, // Test nullable audio_url
        level: 2
      }
    ];

    await db.insert(hijaiyyahLettersTable)
      .values(testLetters)
      .execute();

    const result = await getHijaiyyahLetters();

    expect(result).toHaveLength(3);
    
    // Verify first letter
    expect(result[0].letter).toEqual('ا');
    expect(result[0].name).toEqual('Alif');
    expect(result[0].pronunciation).toEqual('alif');
    expect(result[0].audio_url).toEqual('/audio/alif.mp3');
    expect(result[0].level).toEqual(1);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify nullable audio_url handling
    const taLetter = result.find(letter => letter.name === 'Ta');
    expect(taLetter).toBeDefined();
    expect(taLetter!.audio_url).toBeNull();
  });

  it('should return letters ordered by level and then by id', async () => {
    // Insert test data in different order to test sorting
    const testLetters = [
      {
        letter: 'ت',
        name: 'Ta',
        pronunciation: 'ta',
        audio_url: '/audio/ta.mp3',
        level: 2
      },
      {
        letter: 'ب',
        name: 'Ba',
        pronunciation: 'ba',
        audio_url: '/audio/ba.mp3',
        level: 1
      },
      {
        letter: 'ا',
        name: 'Alif',
        pronunciation: 'alif',
        audio_url: '/audio/alif.mp3',
        level: 1
      },
      {
        letter: 'ث',
        name: 'Tha',
        pronunciation: 'tha',
        audio_url: '/audio/tha.mp3',
        level: 2
      }
    ];

    await db.insert(hijaiyyahLettersTable)
      .values(testLetters)
      .execute();

    const result = await getHijaiyyahLetters();

    expect(result).toHaveLength(4);
    
    // Should be ordered by level first (1, 1, 2, 2), then by id (ascending)
    expect(result[0].level).toEqual(1); // Ba (inserted first at level 1)
    expect(result[1].level).toEqual(1); // Alif (inserted second at level 1)
    expect(result[2].level).toEqual(2); // Ta (inserted first at level 2)
    expect(result[3].level).toEqual(2); // Tha (inserted second at level 2)

    // Verify the letters are in the correct order within each level
    expect(result[0].name).toEqual('Ba');
    expect(result[1].name).toEqual('Alif');
    expect(result[2].name).toEqual('Ta');
    expect(result[3].name).toEqual('Tha');
  });

  it('should handle different levels correctly', async () => {
    // Insert letters across multiple levels
    const testLetters = [
      { letter: 'ا', name: 'Alif', pronunciation: 'alif', audio_url: '/audio/alif.mp3', level: 1 },
      { letter: 'ب', name: 'Ba', pronunciation: 'ba', audio_url: '/audio/ba.mp3', level: 1 },
      { letter: 'ت', name: 'Ta', pronunciation: 'ta', audio_url: '/audio/ta.mp3', level: 2 },
      { letter: 'ث', name: 'Tha', pronunciation: 'tha', audio_url: '/audio/tha.mp3', level: 2 },
      { letter: 'ج', name: 'Jim', pronunciation: 'jim', audio_url: '/audio/jim.mp3', level: 3 }
    ];

    await db.insert(hijaiyyahLettersTable)
      .values(testLetters)
      .execute();

    const result = await getHijaiyyahLetters();

    expect(result).toHaveLength(5);

    // Check level distribution
    const level1Letters = result.filter(letter => letter.level === 1);
    const level2Letters = result.filter(letter => letter.level === 2);
    const level3Letters = result.filter(letter => letter.level === 3);

    expect(level1Letters).toHaveLength(2);
    expect(level2Letters).toHaveLength(2);
    expect(level3Letters).toHaveLength(1);

    // Verify all levels appear in ascending order
    const levels = result.map(letter => letter.level);
    expect(levels).toEqual([1, 1, 2, 2, 3]);
  });

  it('should return all required fields for each letter', async () => {
    // Insert a complete letter record
    await db.insert(hijaiyyahLettersTable)
      .values({
        letter: 'خ',
        name: 'Kha',
        pronunciation: 'kha',
        audio_url: '/audio/kha.mp3',
        level: 3
      })
      .execute();

    const result = await getHijaiyyahLetters();

    expect(result).toHaveLength(1);
    const letter = result[0];

    // Verify all schema fields are present
    expect(letter).toHaveProperty('id');
    expect(letter).toHaveProperty('letter');
    expect(letter).toHaveProperty('name');
    expect(letter).toHaveProperty('pronunciation');
    expect(letter).toHaveProperty('audio_url');
    expect(letter).toHaveProperty('level');
    expect(letter).toHaveProperty('created_at');

    // Verify field types
    expect(typeof letter.id).toBe('number');
    expect(typeof letter.letter).toBe('string');
    expect(typeof letter.name).toBe('string');
    expect(typeof letter.pronunciation).toBe('string');
    expect(typeof letter.level).toBe('number');
    expect(letter.created_at).toBeInstanceOf(Date);
  });
});