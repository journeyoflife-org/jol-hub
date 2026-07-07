'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Search,
} from 'lucide-react';
import { useUsers, useRoles } from '@/lib/hooks';
import { EU_COUNTRIES } from '@/lib/countries';
import { ROLE_LABELS, ROLE_BADGE_COLORS } from '@/lib/auth';
import type { AdminRole } from '@/types';

// =============================================================================
// Settings Page
// Role management and system configuration
// SOC2 CC6.1: Access control management interface
// =============================================================================

export default function SettingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);

  const { data: usersData } = useUsers({
    search: searchQuery,
    country: selectedCountry,
    role: selectedRole,
  });
  useRoles();

  // Extract users array from response
  const users = usersData?.users ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Role management and system configuration
          </p>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className="space-y-4">
        {/* Roles & Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Users & Roles</CardTitle>
                <CardDescription>
                  Manage user access and role assignments
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddUserDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Countries</SelectItem>
                  {EU_COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Roles</SelectItem>
                  {Object.entries(ROLE_LABELS).map(([role, label]) => (
                    <SelectItem key={role} value={role}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={ROLE_BADGE_COLORS[user.role as AdminRole]}>
                        {ROLE_LABELS[user.role as AdminRole] || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {EU_COUNTRIES.find(c => c.code === user.country)?.flag} 
                        {user.country || 'Global'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Role Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
            <CardDescription>
              4-tier federation hierarchy permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Super Admin */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800">Super Admin</Badge>
                    <span className="text-sm text-muted-foreground">Tier: Global</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Full system access</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Can manage all countries, dioceses, parishes, and users. Access to all analytics and compliance data.
                </p>
              </div>

              {/* Country Admin */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-100 text-purple-800">Country Admin</Badge>
                    <span className="text-sm text-muted-foreground">Tier: Country</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Country-scoped access</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Can manage dioceses and parishes within their assigned country. Country-scoped analytics access.
                </p>
              </div>

              {/* Diocese Admin */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800">Diocese Admin</Badge>
                    <span className="text-sm text-muted-foreground">Tier: Diocese</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Diocese-scoped access</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Can manage parishes within their diocese. Diocese-scoped analytics and parish approval workflow.
                </p>
              </div>

              {/* Parish Admin */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">Parish Admin</Badge>
                    <span className="text-sm text-muted-foreground">Tier: Parish</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Single parish access</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Can manage their parish content and users. Parish-scoped analytics only.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>
              Platform-wide configuration options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Bitrix24 Integration */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Bitrix24 Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable real-time CRM synchronization
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              {/* GDPR Mode */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">GDPR Strict Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enforce Article 44 data residency at all levels
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              {/* Canonical Approval */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Canonical Approval Required</Label>
                  <p className="text-sm text-muted-foreground">
                    Require bishop approval for Catholic entities
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              {/* Emergency Stop */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Emergency Stop</Label>
                  <p className="text-sm text-muted-foreground">
                    SOC2 CC6.1 emergency shutdown capability
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Activate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with role assignment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@jol-hub.eu" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([role, label]) => (
                    <SelectItem key={role} value={role}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {EU_COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowAddUserDialog(false)}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
