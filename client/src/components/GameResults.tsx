import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GameResultsProps {
  score: number;
  level: number;
  questionsAnswered: number;
  onNextLevel: () => void;
  onRestartGame: () => void;
  hasNextLevel: boolean;
}

export function GameResults({ 
  score, 
  level, 
  questionsAnswered, 
  onNextLevel, 
  onRestartGame,
  hasNextLevel 
}: GameResultsProps) {
  // Calculate performance rating based on score
  const getPerformanceRating = () => {
    const avgScore = score / questionsAnswered;
    if (avgScore >= 80) return { rating: 'Excellent!', emoji: '🌟', color: 'text-yellow-500' };
    if (avgScore >= 60) return { rating: 'Great Job!', emoji: '🎉', color: 'text-green-500' };
    if (avgScore >= 40) return { rating: 'Good Work!', emoji: '👍', color: 'text-blue-500' };
    return { rating: 'Keep Practicing!', emoji: '💪', color: 'text-purple-500' };
  };

  const performance = getPerformanceRating();

  return (
    <div className="max-w-lg mx-auto mt-16 space-y-6">
      {/* Celebration Card */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-4 border-yellow-300">
        <CardHeader className="text-center pb-4">
          <div className="text-6xl mb-4">🎊</div>
          <CardTitle className="text-4xl text-purple-600 mb-2">
            Level {level} Complete!
          </CardTitle>
          <p className="text-xl text-gray-600">
            Amazing work! You finished all the questions! 🏆
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Performance Rating */}
          <div className="text-center bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6 border-2 border-purple-300">
            <div className="text-4xl mb-2">{performance.emoji}</div>
            <h3 className={`text-2xl font-bold ${performance.color}`}>
              {performance.rating}
            </h3>
            <p className="text-purple-600 mt-2">
              You're becoming a Hijaiyyah master! ✨
            </p>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center border-2 border-blue-200">
                <p className="text-sm text-blue-600 mb-1">Total Score</p>
                <p className="text-2xl font-bold text-blue-700">{score} 🏆</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 text-center border-2 border-green-200">
                <p className="text-sm text-green-600 mb-1">Questions</p>
                <p className="text-2xl font-bold text-green-700">{questionsAnswered} ✅</p>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 text-center border-2 border-purple-200">
              <p className="text-sm text-purple-600 mb-1">Average Score per Question</p>
              <p className="text-xl font-bold text-purple-700">
                {Math.round(score / questionsAnswered)} points 📊
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {hasNextLevel ? (
              <>
                <Button
                  onClick={onNextLevel}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xl py-4"
                  size="lg"
                >
                  🚀 Next Level
                </Button>
                <Button
                  onClick={onRestartGame}
                  variant="outline"
                  className="w-full border-2 border-purple-300 text-purple-600 hover:bg-purple-50"
                  size="lg"
                >
                  🏠 Back to Menu
                </Button>
              </>
            ) : (
              <>
                <div className="bg-yellow-50 rounded-lg p-4 text-center border-2 border-yellow-300 mb-4">
                  <div className="text-3xl mb-2">🎓</div>
                  <h3 className="text-xl font-bold text-yellow-700 mb-1">
                    Congratulations!
                  </h3>
                  <p className="text-yellow-600">
                    You've completed all available levels! You're a true Hijaiyyah champion! 🏆
                  </p>
                </div>
                
                <Button
                  onClick={onRestartGame}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xl py-4"
                  size="lg"
                >
                  🏠 Back to Menu
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Encouragement Messages */}
      <div className="text-center space-y-2">
        <p className="text-white text-lg font-semibold">
          ✨ Keep up the fantastic work! ✨
        </p>
        <p className="text-white/80">
          Every letter you learn brings you closer to reading Arabic! 📚
        </p>
      </div>

      {/* Achievement Badges */}
      <div className="flex flex-wrap justify-center gap-2">
        <Badge className="bg-yellow-500 text-white px-3 py-1">
          🎯 Level {level} Master
        </Badge>
        {score >= 100 && (
          <Badge className="bg-purple-500 text-white px-3 py-1">
            💯 High Scorer
          </Badge>
        )}
        {questionsAnswered >= 10 && (
          <Badge className="bg-blue-500 text-white px-3 py-1">
            🏃 Speed Learner
          </Badge>
        )}
        <Badge className="bg-green-500 text-white px-3 py-1">
          🌟 Arabic Explorer
        </Badge>
      </div>
    </div>
  );
}