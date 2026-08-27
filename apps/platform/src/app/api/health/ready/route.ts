/**
 * Readiness Probe Endpoint
 * GET /api/health/ready
 *
 * Used by load balancers and orchestration platforms (Vercel, Kubernetes, etc.)
 * to determine if the instance is ready to accept traffic.
 *
 * Returns 200 if ready, 503 if starting up or degraded.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface ReadinessResponse {
  ready: boolean;
  timestamp: string;
  uptime: number;
  message: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<ReadinessResponse>> {
  try {
    const uptime = process.uptime ? Math.floor(process.uptime()) : 0;

    // Consider the service ready if it's been running for at least 5 seconds
    // This gives it time to initialize connections and load configuration
    const isReady = uptime >= 5;

    const response: ReadinessResponse = {
      ready: isReady,
      timestamp: new Date().toISOString(),
      uptime,
      message: isReady ? 'Service is ready to accept traffic' : 'Service is still starting up',
    };

    const statusCode = isReady ? 200 : 503;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    const response: ReadinessResponse = {
      ready: false,
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? Math.floor(process.uptime()) : 0,
      message: `Readiness check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };

    return NextResponse.json(response, { status: 503 });
  }
}

// Lightweight HEAD request for basic connectivity check
export async function HEAD(): Promise<NextResponse> {
  try {
    const uptime = process.uptime ? Math.floor(process.uptime()) : 0;
    const isReady = uptime >= 5;
    return new NextResponse(null, { status: isReady ? 200 : 503 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
