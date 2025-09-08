import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createGameSessionInputSchema,
  updateGameSessionInputSchema,
  submitAnswerInputSchema,
  getQuestionsInputSchema,
  getGameSessionInputSchema,
  getLevelInputSchema
} from './schema';

// Import handlers
import { createGameSession } from './handlers/create_game_session';
import { getGameSession } from './handlers/get_game_session';
import { updateGameSession } from './handlers/update_game_session';
import { getLevel } from './handlers/get_level';
import { getAllLevels } from './handlers/get_all_levels';
import { getQuestions } from './handlers/get_questions';
import { submitAnswer } from './handlers/submit_answer';
import { getHijaiyyahLetters } from './handlers/get_hijaiyyah_letters';
import { getLettersByLevel } from './handlers/get_letters_by_level';
import { getSessionProgress } from './handlers/get_session_progress';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Game session management
  createGameSession: publicProcedure
    .input(createGameSessionInputSchema)
    .mutation(({ input }) => createGameSession(input)),

  getGameSession: publicProcedure
    .input(getGameSessionInputSchema)
    .query(({ input }) => getGameSession(input)),

  updateGameSession: publicProcedure
    .input(updateGameSessionInputSchema)
    .mutation(({ input }) => updateGameSession(input)),

  getSessionProgress: publicProcedure
    .input(getGameSessionInputSchema)
    .query(({ input }) => getSessionProgress(input.session_id)),

  // Level management
  getLevel: publicProcedure
    .input(getLevelInputSchema)
    .query(({ input }) => getLevel(input)),

  getAllLevels: publicProcedure
    .query(() => getAllLevels()),

  // Question and answer management
  getQuestions: publicProcedure
    .input(getQuestionsInputSchema)
    .query(({ input }) => getQuestions(input)),

  submitAnswer: publicProcedure
    .input(submitAnswerInputSchema)
    .mutation(({ input }) => submitAnswer(input)),

  // Hijaiyyah letters
  getHijaiyyahLetters: publicProcedure
    .query(() => getHijaiyyahLetters()),

  getLettersByLevel: publicProcedure
    .input(getLevelInputSchema)
    .query(({ input }) => getLettersByLevel(input.level_number)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Game Hijaiyyah Cerdas TRPC server listening at port: ${port}`);
}

start();