import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import type { GameLevel } from '../../../server/src/schema';

interface GameMenuProps {
  levels: GameLevel[];
  onStartGame: (playerName: string, levelNumber: number) => void;
  isLoading: boolean;
}

export function GameMenu({ levels, onStartGame, isLoading }: GameMenuProps) {
  const [playerName, setPlayerName] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(1);

  const handleStartGame = () => {
    if (playerName.trim()) {
      onStartGame(playerName.trim(), selectedLevel);
    }
  };

  return (
    <div className="space-y-8 mt-8">
      {/* Game Title */}
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
          🌟 Game Hijaiyyah Cerdas 🌟
        </h1>
        <p className="text-xl text-white/90 mb-2">
          Learn Arabic Letters Through Fun Games! 📚
        </p>
        <p className="text-lg text-white/80">
          Perfect for young learners to master Hijaiyyah letters ✨
        </p>
      </div>

      {/* Start Game Card */}
      <Card className="max-w-lg mx-auto bg-white/95 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-3xl text-purple-600 flex items-center justify-center gap-2">
            🎮 Start Your Adventure!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Player Name Input */}
          <div className="space-y-2">
            <Label htmlFor="playerName" className="text-lg font-semibold text-gray-700">
              What's your name? 😊
            </Label>
            <Input
              id="playerName"
              type="text"
              placeholder="Enter your name here..."
              value={playerName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlayerName(e.target.value)}
              className="text-lg p-3 border-2 border-purple-300 focus:border-purple-500"
              maxLength={20}
            />
          </div>

          {/* Level Selection */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold text-gray-700">
              Choose Your Level 🎯
            </Label>
            <div className="grid gap-2">
              {levels.map((level: GameLevel) => (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.level_number)}
                  disabled={!level.is_unlocked}
                  className={`p-4 rounded-lg text-left transition-all ${
                    selectedLevel === level.level_number
                      ? 'bg-purple-100 border-2 border-purple-500 shadow-md'
                      : level.is_unlocked
                      ? 'bg-gray-50 border border-gray-300 hover:bg-purple-50'
                      : 'bg-gray-100 border border-gray-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={selectedLevel === level.level_number ? 'default' : 'secondary'}
                          className="text-sm"
                        >
                          Level {level.level_number}
                        </Badge>
                        {!level.is_unlocked && <span className="text-lg">🔒</span>}
                        {level.is_unlocked && <span className="text-lg">🔓</span>}
                      </div>
                      <h3 className="font-semibold text-purple-700">{level.name}</h3>
                      {level.description && (
                        <p className="text-sm text-gray-600 mt-1">{level.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {level.questions_required} questions to complete
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <Button
            onClick={handleStartGame}
            disabled={!playerName.trim() || isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xl py-4"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Starting Game...
              </>
            ) : (
              <>🚀 Start Playing!</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Game Instructions */}
      <Card className="max-w-4xl mx-auto bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-purple-600">
            📖 How to Play
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">👀</span>
                <div>
                  <h3 className="font-semibold text-purple-700">Visual Identification</h3>
                  <p className="text-gray-600">See a Hijaiyyah letter and choose its correct name from the options.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-2xl">👂</span>
                <div>
                  <h3 className="font-semibold text-purple-700">Auditory Identification</h3>
                  <p className="text-gray-600">Listen to the pronunciation and select the correct letter.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <h3 className="font-semibold text-purple-700">Scoring</h3>
                  <p className="text-gray-600">Earn points for correct answers. Answer faster to get bonus points!</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="text-2xl">❤️</span>
                <div>
                  <h3 className="font-semibold text-purple-700">Lives System</h3>
                  <p className="text-gray-600">You start with 3 lives. Wrong answers cost a life. Don't lose them all!</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}