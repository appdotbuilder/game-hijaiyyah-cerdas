import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameSessionsTable } from '../db/schema';
import { type UpdateGameSessionInput } from '../schema';
import { updateGameSession } from '../handlers/update_game_session';
import { eq } from 'drizzle-orm';

describe('updateGameSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update game session level and score', async () => {
    // Create initial game session
    const initialSession = await db.insert(gameSessionsTable)
      .values({
        player_name: 'Test Player',
        current_level: 1,
        current_score: 0,
        lives_remaining: 3,
        is_active: true
      })
      .returning()
      .execute();

    const sessionId = initialSession[0].id;

    const updateInput: UpdateGameSessionInput = {
      id: sessionId,
      current_level: 2,
      current_score: 150
    };

    const result = await updateGameSession(updateInput);

    // Verify the updated fields
    expect(result.id).toEqual(sessionId);
    expect(result.current_level).toEqual(2);
    expect(result.current_score).toEqual(150);
    expect(result.lives_remaining).toEqual(3); // Should remain unchanged
    expect(result.is_active).toEqual(true); // Should remain unchanged
    expect(result.player_name).toEqual('Test Player');
    expect(result.session_end).toBeNull(); // Should still be null since active
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.session_start).toBeInstanceOf(Date);
  });

  it('should update lives remaining', async () => {
    // Create initial game session
    const initialSession = await db.insert(gameSessionsTable)
      .values({
        player_name: 'Player Two',
        current_level: 3,
        current_score: 200,
        lives_remaining: 3,
        is_active: true
      })
      .returning()
      .execute();

    const sessionId = initialSession[0].id;

    const updateInput: UpdateGameSessionInput = {
      id: sessionId,
      lives_remaining: 1
    };

    const result = await updateGameSession(updateInput);

    expect(result.lives_remaining).toEqual(1);
    expect(result.current_level).toEqual(3); // Should remain unchanged
    expect(result.current_score).toEqual(200); // Should remain unchanged
    expect(result.is_active).toEqual(true);
  });

  it('should deactivate session and set end time', async () => {
    // Create initial game session
    const initialSession = await db.insert(gameSessionsTable)
      .values({
        player_name: 'Ending Player',
        current_level: 5,
        current_score: 500,
        lives_remaining: 0,
        is_active: true
      })
      .returning()
      .execute();

    const sessionId = initialSession[0].id;

    const updateInput: UpdateGameSessionInput = {
      id: sessionId,
      is_active: false
    };

    const result = await updateGameSession(updateInput);

    expect(result.is_active).toEqual(false);
    expect(result.session_end).toBeInstanceOf(Date);
    expect(result.session_end).not.toBeNull();
    expect(result.current_level).toEqual(5); // Should remain unchanged
    expect(result.current_score).toEqual(500); // Should remain unchanged
  });

  it('should update multiple fields at once', async () => {
    // Create initial game session
    const initialSession = await db.insert(gameSessionsTable)
      .values({
        player_name: 'Multi Update Player',
        current_level: 1,
        current_score: 50,
        lives_remaining: 3,
        is_active: true
      })
      .returning()
      .execute();

    const sessionId = initialSession[0].id;

    const updateInput: UpdateGameSessionInput = {
      id: sessionId,
      current_level: 4,
      current_score: 750,
      lives_remaining: 2,
      is_active: false
    };

    const result = await updateGameSession(updateInput);

    expect(result.current_level).toEqual(4);
    expect(result.current_score).toEqual(750);
    expect(result.lives_remaining).toEqual(2);
    expect(result.is_active).toEqual(false);
    expect(result.session_end).toBeInstanceOf(Date);
    expect(result.player_name).toEqual('Multi Update Player');
  });

  it('should save changes to database', async () => {
    // Create initial game session
    const initialSession = await db.insert(gameSessionsTable)
      .values({
        player_name: 'DB Test Player',
        current_level: 2,
        current_score: 100,
        lives_remaining: 2,
        is_active: true
      })
      .returning()
      .execute();

    const sessionId = initialSession[0].id;

    const updateInput: UpdateGameSessionInput = {
      id: sessionId,
      current_level: 3,
      current_score: 200
    };

    await updateGameSession(updateInput);

    // Verify changes were saved to database
    const updatedSession = await db.select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.id, sessionId))
      .execute();

    expect(updatedSession).toHaveLength(1);
    expect(updatedSession[0].current_level).toEqual(3);
    expect(updatedSession[0].current_score).toEqual(200);
    expect(updatedSession[0].lives_remaining).toEqual(2);
    expect(updatedSession[0].is_active).toEqual(true);
    expect(updatedSession[0].session_end).toBeNull();
  });

  it('should throw error for non-existent session', async () => {
    const updateInput: UpdateGameSessionInput = {
      id: 999, // Non-existent ID
      current_score: 100
    };

    await expect(updateGameSession(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Create initial game session
    const initialSession = await db.insert(gameSessionsTable)
      .values({
        player_name: 'Partial Player',
        current_level: 2,
        current_score: 150,
        lives_remaining: 2,
        is_active: true
      })
      .returning()
      .execute();

    const sessionId = initialSession[0].id;

    // Update only the score
    const updateInput: UpdateGameSessionInput = {
      id: sessionId,
      current_score: 250
    };

    const result = await updateGameSession(updateInput);

    // Verify only score changed
    expect(result.current_score).toEqual(250);
    expect(result.current_level).toEqual(2); // Unchanged
    expect(result.lives_remaining).toEqual(2); // Unchanged
    expect(result.is_active).toEqual(true); // Unchanged
    expect(result.session_end).toBeNull(); // Unchanged
  });

  it('should handle zero values correctly', async () => {
    // Create initial game session
    const initialSession = await db.insert(gameSessionsTable)
      .values({
        player_name: 'Zero Player',
        current_level: 3,
        current_score: 300,
        lives_remaining: 1,
        is_active: true
      })
      .returning()
      .execute();

    const sessionId = initialSession[0].id;

    const updateInput: UpdateGameSessionInput = {
      id: sessionId,
      current_score: 0,
      lives_remaining: 0
    };

    const result = await updateGameSession(updateInput);

    expect(result.current_score).toEqual(0);
    expect(result.lives_remaining).toEqual(0);
    expect(result.current_level).toEqual(3); // Unchanged
  });
});