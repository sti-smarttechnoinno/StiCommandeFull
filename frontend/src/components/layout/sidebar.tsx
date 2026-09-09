'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/constants';
import { useUIStore } from '@/store';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useWebSocketOrders } from '@/hooks/use-websocket-orders';
import { notificationsService } from '@/services/notifications';
import { useNotificationsStore } from '@/features/notifications/store';
import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/use-permissions';

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, sidebarMobileOpen, setSidebarMobileOpen } = useUIStore();
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const collapsed = !isMobile && sidebarCollapsed;
  const { unvalidatedCount } = useWebSocketOrders();
  const refreshKey = useNotificationsStore((s) => s.refreshKey);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const { can, user } = usePermissions();

  useEffect(() => {
    notificationsService
      .getKpis()
      .then((res) => setUnreadNotificationsCount(res.unreadCount))
      .catch(() => setUnreadNotificationsCount(0));
  }, [refreshKey, pathname]);

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.permission && !can(item.permission)) {
      return false;
    }
    if (item.adminOnly && user?.role !== 'admin') {
      return false;
    }
    return true;
  });

  return (
    <>
      {isMobile && sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-white border-r border-border flex flex-col transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-[280px]',
          isMobile
            ? sidebarMobileOpen
              ? 'translate-x-0'
              : '-translate-x-full'
            : 'translate-x-0'
        )}
      >
        {/* Header with Centered Larger Logo & Refined Text */}
        <div className="flex flex-col items-center justify-center text-center px-4 py-6 border-b border-border/40">
          {collapsed ? (
            <div className="relative w-10 h-10 flex items-center justify-center">
              <Image
                src="/assets/logo-sti.png"
                alt="STI Logo"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <div className="flex flex-col items-center text-center space-y-3 w-full">
              {/* Centered Bigger Logo Image */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                <Image
                  src="/assets/logo-sti.png"
                  alt="STI Logo"
                  width={96}
                  height={96}
                  className="object-contain"
                  priority
                />
              </div>

              {/* Centered Refined Text Below Logo */}
              <div className="text-center">
                <span className="block text-xl font-bold tracking-tight text-foreground leading-none">
                  STI
                </span>
                <span className="block text-sm font-semibold text-primary mt-1.5 leading-none">
                  Distribution
                </span>
                <span className="block text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider mt-2.5">
                  ERP Management System
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items Filtered by Permissions */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            let badgeValue: number | undefined = undefined;
            if (item.href === '/orders' && unvalidatedCount > 0) {
              badgeValue = unvalidatedCount;
            } else if (item.href === '/notifications' && unreadNotificationsCount > 0) {
              badgeValue = unreadNotificationsCount;
            } else if (item.badge) {
              badgeValue = item.badge;
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mb-0.5',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                onClick={() => isMobile && setSidebarMobileOpen(false)}
              >
                {isActive && (
                  <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
                )}
                <Icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-primary' : 'opacity-70 group-hover:opacity-100')} />
                {!collapsed && <span>{item.label}</span>}
                {badgeValue && !collapsed && (
                  <span className={cn(
                    "ml-auto text-white text-[11px] font-bold px-2 py-0.5 rounded-full leading-none shadow-xs",
                    item.href === '/orders' ? "bg-amber-500 animate-pulse" : "bg-primary"
                  )}>
                    {badgeValue}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
