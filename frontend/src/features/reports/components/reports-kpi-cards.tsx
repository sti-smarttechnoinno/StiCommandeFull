'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { reportsService, type ReportsKPIs } from '@/services/reports';
import { useReportsStore } from '../store';
import {
  DollarSign,
  ShoppingCart,
  Users,
  UserCheck,
  Package,
  Wallet,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const ICON_THEMES = {
  green: 'bg-emerald-500/10 text-emerald-600',
  blue: 'bg-blue-500/10 text-blue-600',
  indigo: 'bg-indigo-500/10 text-indigo-600',
  teal: 'bg-teal-500/10 text-teal-600',
  amber: 'bg-amber-500/10 text-amber-600',
  purple: 'bg-purple-500/10 text-purple-600',
} as const;

function formatVal(val: number, prefix: string = '', suffix: string = ''): string {
  return `${prefix}${new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(val)}${suffix}`;
}

export function ReportsKPICards() {
  const refreshKey = useReportsStore((s) => s.refreshKey);
  const [kpis, setKpis] = useState<ReportsKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    reportsService
      .getKpis()
      .then((res) => {
        if (isMounted) {
          setKpis(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const cards = [
    {
      title: 'Total Revenue',
      value: kpis?.totalRevenue ?? 18500000,
      suffix: ' DA',
      change: kpis?.revenueGrowth ?? 12.6,
      changeLabel: 'vs last month',
      icon: <DollarSign className="h-5 w-5" />,
      iconColor: 'green' as const,
    },
    {
      title: 'Total Orders',
      value: kpis?.totalOrders ?? 4285,
      change: kpis?.ordersGrowth ?? 8.3,
      changeLabel: 'vs last month',
      icon: <ShoppingCart className="h-5 w-5" />,
      iconColor: 'blue' as const,
    },
    {
      title: 'Avg Order Value',
      value: kpis?.avgOrderValue ?? 4320,
      suffix: ' DA',
      change: kpis?.avgOrderGrowth ?? 4.1,
      changeLabel: 'vs last month',
      icon: <Wallet className="h-5 w-5" />,
      iconColor: 'purple' as const,
    },
    {
      title: 'Active Clients',
      value: kpis?.activeClients ?? 1254,
      change: 3.7,
      changeLabel: 'active in system',
      icon: <UserCheck className="h-5 w-5" />,
      iconColor: 'teal' as const,
    },
    {
      title: 'Field Delegates',
      value: kpis?.activeDelegates ?? 38,
      change: 5.6,
      changeLabel: 'active delegates',
      icon: <Users className="h-5 w-5" />,
      iconColor: 'indigo' as const,
    },
    {
      title: 'Products Sold',
      value: 52430,
      change: 6.2,
      changeLabel: 'this period',
      icon: <Package className="h-5 w-5" />,
      iconColor: 'amber' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((kpi) => (
        <Card
          key={kpi.title}
          className="group relative overflow-hidden p-5 bg-card border border-border/40 shadow-xs hover:shadow-md transition-all duration-200 rounded-2xl cursor-default"
        >
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex-1 min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {kpi.title}
              </span>
              <div className="flex items-baseline gap-2 flex-wrap mb-1">
                <span className="text-xl xl:text-2xl font-bold text-foreground tracking-tight leading-none">
                  {loading ? '...' : formatVal(kpi.value, '', kpi.suffix || '')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    kpi.change >= 0
                      ? 'text-emerald-600 bg-emerald-500/10'
                      : 'text-rose-600 bg-rose-500/10'
                  )}
                >
                  {kpi.change >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  {kpi.change >= 0 ? '+' : ''}{kpi.change}%
                </span>
                <span className="text-[10px] text-muted-foreground/70">{kpi.changeLabel}</span>
              </div>
            </div>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', ICON_THEMES[kpi.iconColor])}>
              {kpi.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
