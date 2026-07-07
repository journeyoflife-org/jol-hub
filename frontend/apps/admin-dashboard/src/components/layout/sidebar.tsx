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

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo & Tier Indicator */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">J</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground text-sm">JOL-HUB</span>
              <span className="text-xs text-muted-foreground">Admin</span>
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
        <div className="px-3 py-2 border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-sidebar-accent/50">
            <TierIcon className="h-4 w-4 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground capitalize">{tier} Level</p>
              <p className="text-sm font-medium truncate">{entityName}</p>
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
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
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
        <div className="px-3 py-2 border-t border-sidebar-border">
          <label className="text-xs font-medium text-muted-foreground px-2 mb-1 block">
            Country Context
          </label>
          <select
            value={countryCode}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-2 py-1.5 text-sm rounded-md border border-input bg-background"
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
        <div className="px-3 py-2 border-t border-sidebar-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Emergency Stop
          </Button>
        </div>
      )}

      {/* User Profile */}
      <div className="border-t border-sidebar-border p-4">
        <Link
          href="/dashboard/profile"
          className={cn(
            'flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {ROLE_LABELS[userRole as keyof typeof ROLE_LABELS] ?? userRole}
              </p>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
