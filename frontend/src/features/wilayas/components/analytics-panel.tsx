'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency, formatCompactCurrency } from '../utils';
import { wilayasService, type WilayasAnalyticsResponse } from '@/services/wilayas';
import { PieChart, Trophy, MapPin, Loader2 } from 'lucide-react';

const PERFORMANCE_CONFIG = {
  excellent: { label: 'Excellent', color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20' },
  good: { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20' },
  average: { label: 'Average', color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20' },
  needs_attention: { label: 'Needs Attention', color: 'bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-500/10 border-rose-500/20' },
};

function DonutChart({ data }: { data: WilayasAnalyticsResponse['regionalDistribution'] }) {
  const total = data.reduce((s, r) => s + r.revenue, 0);
  let cumulativePercent = 0;

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          {data.map((segment) => {
            const percent = total > 0 ? (segment.revenue / total) * 100 : 0;
            const dashArray = `${percent} ${100 - percent}`;
            const offset = -cumulativePercent;
            cumulativePercent += percent;
            return (
              <circle
                key={segment.name}
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke={segment.color}
                strokeWidth="4"
                strokeDasharray={dashArray}
                strokeDashoffset={offset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
          <span className="text-[11px] font-bold text-foreground leading-tight">{formatCompactCurrency(total)}</span>
          <span className="text-[9px] text-muted-foreground">Total</span>
        </div>
      </div>
      <div className="flex-1 space-y-1.5">
        {data.map((region) => (
          <div key={region.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: region.color }} />
            <span className="text-[11px] text-muted-foreground flex-1 truncate">{region.name}</span>
            <span className="text-[11px] font-semibold text-foreground">{formatCurrency(region.revenue)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsPanel() {
  const [analytics, setAnalytics] = useState<WilayasAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wilayasService
      .getAnalytics()
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch w-full">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="h-48 border border-border/40 shadow-xs rounded-2xl flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>
    );
  }

  const totalWilayasCount = Object.values(analytics.performanceCounts).reduce((a, b) => a + b, 0) || 58;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch w-full">
      {/* Region Revenue Share */}
      <Card className="h-full border border-border/40 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <PieChart className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Regional Revenue Share</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Monthly revenue breakdown across regions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col justify-center">
          <DonutChart data={analytics.regionalDistribution} />
        </CardContent>
      </Card>

      {/* Top 5 Performing Wilayas */}
      <Card className="h-full border border-border/40 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Trophy className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Top Performing Wilayas</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Highest turnover territory ranks
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 space-y-2.5">
          {analytics.topPerformers.map((wilaya, i) => (
            <div key={wilaya.id} className="flex items-center gap-3 p-1 rounded-xl hover:bg-muted/40 transition-colors">
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                  i === 0
                    ? 'bg-amber-500/10 text-amber-600'
                    : i === 1
                    ? 'bg-slate-500/10 text-slate-600'
                    : i === 2
                    ? 'bg-orange-500/10 text-orange-600'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                #{i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {wilaya.name} ({wilaya.code})
                  </span>
                  <span className="text-xs font-bold text-foreground">{wilaya.ordersMonth} orders</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
                  <span>{formatCurrency(wilaya.monthlyRevenue)}</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{wilaya.growth}%</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Wilaya Performance Overview */}
      <Card className="h-full border border-border/40 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Performance Breakdown</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {totalWilayasCount} Wilayas operational ratings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-3.5 h-full">
            {(Object.entries(analytics.performanceCounts) as [string, number][]).map(([key, count]) => {
              const cfg = PERFORMANCE_CONFIG[key as keyof typeof PERFORMANCE_CONFIG];
              const pct = totalWilayasCount > 0 ? Math.round((count / totalWilayasCount) * 100) : 0;
              return (
                <div
                  key={key}
                  className={cn(
                    'p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 hover:scale-[1.02]',
                    cfg.bgColor
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2.5 h-2.5 rounded-full', cfg.color)} />
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                        {cfg.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground/80">{pct}%</span>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <span className={cn('text-3xl font-extrabold tracking-tight', cfg.textColor)}>{count}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">wilayas</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
