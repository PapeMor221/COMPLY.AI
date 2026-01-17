import { useState, useEffect } from "react";

interface ScoreCircleProps {
  score: number;
  size?: number;
}

const getScoreColor = (score: number) => {
  if (score < 50) return "text-destructive";
  if (score < 70) return "text-orange";
  if (score < 85) return "text-warning";
  return "text-success";
};

const getScoreStroke = (score: number) => {
  if (score < 50) return { start: "hsl(0 84% 60%)", end: "hsl(0 70% 50%)" };
  if (score < 70) return { start: "hsl(25 95% 53%)", end: "hsl(38 92% 50%)" };
  if (score < 85) return { start: "hsl(45 93% 47%)", end: "hsl(38 92% 50%)" };
  return { start: "hsl(160 84% 39%)", end: "hsl(140 70% 45%)" };
};

const getScoreGlow = (score: number) => {
  if (score < 50) return "drop-shadow(0 0 20px hsla(0, 84%, 60%, 0.4))";
  if (score < 70) return "drop-shadow(0 0 20px hsla(25, 95%, 53%, 0.4))";
  if (score < 85) return "drop-shadow(0 0 20px hsla(45, 93%, 47%, 0.4))";
  return "drop-shadow(0 0 20px hsla(160, 84%, 39%, 0.4))";
};

export const getScoreLabel = (score: number) => {
  if (score < 50) return { emoji: "🔴", text: "Non conforme" };
  if (score < 70) return { emoji: "🟠", text: "Faiblement conforme" };
  if (score < 85) return { emoji: "🟡", text: "Partiellement conforme" };
  return { emoji: "🟢", text: "Conforme" };
};

export function ScoreCircle({ score, size = 280 }: ScoreCircleProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const strokeWidth = 14;
  const radius = (size / 2) - strokeWidth - 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;
  const gradientId = `score-gradient-${score}`;

  useEffect(() => {
    const duration = 1800;
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const scoreLabel = getScoreLabel(score);
  const colors = getScoreStroke(score);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Circle container */}
      <div className="relative flex items-center justify-center">
        <svg 
          width={size} 
          height={size} 
          style={{ transform: "rotate(-90deg)", filter: getScoreGlow(score) }}
          className="score-ring"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.start} />
              <stop offset="100%" stopColor={colors.end} />
            </linearGradient>
          </defs>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity="0.2"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Score inside circle */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-6xl md:text-7xl font-extrabold score-value ${getScoreColor(score)}`}>
            {animatedScore}
          </span>
          <span className="text-xl md:text-2xl text-muted-foreground font-medium -mt-1">/100</span>
        </div>
      </div>
      
      {/* Status badge - outside the circle */}
      <div className="px-5 py-2.5 rounded-full bg-muted/50 backdrop-blur-sm border border-border/50 animate-scale-in">
        <p className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="text-xl">{scoreLabel.emoji}</span>
          {scoreLabel.text}
        </p>
      </div>
    </div>
  );
}
