// =============================================================================
// JOL-HUB Header Component
// Tier indicator + Emergency Stop + Bitrix24 sync status
// SOC2 CC6.1: Security controls visible in UI
// =============================================================================

'use client';

import { Bell, Search, Moon, Sun, User, LogOut, Settings, AlertTriangle, Shield } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useHierarchy, useBitrix24 } from '@/hooks';
import { cn } from '@/lib/utils';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const { tier, breadcrumbs } = useHierarchy();
  const { status: bitrixStatus } = useBitrix24();

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  const user = session?.user;
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-full px-6">
        {/* Breadcrumb & Tier Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Badge 
              variant="outline" 
              className={cn(
                'tier-badge',
                `tier-badge-${tier}`
              )}
            >
              {tier.toUpperCase()}
            </Badge>
          </div>
          
          <nav className="hidden md:flex items-center text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.id} className="flex items-center">
                {index > 0 && <span className="mx-2">›</span>}
                <a href={crumb.href} className="hover:text-foreground transition-colors">
                  {crumb.name}
                </a>
              </span>
            ))}
          </nav>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 flex-1 max-w-xl mx-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search entities, users, content..."
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Bitrix24 Sync Status */}
          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-xs">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                bitrixStatus?.circuitBreakerState?.status === 'closed'
                  ? 'bg-green-500'
                  : bitrixStatus?.circuitBreakerState?.status === 'open'
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
              )}
            />
            <span className="text-muted-foreground">
              {bitrixStatus?.connected ? 'Synced' : 'Disconnected'}
            </span>
          </div>

          {/* Emergency Stop */}
          <Button
            variant="ghost"
            size="icon"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <AlertTriangle className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">{user?.name}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Shield className="mr-2 h-4 w-4" />
                Security
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
