import { z } from 'zod';

// Hijaiyyah letter schema
export const hijaiyyahLetterSchema = z.object({
  id: z.number(),
  letter: z.string(),
  name: z.string(),
  pronunciation: z.string(),
  audio_url: z.string().nullable(),
  level: z.number().int(),
  created_at: z.coerce.date()
});

export type HijaiyyahLetter = z.infer<typeof hijaiyyahLetterSchema>;

// Game level schema
export const gameLevelSchema = z.object({
  id: z.number(),
  level_number: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
  questions_required: z.number().int(),
  letters_introduced: z.array(z.number()),
  is_unlocked: z.boolean(),
  created_at: z.coerce.date()
});

export type GameLevel = z.infer<typeof gameLevelSchema>;

// Game session schema
export const gameSessionSchema = z.object({
  id: z.number(),
  player_name: z.string(),
  current_level: z.number().int(),
  current_score: z.number().int(),
  lives_remaining: z.number().int(),
  session_start: z.coerce.date(),
  session_end: z.coerce.date().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date()
});

export type GameSession = z.infer<typeof gameSessionSchema>;

// Question schema
export const questionSchema = z.object({
  id: z.number(),
  type: z.enum(['visual_identification', 'auditory_identification']),
  level_id: z.number(),
  letter_id: z.number(),
  correct_answer: z.string(),
  options: z.array(z.string()),
  difficulty: z.number().int(),
  created_at: z.coerce.date()
});

export type Question = z.infer<typeof questionSchema>;

// Game answer schema
export const gameAnswerSchema = z.object({
  id: z.number(),
  session_id: z.number(),
  question_id: z.number(),
  selected_answer: z.string(),
  is_correct: z.boolean(),
  time_taken_seconds: z.number(),
  points_earned: z.number().int(),
  answered_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type GameAnswer = z.infer<typeof gameAnswerSchema>;

// Input schemas for creating/updating data

// Create game session input
export const createGameSessionInputSchema = z.object({
  player_name: z.string().min(1, "Player name is required"),
  current_level: z.number().int().default(1),
  lives_remaining: z.number().int().default(3)
});

export type CreateGameSessionInput = z.infer<typeof createGameSessionInputSchema>;

// Update game session input
export const updateGameSessionInputSchema = z.object({
  id: z.number(),
  current_level: z.number().int().optional(),
  current_score: z.number().int().optional(),
  lives_remaining: z.number().int().optional(),
  is_active: z.boolean().optional()
});

export type UpdateGameSessionInput = z.infer<typeof updateGameSessionInputSchema>;

// Submit answer input
export const submitAnswerInputSchema = z.object({
  session_id: z.number(),
  question_id: z.number(),
  selected_answer: z.string(),
  time_taken_seconds: z.number().positive()
});

export type SubmitAnswerInput = z.infer<typeof submitAnswerInputSchema>;

// Get questions input
export const getQuestionsInputSchema = z.object({
  level_id: z.number(),
  question_type: z.enum(['visual_identification', 'auditory_identification']).optional(),
  limit: z.number().int().default(10)
});

export type GetQuestionsInput = z.infer<typeof getQuestionsInputSchema>;

// Get game session input
export const getGameSessionInputSchema = z.object({
  session_id: z.number()
});

export type GetGameSessionInput = z.infer<typeof getGameSessionInputSchema>;

// Get level input
export const getLevelInputSchema = z.object({
  level_number: z.number().int()
});

export type GetLevelInput = z.infer<typeof getLevelInputSchema>;