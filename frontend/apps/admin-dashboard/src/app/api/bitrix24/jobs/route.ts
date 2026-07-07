import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    jobs: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
}
