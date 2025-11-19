interface ProgressRingProps {
  percentage: number;
}

export default function ProgressRing({ percentage }: ProgressRingProps) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-12 h-12" data-testid="progress-ring">
      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 42 42">
        {/* Background circle */}
        <circle 
          cx="21" 
          cy="21" 
          r={radius} 
          fill="none" 
          stroke="hsl(var(--border))" 
          strokeWidth="3"
        />
        {/* Progress circle */}
        <circle 
          cx="21" 
          cy="21" 
          r={radius} 
          fill="none" 
          stroke="hsl(var(--accent))" 
          strokeWidth="3" 
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-accent" data-testid="text-progress-percentage">
          {percentage}%
        </span>
      </div>
    </div>
  );
}
