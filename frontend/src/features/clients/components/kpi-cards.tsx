'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/charts/sparkline';
import { clientsService } from '@/services/clients';
import { Users, UserCheck, UserX, Target, ShoppingBag, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

interface KPIData {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  change: number;
  icon: React.ReactNode;
  iconColor: 'blue' | 'green' | 'gray' | 'amber' | 'red' | 'indigo';
  sparkline?: number[];
  sparkColor?: string;
}

const ICON_THEMES = {
  blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  gray: 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  red: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
} as const;

function formatValue(val: number, prefix: string, suffix: string) {
  if (val >= 1000000) return prefix + (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'M' + suffix;
  if (val >= 1000) return prefix + val.toLocaleString('en-US') + suffix;
  return prefix + String(val) + suffix;
}

function CountUp({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
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
    const duration = 800;

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
  }, [target, suffix, prefix]);

  return <>{display}</>;
}

function KPICard({ kpi }: { kpi: KPIData }) {
  return (
    <Card className="group relative overflow-hidden p-5 bg-card border border-border/40 shadow-xs hover:shadow-md transition-all duration-200 rounded-2xl">
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex-1 min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {kpi.title}
          </span>
          <div className="flex items-baseline gap-2 flex-wrap mb-1">
            <span className="text-2xl font-bold text-foreground tracking-tight leading-none">
              <CountUp target={kpi.value} suffix={kpi.suffix || ''} prefix={kpi.prefix || ''} />
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
    clientsService.getKpis().then((data) => {
      setKpis([
        {
          title: 'Total Clients',
          value: data.totalClients,
          change: data.trends.totalClients,
          icon: <Users className="h-5 w-5" />,
          iconColor: 'blue',
          sparkline: data.sparklines?.totalClients,
          sparkColor: '#2563EB',
        },
        {
          title: 'Active Clients',
          value: data.activeClients,
          change: data.trends.activeClients,
          icon: <UserCheck className="h-5 w-5" />,
          iconColor: 'green',
          sparkline: data.sparklines?.activeClients,
          sparkColor: '#22C55E',
        },
        {
          title: 'Inactive Clients',
          value: data.inactiveClients,
          change: -Math.abs(data.trends.inactiveClients),
          icon: <UserX className="h-5 w-5" />,
          iconColor: 'gray',
          sparkline: data.sparklines?.inactiveClients,
          sparkColor: '#6B7280',
        },
        {
          title: 'Monthly Target',
          value: data.targetRevenue ?? 0,
          prefix: '',
          suffix: ' DA',
          change: data.trends.targetRevenue ?? 0,
          icon: <Target className="h-5 w-5" />,
          iconColor: 'amber',
          sparkline: data.sparklines?.targetRevenue,
          sparkColor: '#F59E0B',
        },
        {
          title: 'Orders This Month',
          value: data.ordersThisMonth,
          change: data.trends.ordersThisMonth,
          icon: <ShoppingBag className="h-5 w-5" />,
          iconColor: 'indigo',
          sparkline: data.sparklines?.ordersThisMonth,
          sparkColor: '#6366F1',
        },
        {
          title: 'Total Revenue',
          value: data.totalRevenue,
          prefix: '',
          suffix: ' DA',
          change: data.trends.totalRevenue,
          icon: <TrendingUp className="h-5 w-5" />,
          iconColor: 'green',
          sparkline: data.sparklines?.totalRevenue,
          sparkColor: '#22C55E',
        },
      ]);
      setLoading(false);
    }).catch(() => setLoading(false));
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
        <KPICard key={kpi.title} kpi={kpi} />
      ))}
    </div>
  );
}
