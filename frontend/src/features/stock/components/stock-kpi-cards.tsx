'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/charts/sparkline';
import { Package, ArrowDown, ArrowUp, RefreshCw, Sliders, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { stockService, type StockKpisResponse } from '@/services/stock';
import { useStockStore } from '../store';

interface KPIData {
  title: string;
  value: number;
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

function KPICard({ kpi }: { kpi: KPIData }) {
  const [displayValue, setDisplayValue] = useState(kpi.value);

  useEffect(() => {
    let start = 0;
    const duration = 800;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(kpi.value * eased));
      if (progress < 1) requestAnimationFrame(step);
      else setDisplayValue(kpi.value);
    };

    requestAnimationFrame(step);
  }, [kpi.value]);

  return (
    <Card className="group relative overflow-hidden p-5 bg-card border border-border/40 shadow-xs hover:shadow-md transition-all duration-200 rounded-2xl">
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex-1 min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            {kpi.title}
          </span>
          <div className="flex items-baseline gap-2 flex-wrap mb-1">
            <span className="text-2xl font-bold text-foreground tracking-tight leading-none">
              {displayValue.toLocaleString('en-US')}{kpi.suffix || ''}
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
            <span className="text-xs text-muted-foreground/70">vs yesterday</span>
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

export function StockKPICards() {
  const { refreshTrigger } = useStockStore();
  const [kpis, setKpis] = useState<KPIData[]>([
    {
      title: 'Current Stock',
      value: 0,
      suffix: ' Units',
      change: 3.5,
      icon: <Package className="h-5 w-5" />,
      iconColor: 'blue',
      sparkline: [0, 0, 0, 0, 0, 0, 0],
      sparkColor: '#2563EB',
    },
    {
      title: 'Incoming Today',
      value: 0,
      suffix: ' Units',
      change: 8.2,
      icon: <ArrowDown className="h-5 w-5" />,
      iconColor: 'green',
      sparkline: [0, 0, 0, 0, 0, 0, 0],
      sparkColor: '#22C55E',
    },
    {
      title: 'Outgoing Today',
      value: 0,
      suffix: ' Units',
      change: -2.1,
      icon: <ArrowUp className="h-5 w-5" />,
      iconColor: 'red',
      sparkline: [0, 0, 0, 0, 0, 0, 0],
      sparkColor: '#EF4444',
    },
    {
      title: 'Transfers Today',
      value: 0,
      change: 0,
      icon: <RefreshCw className="h-5 w-5" />,
      iconColor: 'indigo',
      sparkline: [0, 1, 2, 1, 3, 2, 4],
      sparkColor: '#6366F1',
    },
    {
      title: 'Low Stock Items',
      value: 0,
      change: 0,
      icon: <AlertTriangle className="h-5 w-5" />,
      iconColor: 'amber',
      sparkline: [2, 3, 3, 4, 3, 5, 5],
      sparkColor: '#F59E0B',
    },
  ]);

  useEffect(() => {
    let active = true;

    stockService.getKpis().then((res: StockKpisResponse) => {
      if (!active) return;
      setKpis([
        {
          title: 'Current Stock',
          value: res.currentStock,
          suffix: ' Units',
          change: res.trends?.currentStock ?? 3.5,
          icon: <Package className="h-5 w-5" />,
          iconColor: 'blue',
          sparkline: res.sparklines?.currentStock || [res.currentStock, res.currentStock],
          sparkColor: '#2563EB',
        },
        {
          title: 'Incoming Today',
          value: res.incomingToday,
          suffix: ' Units',
          change: res.trends?.incomingToday ?? 8.2,
          icon: <ArrowDown className="h-5 w-5" />,
          iconColor: 'green',
          sparkline: res.sparklines?.incomingToday || [0, res.incomingToday],
          sparkColor: '#22C55E',
        },
        {
          title: 'Outgoing Today',
          value: res.outgoingToday,
          suffix: ' Units',
          change: res.trends?.outgoingToday ?? -2.1,
          icon: <ArrowUp className="h-5 w-5" />,
          iconColor: 'red',
          sparkline: res.sparklines?.outgoingToday || [0, res.outgoingToday],
          sparkColor: '#EF4444',
        },
        {
          title: 'Transfers Today',
          value: res.transfersCount,
          change: res.trends?.transfersCount ?? 0,
          icon: <RefreshCw className="h-5 w-5" />,
          iconColor: 'indigo',
          sparkline: [1, 2, 1, 3, 2, 4, res.transfersCount],
          sparkColor: '#6366F1',
        },
        {
          title: 'Low Stock Items',
          value: res.lowStockCount,
          change: res.trends?.lowStockCount ?? 0,
          icon: <AlertTriangle className="h-5 w-5" />,
          iconColor: 'amber',
          sparkline: [2, 3, 3, 4, 3, 5, res.lowStockCount],
          sparkColor: '#F59E0B',
        },
      ]);
    }).catch(() => {});

    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {kpis.map((kpi) => (
        <KPICard key={kpi.title} kpi={kpi} />
      ))}
    </div>
  );
}
