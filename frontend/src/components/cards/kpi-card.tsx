'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Sparkline } from '@/components/charts/sparkline';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: number;
  subtitle?: string;
  icon: React.ReactNode;
  iconColor: 'blue' | 'green' | 'orange' | 'indigo';
  sparkData?: number[];
  sparkColor?: string;
}

const ICON_THEMES = {
  blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  orange: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
} as const;

function formatValue(val: number, prefix: string, suffix: string) {
  return prefix + (val > 10000 ? val.toLocaleString('en-US') : String(val)) + suffix;
}

function useCountUp(target: number, duration: number = 800, suffix: string = '', prefix: string = '') {
  const [display, setDisplay] = useState(() => formatValue(target, prefix, suffix));
  const prevTargetRef = useRef(target);

  useEffect(() => {
    const startVal = prevTargetRef.current;
    prevTargetRef.current = target;

    if (startVal === target) {
      setDisplay(formatValue(target, prefix, suffix));
      return;
    }

    let animationFrameId: number;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startVal + (target - startVal) * eased);
      setDisplay(formatValue(current, prefix, suffix));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        setDisplay(formatValue(target, prefix, suffix));
      }
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [target, duration, suffix, prefix]);

  return display;
}

export function KPICard({ title, value, prefix = '', suffix = '', trend, subtitle, icon, iconColor, sparkData, sparkColor }: KPICardProps) {
  const displayValue = useCountUp(value, 800, suffix, prefix);

  return (
    <Card className="group relative overflow-hidden p-6 bg-card border border-border/40 shadow-xs hover:shadow-md transition-all duration-200 rounded-2xl">
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex-1 min-w-0">
          <span className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">{title}</span>

          <div className="flex items-baseline gap-2 flex-wrap mb-1">
            <span className="text-3xl font-bold text-foreground tracking-tight leading-none">
              {displayValue}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {trend !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                  trend >= 0
                    ? 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400'
                    : 'text-rose-600 bg-rose-500/10 dark:text-rose-400'
                )}
              >
                {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
            )}

            {subtitle ? (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            ) : (
              <span className="text-xs text-muted-foreground/70">vs last period</span>
            )}
          </div>
        </div>

        {/* Clean Icon Badge */}
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', ICON_THEMES[iconColor])}>
          {icon}
        </div>
      </div>

      {/* Subtle Background Sparkline */}
      {sparkData && sparkColor && (
        <div className="absolute bottom-0 right-0 left-0 h-12 opacity-20 group-hover:opacity-35 transition-opacity duration-200 pointer-events-none overflow-hidden rounded-b-2xl">
          <Sparkline data={sparkData} color={sparkColor} className="w-full h-full" />
        </div>
      )}
    </Card>
  );
}
