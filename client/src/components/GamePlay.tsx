import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Question, HijaiyyahLetter } from '../../../server/src/schema';

interface GamePlayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  hijaiyyahLetters: HijaiyyahLetter[];
  onAnswerSubmit: (selectedAnswer: string, timeTaken: number) => void;
  isLoading: boolean;
}

export function GamePlay({ 
  question, 
  questionNumber, 
  totalQuestions, 
  hijaiyyahLetters, 
  onAnswerSubmit, 
  isLoading 
}: GamePlayProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Find the letter data for this question
  const currentLetter = hijaiyyahLetters.find(letter => letter.id === question.letter_id);

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
  }, [question.id]);

  // Play audio automatically for auditory questions
  useEffect(() => {
    if (question.type === 'auditory_identification') {
      if (currentLetter?.audio_url) {
        // Create audio element and play pronunciation
        const audio = new Audio(currentLetter.audio_url);
        audio.play().catch(console.error);
        audioRef.current = audio;
      } else {
        // Show text-to-speech fallback message for demo
        console.log('Audio not available for demo mode');
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [question.type, currentLetter?.audio_url]);

  const handleAnswerSelect = (answer: string) => {
    if (showResult || isLoading) return;
    
    setSelectedAnswer(answer);
    const correct = answer === question.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);

    // Calculate time taken
    const timeTaken = (Date.now() - startTime) / 1000;

    // Submit after showing result briefly
    setTimeout(() => {
      onAnswerSubmit(answer, timeTaken);
    }, 1500);
  };

  const playAudioAgain = () => {
    if (currentLetter?.audio_url) {
      const audio = new Audio(currentLetter.audio_url);
      audio.play().catch(console.error);
    } else {
      // Show notification that audio is not available in demo mode
      console.log('Audio playback not available in demo mode');
    }
  };

  const progressPercentage = (questionNumber / totalQuestions) * 100;

  return (
    <div className="space-y-6 mt-8">
      {/* Progress Bar */}
      <Card className="bg-white/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Question {questionNumber} of {totalQuestions}
            </span>
            <Badge className="bg-purple-500 text-white">
              {Math.round(progressPercentage)}% Complete
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card className="max-w-2xl mx-auto bg-white/95 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {question.type === 'visual_identification' ? '👀 Visual' : '👂 Audio'}
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2">
              Level {question.difficulty}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Question Content */}
          <div className="text-center space-y-6">
            {question.type === 'visual_identification' ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-purple-700">
                  What is the name of this letter?
                </h2>
                {currentLetter && (
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-12 border-4 border-purple-300">
                    <div className="text-8xl font-bold text-purple-800 mb-4">
                      {currentLetter.letter}
                    </div>
                    <Button
                      onClick={playAudioAgain}
                      variant="outline"
                      className="border-purple-300 text-purple-600 hover:bg-purple-50"
                    >
                      🔊 Hear Pronunciation
                      {!currentLetter.audio_url && ' (Demo)'}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-purple-700">
                  Which letter makes this sound?
                </h2>
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl p-12 border-4 border-blue-300">
                  <div className="text-6xl mb-4">🎵</div>
                  <Button
                    onClick={playAudioAgain}
                    variant="outline"
                    className="text-lg px-6 py-3 border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    🔊 Play Sound Again
                    {!currentLetter?.audio_url && ' (Demo)'}
                  </Button>
                  {currentLetter?.pronunciation && (
                    <p className="text-sm text-gray-600 mt-2">
                      Listen carefully and select the correct letter
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Answer Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center text-gray-700">
              Choose your answer:
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {question.options.map((option: string, index: number) => {
                let buttonClass = "w-full p-6 text-xl font-semibold rounded-xl border-2 transition-all transform hover:scale-105 ";
                
                if (showResult) {
                  if (option === question.correct_answer) {
                    buttonClass += "bg-green-500 text-white border-green-600 shadow-lg";
                  } else if (option === selectedAnswer) {
                    buttonClass += "bg-red-500 text-white border-red-600 shadow-lg";
                  } else {
                    buttonClass += "bg-gray-200 text-gray-500 border-gray-300";
                  }
                } else {
                  buttonClass += "bg-white hover:bg-purple-50 text-purple-700 border-purple-300 hover:border-purple-500 shadow-md";
                }

                return (
                  <Button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={showResult || isLoading}
                    className={buttonClass}
                    variant="outline"
                  >
                    <span className="text-2xl mr-3">
                      {String.fromCharCode(65 + index)})
                    </span>
                    {option}
                    {showResult && option === question.correct_answer && (
                      <span className="ml-2 text-2xl">✅</span>
                    )}
                    {showResult && option === selectedAnswer && option !== question.correct_answer && (
                      <span className="ml-2 text-2xl">❌</span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Result Feedback */}
          {showResult && (
            <div className="text-center space-y-4">
              {isCorrect ? (
                <div className="bg-green-100 rounded-xl p-6 border-2 border-green-300">
                  <div className="text-4xl mb-2">🎉</div>
                  <h3 className="text-2xl font-bold text-green-700">Excellent!</h3>
                  <p className="text-green-600">You got it right! Well done! 🌟</p>
                </div>
              ) : (
                <div className="bg-red-100 rounded-xl p-6 border-2 border-red-300">
                  <div className="text-4xl mb-2">💪</div>
                  <h3 className="text-2xl font-bold text-red-700">Keep Trying!</h3>
                  <p className="text-red-600">
                    The correct answer was: <strong>{question.correct_answer}</strong>
                  </p>
                </div>
              )}
              
              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-purple-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent"></div>
                  <span>Loading next question...</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Encouragement Messages */}
      <div className="text-center">
        <p className="text-white/80 text-lg">
          {questionNumber === 1 && "🌟 You're doing great! Keep going!"}
          {questionNumber > 1 && questionNumber < totalQuestions - 2 && "💪 You're making excellent progress!"}
          {questionNumber >= totalQuestions - 2 && "🔥 Almost there! You're so close to finishing!"}
        </p>
      </div>
    </div>
  );
}