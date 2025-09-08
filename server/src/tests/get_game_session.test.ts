import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameSessionsTable } from '../db/schema';
import { type GetGameSessionInput } from '../schema';
import { getGameSession } from '../handlers/get_game_session';

// Test input for getting a game session
const testInput: GetGameSessionInput = {
  session_id: 1
};

describe('getGameSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve an existing game session', async () => {
    // Create a test game session first
    const sessionData = {
      player_name: 'Test Player',
      current_level: 2,
      current_score: 150,
      lives_remaining: 2,
      is_active: true
    };

    const insertResult = await db.insert(gameSessionsTable)
      .values(sessionData)
      .returning()
      .execute();

    const createdSession = insertResult[0];

    // Now retrieve the session using our handler
    const result = await getGameSession({ session_id: createdSession.id });

    // Verify the retrieved session matches what we created
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdSession.id);
    expect(result!.player_name).toEqual('Test Player');
    expect(result!.current_level).toEqual(2);
    expect(result!.current_score).toEqual(150);
    expect(result!.lives_remaining).toEqual(2);
    expect(result!.is_active).toEqual(true);
    expect(result!.session_start).toBeInstanceOf(Date);
    expect(result!.session_end).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent session', async () => {
    // Try to get a session that doesn't exist
    const result = await getGameSession({ session_id: 999 });

    expect(result).toBeNull();
  });

  it('should retrieve session with ended session data', async () => {
    // Create a completed game session
    const endTime = new Date();
    const sessionData = {
      player_name: 'Completed Player',
      current_level: 5,
      current_score: 500,
      lives_remaining: 0,
      session_end: endTime,
      is_active: false
    };

    const insertResult = await db.insert(gameSessionsTable)
      .values(sessionData)
      .returning()
      .execute();

    const createdSession = insertResult[0];

    // Retrieve the ended session
    const result = await getGameSession({ session_id: createdSession.id });

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdSession.id);
    expect(result!.player_name).toEqual('Completed Player');
    expect(result!.current_level).toEqual(5);
    expect(result!.current_score).toEqual(500);
    expect(result!.lives_remaining).toEqual(0);
    expect(result!.is_active).toEqual(false);
    expect(result!.session_end).toBeInstanceOf(Date);
    expect(result!.session_end!.getTime()).toEqual(endTime.getTime());
  });

  it('should handle session with default values correctly', async () => {
    // Create a session with minimal data (relying on defaults)
    const sessionData = {
      player_name: 'Default Player'
      // Other fields should use database defaults
    };

    const insertResult = await db.insert(gameSessionsTable)
      .values(sessionData)
      .returning()
      .execute();

    const createdSession = insertResult[0];

    // Retrieve the session
    const result = await getGameSession({ session_id: createdSession.id });

    expect(result).not.toBeNull();
    expect(result!.player_name).toEqual('Default Player');
    expect(result!.current_level).toEqual(1); // Default value
    expect(result!.current_score).toEqual(0); // Default value
    expect(result!.lives_remaining).toEqual(3); // Default value
    expect(result!.is_active).toEqual(true); // Default value
    expect(result!.session_end).toBeNull();
    expect(result!.session_start).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return correct data types for all fields', async () => {
    // Create a test session
    const sessionData = {
      player_name: 'Type Test Player',
      current_level: 3,
      current_score: 250,
      lives_remaining: 1
    };

    const insertResult = await db.insert(gameSessionsTable)
      .values(sessionData)
      .returning()
      .execute();

    const createdSession = insertResult[0];

    // Retrieve and verify types
    const result = await getGameSession({ session_id: createdSession.id });

    expect(result).not.toBeNull();
    expect(typeof result!.id).toBe('number');
    expect(typeof result!.player_name).toBe('string');
    expect(typeof result!.current_level).toBe('number');
    expect(typeof result!.current_score).toBe('number');
    expect(typeof result!.lives_remaining).toBe('number');
    expect(typeof result!.is_active).toBe('boolean');
    expect(result!.session_start).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.session_end).toBeNull(); // Should be null for active session
  });
});