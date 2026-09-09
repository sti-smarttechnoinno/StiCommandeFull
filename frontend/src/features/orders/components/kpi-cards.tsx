'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ShoppingCart, DollarSign, Clock, Users, TrendingUp, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react';
import { Sparkline } from '@/components/charts/sparkline';
import { ordersService, type OrderKpis } from '@/services/orders';

interface KPIData {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change: number;
  icon: React.ReactNode;
  iconColor: 'blue' | 'green' | 'orange' | 'indigo' | 'red';
  sparkline?: number[];
  sparkColor?: string;
}

const ICON_THEMES = {
  blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  orange: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
  red: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
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
  }, [target, prefix, suffix]);

  return <span>{display}</span>;
}

export function KPICards() {
  const [liveKpis, setLiveKpis] = useState<OrderKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    ordersService
      .getKpis()
      .then((data) => {
        if (active) {
          setLiveKpis(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4 flex items-center justify-center h-28 border-border/40 bg-card">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>
    );
  }

  const kpiList: KPIData[] = [
    {
      title: "Total Orders",
      value: liveKpis?.totalOrders ?? 0,
      change: liveKpis?.ordersGrowth ?? 0,
      icon: <ShoppingCart className="h-5 w-5" />,
      iconColor: 'blue',
      sparkColor: '#2563EB',
      sparkline: liveKpis?.ordersSparkline,
    },
    {
      title: "Total Revenue",
      value: liveKpis?.totalRevenue ?? 0,
      prefix: '',
      suffix: ' DA',
      change: liveKpis?.revenueGrowth ?? 0,
      icon: <DollarSign className="h-5 w-5" />,
      iconColor: 'green',
      sparkColor: '#22C55E',
      sparkline: liveKpis?.revenueSparkline,
    },
    {
      title: 'Pending Orders',
      value: liveKpis?.pendingOrders ?? 0,
      change: liveKpis?.pendingGrowth ?? 0,
      icon: <Clock className="h-5 w-5" />,
      iconColor: 'orange',
      sparkColor: '#F59E0B',
      sparkline: liveKpis?.pendingSparkline,
    },
    {
      title: 'Validated Orders',
      value: liveKpis?.validatedOrders ?? 0,
      change: liveKpis?.validatedGrowth ?? 0,
      icon: <Users className="h-5 w-5" />,
      iconColor: 'indigo',
      sparkColor: '#6366F1',
      sparkline: liveKpis?.validatedSparkline,
    },
    {
      title: 'Delivered Orders',
      value: liveKpis?.deliveredOrders ?? 0,
      change: liveKpis?.deliveredGrowth ?? 0,
      icon: <AlertTriangle className="h-5 w-5" />,
      iconColor: 'green',
      sparkColor: '#10B981',
      sparkline: liveKpis?.deliveredSparkline,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {kpiList.map((kpi) => {
        const isPositive = kpi.change >= 0;
        return (
          <Card key={kpi.title} className="group relative overflow-hidden p-5 bg-card border border-border/40 shadow-xs hover:shadow-md transition-all duration-200 rounded-2xl">
            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">{kpi.title}</span>

                <div className="flex items-baseline gap-2 flex-wrap mb-1">
                  <span className="text-2xl font-bold text-foreground tracking-tight leading-none">
                    <CountUp target={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} />
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                      isPositive
                        ? 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400'
                        : 'text-rose-600 bg-rose-500/10 dark:text-rose-400'
                    )}
                  >
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {isPositive ? '+' : ''}{kpi.change}%
                  </span>
                  <span className="text-xs text-muted-foreground/70">vs yesterday</span>
                </div>
              </div>

              {/* Icon Badge */}
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', ICON_THEMES[kpi.iconColor])}>
                {kpi.icon}
              </div>
            </div>

            {/* Sparkline Background */}
            {kpi.sparkline && kpi.sparkColor && (
              <div className="absolute bottom-0 right-0 left-0 h-10 opacity-20 group-hover:opacity-35 transition-opacity duration-200 pointer-events-none overflow-hidden rounded-b-2xl">
                <Sparkline data={kpi.sparkline} color={kpi.sparkColor} className="w-full h-full" />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
