'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '../utils';
import { regionsService, type RegionsAnalyticsResponse } from '@/services/regions';
import { Globe, Trophy, ShieldCheck, UserX } from 'lucide-react';

interface AnalyticsPanelProps {
  analytics?: RegionsAnalyticsResponse | null;
}

function DonutChart({
  data,
  totalRevenue,
}: {
  data: { name: string; value: number; color?: string }[];
  totalRevenue: number;
}) {
  const sum = data.reduce((s, r) => s + r.value, 0);
  const total = sum > 0 ? sum : data.length > 0 ? data.length : 1;
  let cumulativePercent = 0;

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          {data.map((segment) => {
            const rawVal = sum > 0 ? segment.value : 1;
            const percent = (rawVal / total) * 100;
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
                stroke={segment.color || '#2563EB'}
                strokeWidth="4"
                strokeDasharray={dashArray}
                strokeDashoffset={offset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
          <span className="text-[11px] font-bold text-foreground leading-tight">
            {totalRevenue > 0 ? (totalRevenue >= 1000000 ? `${(totalRevenue / 1000000).toFixed(1)}M` : `${(totalRevenue / 1000).toFixed(0)}K`) : '0'}
          </span>
          <span className="text-[9px] text-muted-foreground">DA Total</span>
        </div>
      </div>
      <div className="flex-1 space-y-1.5">
        {data.map((region) => (
          <div key={region.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: region.color || '#2563EB' }} />
            <span className="text-[11px] text-muted-foreground flex-1 truncate">{region.name}</span>
            <span className="text-[11px] font-semibold text-foreground">{formatCurrency(region.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsPanel({ analytics }: AnalyticsPanelProps) {
  const [data, setData] = useState<RegionsAnalyticsResponse | null>(analytics || null);
  const [loading, setLoading] = useState(!analytics);

  useEffect(() => {
    if (analytics) {
      setData(analytics);
      setLoading(false);
      return;
    }

    let isMounted = true;
    regionsService
      .getAnalytics()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [analytics]);

  const regionalRevenue = data?.regionalRevenue || [];
  const topLeaders = data?.topLeaders || [];
  const wilayaStatus = data?.wilayaStatus || [
    { label: 'Active Coverage', count: 0, color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Limited Operations', count: 0, color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Pending Expansion', count: 58, color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Inactive Zones', count: 0, color: 'bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-500/10 border-rose-500/20' },
  ];
  const totalRevenue = data?.totalRevenue || 0;
  const totalWilayas = data?.totalWilayas || 58;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch w-full">
      {/* Regional Revenue Distribution */}
      <Card className="h-full border border-border/40 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Globe className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Regional Revenue Share</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Total market turnover by territory
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col justify-center">
          {loading ? (
            <div className="h-28 bg-muted/40 rounded-xl animate-pulse" />
          ) : (
            <DonutChart data={regionalRevenue} totalRevenue={totalRevenue} />
          )}
        </CardContent>
      </Card>

      {/* Top Regional Delegates */}
      <Card className="h-full border border-border/40 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Trophy className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Top Regional Leaders</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Highest performing territory delegates
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col justify-center space-y-2.5">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-muted/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : topLeaders.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-4 space-y-2 flex-1 my-auto">
              <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center text-muted-foreground">
                <UserX className="h-5 w-5 text-muted-foreground/70" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">No Regional Leaders Yet</p>
                <p className="text-[11px] text-muted-foreground max-w-[220px]">
                  Delegate rankings will appear here as orders are processed in territories.
                </p>
              </div>
            </div>
          ) : (
            topLeaders.map((delegate, i) => (
              <div key={delegate.name} className="flex items-center gap-3 p-1 rounded-xl hover:bg-muted/40 transition-colors">
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                  i === 0 ? 'bg-amber-500/10 text-amber-600' :
                  i === 1 ? 'bg-slate-500/10 text-slate-600' :
                  i === 2 ? 'bg-orange-500/10 text-orange-600' :
                  'bg-muted text-muted-foreground'
                )}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground truncate">{delegate.name} ({delegate.region})</span>
                    <span className="text-xs font-bold text-foreground">{delegate.orders} orders</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
                    <span>{formatCurrency(delegate.revenue)}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{delegate.completion}%</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Wilaya Status Overview */}
      <Card className="h-full border border-border/40 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Coverage & Health</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {totalWilayas} Wilayas operational breakdown
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 h-full">
            {wilayaStatus.map((item) => {
              const pct = totalWilayas > 0 ? Math.round((item.count / totalWilayas) * 100) : 0;
              return (
                <div
                  key={item.label}
                  className={cn(
                    'p-3 sm:p-3.5 rounded-xl border flex flex-col justify-between transition-all duration-200 hover:scale-[1.02] min-h-[92px]',
                    item.bgColor
                  )}
                >
                  {/* Top: Indicator Dot + Label */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', item.color)} />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate" title={item.label}>
                      {item.label}
                    </span>
                  </div>

                  {/* Bottom: Big Count + % Badge */}
                  <div className="mt-2 flex items-baseline justify-between gap-1 flex-wrap">
                    <div className="flex items-baseline gap-1 min-w-0">
                      <span className={cn('text-2xl sm:text-3xl font-extrabold tracking-tight leading-none', item.textColor)}>
                        {item.count}
                      </span>
                      <span className="text-[10px] text-muted-foreground/80 font-medium truncate">
                        wilayas
                      </span>
                    </div>

                    <span className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none bg-background/80 shadow-2xs border border-border/40 flex-shrink-0',
                      item.textColor
                    )}>
                      {pct}%
                    </span>
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
