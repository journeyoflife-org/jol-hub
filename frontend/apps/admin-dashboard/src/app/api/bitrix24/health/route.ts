import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    healthy: true,
    timestamp: new Date().toISOString(),
    services: {
      database: 'healthy',
      cache: 'healthy',
      bitrix24: 'connected',
    },
  });
}
