'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/charts/sparkline';
import { Globe, MapPin, Users, UserCheck, ShoppingCart, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import type { RegionData } from '../types';
import { formatCurrency } from '../utils';

interface KPICardsProps {
  regions?: RegionData[];
}

interface KPIData {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  isCurrency?: boolean;
  change: number;
  icon: React.ReactNode;
  iconColor: 'blue' | 'green' | 'amber' | 'red' | 'indigo' | 'teal';
  sparkline?: number[];
  sparkColor?: string;
}

const ICON_THEMES = {
  blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  red: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
  teal: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
} as const;

function formatValue(val: number, isCurrency: boolean = false) {
  if (isCurrency) {
    return formatCurrency(val);
  }
  if (val >= 1000000) return (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (val >= 1000) return val.toLocaleString('en-US');
  return String(val);
}

function SingleKPICard({ kpi }: { kpi: KPIData }) {
  return (
    <Card className="group relative overflow-hidden p-5 bg-card border border-border/40 shadow-xs hover:shadow-md transition-all duration-200 rounded-2xl">
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex-1 min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
            {kpi.title}
          </span>
          <div className="flex items-baseline gap-2 flex-wrap mb-1">
            <span className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-none">
              {formatValue(kpi.value, kpi.isCurrency)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            {kpi.change > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full dark:text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                +{kpi.change}%
              </span>
            ) : kpi.change < 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full dark:text-rose-400">
                <TrendingDown className="h-3 w-3" />
                {kpi.change}%
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-500/10 px-2 py-0.5 rounded-full dark:text-slate-400">
                Live DB
              </span>
            )}
            <span className="text-[10px] text-muted-foreground/70">Real Data</span>
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

export function KPICards({ regions = [] }: KPICardsProps) {
  const totalRegions = regions.length;
  const totalWilayas = regions.reduce((sum, r) => sum + r.wilayas.length, 0);
  const totalDelegates = regions.reduce((sum, r) => sum + (r.delegates || 0), 0);
  const totalClients = regions.reduce((sum, r) => sum + (r.clients || 0), 0);
  const totalOrders = regions.reduce((sum, r) => sum + (r.ordersToday || 0), 0);
  const totalRevenue = regions.reduce((sum, r) => sum + (r.revenue || 0), 0);

  const kpis: KPIData[] = [
    {
      title: 'Regions',
      value: totalRegions,
      change: 0,
      icon: <Globe className="h-5 w-5" />,
      iconColor: 'blue',
      sparkline: [totalRegions, totalRegions, totalRegions],
      sparkColor: '#2563EB',
    },
    {
      title: 'Wilayas',
      value: totalWilayas,
      change: 0,
      icon: <MapPin className="h-5 w-5" />,
      iconColor: 'red',
      sparkline: [totalWilayas, totalWilayas, totalWilayas],
      sparkColor: '#EF4444',
    },
    {
      title: 'Delegates',
      value: totalDelegates,
      change: 0,
      icon: <UserCheck className="h-5 w-5" />,
      iconColor: 'green',
      sparkline: [totalDelegates, totalDelegates, totalDelegates],
      sparkColor: '#22C55E',
    },
    {
      title: 'Clients',
      value: totalClients,
      change: 0,
      icon: <Users className="h-5 w-5" />,
      iconColor: 'indigo',
      sparkline: [totalClients, totalClients, totalClients],
      sparkColor: '#6366F1',
    },
    {
      title: 'Orders',
      value: totalOrders,
      change: 0,
      icon: <ShoppingCart className="h-5 w-5" />,
      iconColor: 'amber',
      sparkline: [totalOrders, totalOrders, totalOrders],
      sparkColor: '#F59E0B',
    },
    {
      title: 'Total Revenue',
      value: totalRevenue,
      isCurrency: true,
      change: 0,
      icon: <DollarSign className="h-5 w-5" />,
      iconColor: 'teal',
      sparkline: [totalRevenue, totalRevenue, totalRevenue],
      sparkColor: '#14B8A6',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((kpi) => (
        <SingleKPICard key={kpi.title} kpi={kpi} />
      ))}
    </div>
  );
}
