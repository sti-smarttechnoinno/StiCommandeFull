'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/charts/sparkline';
import { notificationsService, type NotificationsKPIMetrics } from '@/services/notifications';
import { useNotificationsStore } from '../store';
import {
  Bell,
  Mail,
  TriangleAlert,
  ShoppingCart,
  Package,
  Shield,
  Clock,
  Loader2,
} from 'lucide-react';

const ICON_THEMES = {
  red: 'bg-rose-500/10 text-rose-600',
  amber: 'bg-amber-500/10 text-amber-600',
  orange: 'bg-orange-500/10 text-orange-600',
  blue: 'bg-blue-500/10 text-blue-600',
  green: 'bg-emerald-500/10 text-emerald-600',
  rose: 'bg-rose-500/10 text-rose-600',
} as const;

export function NotificationsKPICards() {
  const refreshKey = useNotificationsStore((s) => s.refreshKey);
  const [metrics, setMetrics] = useState<NotificationsKPIMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    notificationsService
      .getKpis()
      .then((res) => {
        if (isMounted) {
          setMetrics(res);
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

  const kpis = [
    {
      title: 'All Notifications',
      value: metrics?.totalNotifications ?? 0,
      changeLabel: metrics?.trends.totalNotifications ? `${metrics.trends.totalNotifications > 0 ? '+' : ''}${metrics.trends.totalNotifications}%` : 'Real-time',
      icon: <Bell className="h-5 w-5" />,
      iconColor: 'red' as const,
      sparkline: metrics?.sparklines.totalNotifications ?? [0, 0, 0, 0, 0],
      sparkColor: '#D71920',
    },
    {
      title: 'Unread',
      value: metrics?.unreadCount ?? 0,
      changeLabel: 'Need Review',
      icon: <Mail className="h-5 w-5" />,
      iconColor: 'amber' as const,
      sparkline: metrics?.sparklines.unreadCount ?? [0, 0, 0, 0, 0],
      sparkColor: '#F59E0B',
    },
    {
      title: 'Critical Alerts',
      value: metrics?.criticalAlerts ?? 0,
      changeLabel: 'Immediate Action',
      icon: <TriangleAlert className="h-5 w-5" />,
      iconColor: 'rose' as const,
      sparkline: metrics?.sparklines.criticalAlerts ?? [0, 0, 0, 0, 0],
      sparkColor: '#EF4444',
    },
    {
      title: 'Pending Actions',
      value: metrics?.pendingActions ?? 0,
      changeLabel: 'Requires Action',
      icon: <Clock className="h-5 w-5" />,
      iconColor: 'orange' as const,
      sparkline: metrics?.sparklines.pendingActions ?? [0, 0, 0, 0, 0],
      sparkColor: '#F97316',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card
            key={i}
            className="p-5 flex items-center justify-center h-[116px] border border-border/40 bg-card rounded-[20px]"
          >
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card
          key={kpi.title}
          className="group relative overflow-hidden p-5 bg-card border border-border/40 shadow-xs hover:shadow-md transition-all duration-200 rounded-[20px] cursor-default"
        >
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex-1 min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                {kpi.title}
              </span>
              <div className="flex items-baseline gap-2 flex-wrap mb-1">
                <span className="text-[28px] font-bold text-foreground tracking-tight leading-none">
                  {kpi.value}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground/70 mt-2 block">{kpi.changeLabel}</span>
            </div>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', ICON_THEMES[kpi.iconColor])}>
              {kpi.icon}
            </div>
          </div>
          {kpi.sparkline && kpi.sparkline.length > 0 && (
            <div className="absolute bottom-0 right-0 left-0 h-10 opacity-15 group-hover:opacity-30 transition-opacity duration-200 pointer-events-none overflow-hidden rounded-b-[20px]">
              <Sparkline data={kpi.sparkline} color={kpi.sparkColor} className="w-full h-full" />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
