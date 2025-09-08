import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { GameSession, GameLevel, Question, HijaiyyahLetter, CreateGameSessionInput } from '../../server/src/schema';
import { GameMenu } from '@/components/GameMenu';
import { GamePlay } from '@/components/GamePlay';
import { GameResults } from '@/components/GameResults';
import './App.css';

type GameState = 'menu' | 'playing' | 'results' | 'game-over';

function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [levels, setLevels] = useState<GameLevel[]>([]);
  const [hijaiyyahLetters, setHijaiyyahLetters] = useState<HijaiyyahLetter[]>([]);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  const loadGameData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [levelsData, lettersData] = await Promise.all([
        trpc.getAllLevels.query(),
        trpc.getHijaiyyahLetters.query()
      ]);
      setLevels(levelsData);
      setHijaiyyahLetters(lettersData);
      setError(null);
    } catch (err) {
      console.error('Failed to load game data:', err);
      // Provide fallback demo data for better user experience
      setLevels([
        {
          id: 1,
          level_number: 1,
          name: "First Letters",
          description: "Learn your first Hijaiyyah letters",
          questions_required: 5,
          letters_introduced: [1, 2, 3],
          is_unlocked: true,
          created_at: new Date()
        },
        {
          id: 2,
          level_number: 2,
          name: "Building Words",
          description: "Combine letters to form simple words",
          questions_required: 5,
          letters_introduced: [4, 5, 6],
          is_unlocked: false,
          created_at: new Date()
        }
      ]);
      setHijaiyyahLetters([
        {
          id: 1,
          letter: "ا",
          name: "Alif",
          pronunciation: "alif",
          audio_url: null,
          level: 1,
          created_at: new Date()
        },
        {
          id: 2,
          letter: "ب",
          name: "Ba",
          pronunciation: "ba",
          audio_url: null,
          level: 1,
          created_at: new Date()
        },
        {
          id: 3,
          letter: "ت",
          name: "Ta",
          pronunciation: "ta",
          audio_url: null,
          level: 1,
          created_at: new Date()
        }
      ]);
      setError('Using demo data - backend connection unavailable');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  const startGame = async (playerName: string, levelNumber: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      // Create game session
      const sessionInput: CreateGameSessionInput = {
        player_name: playerName,
        current_level: levelNumber,
        lives_remaining: 3
      };
      
      let session: GameSession;
      let questions: Question[];

      try {
        session = await trpc.createGameSession.mutate(sessionInput);
        questions = await trpc.getQuestions.query({
          level_id: levelNumber,
          limit: 5
        });
      } catch {
        // Fallback to demo session and questions
        session = {
          id: 1,
          player_name: playerName,
          current_level: levelNumber,
          current_score: 0,
          lives_remaining: 3,
          session_start: new Date(),
          session_end: null,
          is_active: true,
          created_at: new Date()
        };

        questions = [
          {
            id: 1,
            type: 'visual_identification' as const,
            level_id: levelNumber,
            letter_id: 1,
            correct_answer: "Alif",
            options: ["Alif", "Ba", "Ta", "Tha"],
            difficulty: 1,
            created_at: new Date()
          },
          {
            id: 2,
            type: 'visual_identification' as const,
            level_id: levelNumber,
            letter_id: 2,
            correct_answer: "Ba",
            options: ["Alif", "Ba", "Ta", "Tha"],
            difficulty: 1,
            created_at: new Date()
          },
          {
            id: 3,
            type: 'auditory_identification' as const,
            level_id: levelNumber,
            letter_id: 3,
            correct_answer: "ت",
            options: ["ا", "ب", "ت", "ث"],
            difficulty: 1,
            created_at: new Date()
          }
        ];
        setError('Demo mode - backend unavailable');
      }

      setCurrentSession(session);
      setScore(session.current_score);
      setLives(session.lives_remaining);
      setCurrentQuestions(questions);
      setCurrentQuestionIndex(0);
      setGameState('playing');
    } catch (err) {
      console.error('Failed to start game:', err);
      setError('Failed to start game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmit = async (selectedAnswer: string, timeTaken: number) => {
    if (!currentSession || !currentQuestions[currentQuestionIndex]) return;

    const currentQuestion = currentQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;

    try {
      // Try to submit answer to backend, fallback to local calculation
      let pointsEarned = 0;
      try {
        const result = await trpc.submitAnswer.mutate({
          session_id: currentSession.id,
          question_id: currentQuestion.id,
          selected_answer: selectedAnswer,
          time_taken_seconds: timeTaken
        });
        pointsEarned = result.points_earned;
      } catch {
        // Fallback scoring calculation
        const basePoints = 10;
        const speedBonus = Math.max(0, 5 - Math.floor(timeTaken / 2));
        pointsEarned = isCorrect ? basePoints + speedBonus : -2;
      }

      if (isCorrect) {
        // Add points for correct answer
        const newScore = score + Math.max(pointsEarned, 0);
        setScore(newScore);
      } else {
        // Lose a life for incorrect answer
        const newLives = lives - 1;
        setLives(newLives);
        
        if (newLives <= 0) {
          setGameState('game-over');
          return;
        }
      }

      // Move to next question or complete level
      if (currentQuestionIndex + 1 >= currentQuestions.length) {
        // Level completed
        setGameState('results');
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }

    } catch (err) {
      console.error('Failed to submit answer:', err);
      setError('Failed to submit answer. Please try again.');
    }
  };

  const nextLevel = async () => {
    if (!currentSession) return;

    const nextLevelNumber = currentSession.current_level + 1;
    const nextLevel = levels.find(l => l.level_number === nextLevelNumber);
    
    if (nextLevel) {
      // Load questions for next level
      try {
        setIsLoading(true);
        let questions: Question[];
        
        try {
          questions = await trpc.getQuestions.query({
            level_id: nextLevelNumber,
            limit: 5
          });
        } catch {
          // Fallback demo questions for level 2
          questions = [
            {
              id: 4,
              type: 'visual_identification' as const,
              level_id: nextLevelNumber,
              letter_id: 4,
              correct_answer: "Jim",
              options: ["Jim", "Ha", "Kha", "Dal"],
              difficulty: 2,
              created_at: new Date()
            },
            {
              id: 5,
              type: 'auditory_identification' as const,
              level_id: nextLevelNumber,
              letter_id: 5,
              correct_answer: "ح",
              options: ["ج", "ح", "خ", "د"],
              difficulty: 2,
              created_at: new Date()
            }
          ];
        }
        
        setCurrentQuestions(questions);
        setCurrentQuestionIndex(0);
        setCurrentSession({ ...currentSession, current_level: nextLevelNumber });
        setGameState('playing');
      } catch (err) {
        console.error('Failed to load next level:', err);
        setError('Failed to load next level.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Game completed
      setGameState('menu');
    }
  };

  const restartGame = () => {
    setCurrentSession(null);
    setCurrentQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setLives(3);
    setGameState('menu');
    setError(null);
  };

  if (isLoading && gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-400 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-lg font-semibold">Loading Game...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-400">
      {/* Header with game info */}
      {gameState !== 'menu' && currentSession && (
        <div className="bg-white/20 backdrop-blur-sm border-b border-white/30 p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">🌟 Game Hijaiyyah Cerdas</h1>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                Level {currentSession.current_level}
              </Badge>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">Score:</span>
                <Badge className="bg-yellow-500 text-white text-lg px-3 py-1">
                  {score} 🏆
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">Lives:</span>
                <div className="flex gap-1">
                  {Array.from({ length: 3 }, (_, i) => (
                    <span key={i} className="text-2xl">
                      {i < lives ? '❤️' : '💔'}
                    </span>
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={restartGame}
                variant="outline"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                🏠 Menu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="max-w-4xl mx-auto p-4">
          <Alert className="bg-red-100 border-red-300">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Game content */}
      <div className="max-w-4xl mx-auto p-4">
        {gameState === 'menu' && (
          <GameMenu
            levels={levels}
            onStartGame={startGame}
            isLoading={isLoading}
          />
        )}

        {gameState === 'playing' && currentSession && currentQuestions.length > 0 && (
          <GamePlay
            question={currentQuestions[currentQuestionIndex]}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={currentQuestions.length}
            hijaiyyahLetters={hijaiyyahLetters}
            onAnswerSubmit={handleAnswerSubmit}
            isLoading={isLoading}
          />
        )}

        {gameState === 'results' && currentSession && (
          <GameResults
            score={score}
            level={currentSession.current_level}
            questionsAnswered={currentQuestions.length}
            onNextLevel={nextLevel}
            onRestartGame={restartGame}
            hasNextLevel={levels.some(l => l.level_number === currentSession.current_level + 1)}
          />
        )}

        {gameState === 'game-over' && currentSession && (
          <Card className="max-w-md mx-auto mt-16 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-3xl text-red-500">💔 Game Over!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="space-y-2">
                <p className="text-lg">Don't worry, {currentSession.player_name}!</p>
                <p className="text-gray-600">You can try again and do better! 💪</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Final Score</p>
                <p className="text-2xl font-bold text-purple-600">{score} 🏆</p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => startGame(currentSession.player_name, currentSession.current_level)}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                  size="lg"
                >
                  🔄 Try Again
                </Button>
                <Button 
                  onClick={restartGame}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  🏠 Back to Menu
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;