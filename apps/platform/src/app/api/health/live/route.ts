/**
 * Liveness Probe Endpoint
 * GET /api/health/live
 *
 * Used by orchestration platforms (Vercel, Kubernetes, etc.) to determine
 * if the process is still alive. If this returns non-200, the service
 * should be restarted.
 *
 * This is a simple check that the process is running.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface LivenessResponse {
  alive: boolean;
  timestamp: string;
  pid?: number;
}

export async function GET(request: NextRequest): Promise<NextResponse<LivenessResponse>> {
  try {
    const response: LivenessResponse = {
      alive: true,
      timestamp: new Date().toISOString(),
      pid: process.pid,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const response: LivenessResponse = {
      alive: false,
      timestamp: new Date().toISOString(),
      pid: process.pid,
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// Lightweight HEAD request
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
}
