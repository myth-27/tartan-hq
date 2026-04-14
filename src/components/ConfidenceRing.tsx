import type { ConfidenceTier } from '@/types';
import { TIER_COLORS } from '@/lib/constants';

interface Props {
  score: number;
  tier: ConfidenceTier;
  size?: 'sm' | 'md' | 'lg';
}

export function ConfidenceRing({ score, tier, size = 'md' }: Props) {
  const sizeMap = {
    sm: { r: 18, cx: 24, cy: 24, strokeWidth: 3, width: 48, viewBox: '0 0 48 48', textClass: 'text-sm' },
    md: { r: 32, cx: 40, cy: 40, strokeWidth: 5, width: 80, viewBox: '0 0 80 80', textClass: 'text-2xl' },
    lg: { r: 50, cx: 60, cy: 60, strokeWidth: 8, width: 120, viewBox: '0 0 120 120', textClass: 'text-4xl' },
  };

  const { r, cx, cy, strokeWidth, width, viewBox } = sizeMap[size];
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = TIER_COLORS[tier];

  return (
    <div className="relative inline-flex items-center justify-center font-mono">
      <svg width={width} height={width} viewBox={viewBox} className="transform -rotate-90">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-200"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className={`absolute font-semibold tracking-tighter`} style={{ color }}>
        {score}
      </span>
    </div>
  );
}
