// =============================================================================
// JOL-HUB Sidebar Component
// 27-country selector with 4-tier hierarchy indicator
// GDPR Article 44: Country context selection for data residency
// =============================================================================

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Church,
  Users,
  Building2,
  BarChart3,
  Shield,
  Settings,
  Globe,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCountry, useHierarchy } from '@/hooks';
import { ROLE_LABELS } from '@/lib/auth';
import type { FederationTier } from '@/types';

// Tier icons for visual hierarchy
const TIER_ICONS: Record<FederationTier, typeof Globe> = {
  global: Globe,
  country: Globe,
  diocese: Building2,
  parish: Church,
};

// Main navigation - scoped by federation tier
const NAVIGATION = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Entities', href: '/dashboard/entities', icon: Church },
  { name: 'Users', href: '/dashboard/users', icon: Users },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Compliance', href: '/dashboard/compliance', icon: Shield },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const { currentCountry, setCountry, allCountries } = useCountry();
  const { tier, entityName, isGlobalAdmin } = useHierarchy();

  // Get the country code from currentCountry
  const countryCode = currentCountry?.code ?? '';

  const user = session?.user;
  const userRole = (user as any)?.role || 'user';
  const TierIcon = TIER_ICONS[tier];

  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';

  return (
    <aside
      className={cn(
        'bg-sidebar border-sidebar-border flex h-screen flex-col border-r transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo & Tier Indicator */}
      <div className="border-sidebar-border flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <span className="text-primary-foreground text-sm font-bold">J</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sidebar-foreground text-sm font-semibold">JOL-HUB</span>
              <span className="text-muted-foreground text-xs">Admin</span>
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Tier & Country Context - GDPR Article 44 */}
      {!collapsed && (
        <div className="border-sidebar-border border-b px-3 py-2">
          <div className="bg-sidebar-accent/50 flex items-center gap-2 rounded-lg px-2 py-1.5">
            <TierIcon className="text-primary h-4 w-4" />
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs capitalize">{tier} Level</p>
              <p className="truncate text-sm font-medium">{entityName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {NAVIGATION.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Country Selector - Global Admins Only */}
      {!collapsed && isGlobalAdmin && (
        <div className="border-sidebar-border border-t px-3 py-2">
          <label className="text-muted-foreground mb-1 block px-2 text-xs font-medium">
            Country Context
          </label>
          <select
            value={countryCode}
            onChange={(e) => setCountry(e.target.value)}
            className="border-input bg-background w-full rounded-md border px-2 py-1.5 text-sm"
          >
            <option value="">All Countries</option>
            {allCountries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Emergency Stop - SOC2 CC6.1 */}
      {!collapsed && (
        <div className="border-sidebar-border border-t px-3 py-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Emergency Stop
          </Button>
        </div>
      )}

      {/* User Profile */}
      <div className="border-sidebar-border border-t p-4">
        <Link
          href="/dashboard/profile"
          className={cn(
            'hover:bg-sidebar-accent flex items-center gap-3 rounded-lg p-2 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sidebar-foreground truncate text-sm font-medium">{user?.name}</p>
              <p className="text-muted-foreground truncate text-xs">
                {ROLE_LABELS[userRole as keyof typeof ROLE_LABELS] ?? userRole}
              </p>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
