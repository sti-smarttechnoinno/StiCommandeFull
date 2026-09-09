'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/charts/sparkline';
import { wilayasService } from '@/services/wilayas';
import { MapPin, Users, DollarSign, ShoppingCart, UserCheck, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

interface KPIData {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change: number;
  icon: React.ReactNode;
  iconColor: 'blue' | 'green' | 'amber' | 'indigo' | 'red' | 'teal';
  sparkline?: number[];
  sparkColor?: string;
}

const ICON_THEMES = {
  blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
  red: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
  teal: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
} as const;

function formatValue(val: number, prefix: string, suffix: string) {
  if (val >= 1000) return prefix + val.toLocaleString('en-US') + suffix;
  return prefix + String(val) + suffix;
}

function KPICardItem({ kpi }: { kpi: KPIData }) {
  const [display, setDisplay] = useState(() => formatValue(kpi.value, kpi.prefix || '', kpi.suffix || ''));
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = Date.now();
    const duration = 1000;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = kpi.value >= 1000 ? Math.floor(kpi.value * eased) : parseFloat((kpi.value * eased).toFixed(1));
      setDisplay(formatValue(current, kpi.prefix || '', kpi.suffix || ''));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [kpi.value, kpi.prefix, kpi.suffix]);

  return (
    <Card className="group relative overflow-hidden p-5 bg-card border border-border/40 shadow-xs hover:shadow-md transition-all duration-200 rounded-2xl">
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex-1 min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            {kpi.title}
          </span>
          <div className="flex items-baseline gap-2 flex-wrap mb-1">
            <span className="text-2xl font-bold text-foreground tracking-tight leading-none">
              {display}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                kpi.change >= 0
                  ? 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400'
                  : 'text-rose-600 bg-rose-500/10 dark:text-rose-400'
              )}
            >
              {kpi.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {kpi.change >= 0 ? '+' : ''}{kpi.change}%
            </span>
            <span className="text-xs text-muted-foreground/70">vs last month</span>
          </div>
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', ICON_THEMES[kpi.iconColor])}>
          {kpi.icon}
        </div>
      </div>

      {kpi.sparkline && kpi.sparkColor && (
        <div className="absolute bottom-0 right-0 left-0 h-10 opacity-20 group-hover:opacity-35 transition-opacity duration-200 pointer-events-none overflow-hidden rounded-b-2xl">
          <Sparkline data={kpi.sparkline} color={kpi.sparkColor} className="w-full h-full" />
        </div>
      )}
    </Card>
  );
}

export function KPICards() {
  const [kpis, setKpis] = useState<KPIData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wilayasService
      .getKpis()
      .then((data) => {
        setKpis([
          {
            title: 'Total Wilayas',
            value: data.totalWilayas,
            change: data.trends.totalWilayas,
            icon: <MapPin className="h-5 w-5" />,
            iconColor: 'blue',
            sparkline: data.sparklines.totalWilayas,
            sparkColor: '#2563EB',
          },
          {
            title: 'Total Clients',
            value: data.totalClients,
            change: data.trends.totalClients,
            icon: <Users className="h-5 w-5" />,
            iconColor: 'green',
            sparkline: data.sparklines.totalClients,
            sparkColor: '#22C55E',
          },
          {
            title: 'Monthly Revenue',
            value: data.monthlyRevenue,
            prefix: '',
            suffix: ' DA',
            change: data.trends.monthlyRevenue,
            icon: <DollarSign className="h-5 w-5" />,
            iconColor: 'amber',
            sparkline: data.sparklines.monthlyRevenue,
            sparkColor: '#F59E0B',
          },
          {
            title: 'Orders This Month',
            value: data.ordersThisMonth,
            change: data.trends.ordersThisMonth,
            icon: <ShoppingCart className="h-5 w-5" />,
            iconColor: 'indigo',
            sparkline: data.sparklines.ordersThisMonth,
            sparkColor: '#6366F1',
          },
          {
            title: 'Active Delegates',
            value: data.activeDelegates,
            change: data.trends.activeDelegates,
            icon: <UserCheck className="h-5 w-5" />,
            iconColor: 'teal',
            sparkline: data.sparklines.activeDelegates,
            sparkColor: '#14B8A6',
          },
          {
            title: 'Average Growth',
            value: data.averageGrowth,
            suffix: '%',
            change: data.trends.averageGrowth,
            icon: <TrendingUp className="h-5 w-5" />,
            iconColor: 'red',
            sparkline: data.sparklines.averageGrowth,
            sparkColor: '#EF4444',
          },
        ]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="relative overflow-hidden p-5 bg-card border border-border/40 shadow-xs rounded-2xl">
            <div className="flex items-center justify-center h-20">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((kpi) => (
        <KPICardItem key={kpi.title} kpi={kpi} />
      ))}
    </div>
  );
}
