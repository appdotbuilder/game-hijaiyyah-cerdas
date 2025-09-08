import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameSessionsTable } from '../db/schema';
import { type CreateGameSessionInput } from '../schema';
import { createGameSession } from '../handlers/create_game_session';
import { eq } from 'drizzle-orm';

// Test input with all fields specified
const testInput: CreateGameSessionInput = {
  player_name: 'Test Player',
  current_level: 1,
  lives_remaining: 3
};

describe('createGameSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a game session with all fields', async () => {
    const result = await createGameSession(testInput);

    // Basic field validation
    expect(result.player_name).toEqual('Test Player');
    expect(result.current_level).toEqual(1);
    expect(result.current_score).toEqual(0); // Should always start with 0
    expect(result.lives_remaining).toEqual(3);
    expect(result.session_end).toBeNull(); // Should be null for active sessions
    expect(result.is_active).toBe(true); // Should always be true for new sessions
    expect(result.id).toBeDefined();
    expect(result.session_start).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a game session with default values', async () => {
    // Test that defaults are properly applied when values are not provided
    const inputWithDefaults: CreateGameSessionInput = {
      player_name: 'Default Player',
      current_level: 1, // Zod default
      lives_remaining: 3 // Zod default
    };

    const result = await createGameSession(inputWithDefaults);

    expect(result.player_name).toEqual('Default Player');
    expect(result.current_level).toEqual(1); // Zod default
    expect(result.lives_remaining).toEqual(3); // Zod default
    expect(result.current_score).toEqual(0);
    expect(result.is_active).toBe(true);
  });

  it('should save game session to database', async () => {
    const result = await createGameSession(testInput);

    // Query the database to verify the session was saved
    const sessions = await db.select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.id, result.id))
      .execute();

    expect(sessions).toHaveLength(1);
    const savedSession = sessions[0];
    
    expect(savedSession.player_name).toEqual('Test Player');
    expect(savedSession.current_level).toEqual(1);
    expect(savedSession.current_score).toEqual(0);
    expect(savedSession.lives_remaining).toEqual(3);
    expect(savedSession.session_end).toBeNull();
    expect(savedSession.is_active).toBe(true);
    expect(savedSession.session_start).toBeInstanceOf(Date);
    expect(savedSession.created_at).toBeInstanceOf(Date);
  });

  it('should create multiple unique sessions for the same player', async () => {
    const firstSession = await createGameSession(testInput);
    const secondSession = await createGameSession({
      ...testInput,
      current_level: 2
    });

    // Both sessions should exist and have different IDs
    expect(firstSession.id).not.toEqual(secondSession.id);
    expect(firstSession.player_name).toEqual(secondSession.player_name);
    expect(firstSession.current_level).toEqual(1);
    expect(secondSession.current_level).toEqual(2);

    // Verify both are in database
    const allSessions = await db.select()
      .from(gameSessionsTable)
      .execute();

    expect(allSessions).toHaveLength(2);
  });

  it('should handle different player names correctly', async () => {
    const player1Session = await createGameSession({
      player_name: 'Player One',
      current_level: 1,
      lives_remaining: 3
    });

    const player2Session = await createGameSession({
      player_name: 'Player Two',
      current_level: 2,
      lives_remaining: 5
    });

    expect(player1Session.player_name).toEqual('Player One');
    expect(player2Session.player_name).toEqual('Player Two');
    expect(player1Session.current_level).toEqual(1);
    expect(player2Session.current_level).toEqual(2);
    expect(player1Session.lives_remaining).toEqual(3);
    expect(player2Session.lives_remaining).toEqual(5);
  });

  it('should set session timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createGameSession(testInput);
    const afterCreation = new Date();

    // Session start should be within the test timeframe
    expect(result.session_start.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.session_start.getTime()).toBeLessThanOrEqual(afterCreation.getTime());

    // Created at should be within the test timeframe
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());

    // Session end should be null for active sessions
    expect(result.session_end).toBeNull();
  });
});