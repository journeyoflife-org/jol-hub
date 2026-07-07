import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'operational',
    lastSync: new Date().toISOString(),
    pendingJobs: 0,
    connectedEntities: 0,
    version: '1.0.0',
  });
}
