import { serial, text, pgTable, timestamp, integer, boolean, json, pgEnum } from 'drizzle-orm/pg-core';

// Enum for question types
export const questionTypeEnum = pgEnum('question_type', ['visual_identification', 'auditory_identification']);

// Hijaiyyah letters table
export const hijaiyyahLettersTable = pgTable('hijaiyyah_letters', {
  id: serial('id').primaryKey(),
  letter: text('letter').notNull(),
  name: text('name').notNull(),
  pronunciation: text('pronunciation').notNull(),
  audio_url: text('audio_url'), // Nullable for audio file URLs
  level: integer('level').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Game levels table
export const gameLevelsTable = pgTable('game_levels', {
  id: serial('id').primaryKey(),
  level_number: integer('level_number').notNull(),
  name: text('name').notNull(),
  description: text('description'), // Nullable description
  questions_required: integer('questions_required').notNull(),
  letters_introduced: json('letters_introduced').notNull(), // Array of letter IDs introduced in this level
  is_unlocked: boolean('is_unlocked').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Game sessions table
export const gameSessionsTable = pgTable('game_sessions', {
  id: serial('id').primaryKey(),
  player_name: text('player_name').notNull(),
  current_level: integer('current_level').default(1).notNull(),
  current_score: integer('current_score').default(0).notNull(),
  lives_remaining: integer('lives_remaining').default(3).notNull(),
  session_start: timestamp('session_start').defaultNow().notNull(),
  session_end: timestamp('session_end'), // Nullable until session ends
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Questions table
export const questionsTable = pgTable('questions', {
  id: serial('id').primaryKey(),
  type: questionTypeEnum('type').notNull(),
  level_id: integer('level_id').notNull(),
  letter_id: integer('letter_id').notNull(),
  correct_answer: text('correct_answer').notNull(),
  options: json('options').notNull(), // Array of answer options
  difficulty: integer('difficulty').default(1).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Game answers table
export const gameAnswersTable = pgTable('game_answers', {
  id: serial('id').primaryKey(),
  session_id: integer('session_id').notNull(),
  question_id: integer('question_id').notNull(),
  selected_answer: text('selected_answer').notNull(),
  is_correct: boolean('is_correct').notNull(),
  time_taken_seconds: integer('time_taken_seconds').notNull(), // Time in seconds
  points_earned: integer('points_earned').default(0).notNull(),
  answered_at: timestamp('answered_at').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type HijaiyyahLetter = typeof hijaiyyahLettersTable.$inferSelect;
export type NewHijaiyyahLetter = typeof hijaiyyahLettersTable.$inferInsert;

export type GameLevel = typeof gameLevelsTable.$inferSelect;
export type NewGameLevel = typeof gameLevelsTable.$inferInsert;

export type GameSession = typeof gameSessionsTable.$inferSelect;
export type NewGameSession = typeof gameSessionsTable.$inferInsert;

export type Question = typeof questionsTable.$inferSelect;
export type NewQuestion = typeof questionsTable.$inferInsert;

export type GameAnswer = typeof gameAnswersTable.$inferSelect;
export type NewGameAnswer = typeof gameAnswersTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  hijaiyyahLetters: hijaiyyahLettersTable,
  gameLevels: gameLevelsTable,
  gameSessions: gameSessionsTable,
  questions: questionsTable,
  gameAnswers: gameAnswersTable
};