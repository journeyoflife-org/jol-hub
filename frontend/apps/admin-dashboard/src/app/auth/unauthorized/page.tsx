'use client';

import { ShieldX } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You do not have the required permissions to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Link href="/dashboard">
            <Button className="w-full">Go to Dashboard</Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">Sign In with Different Account</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
