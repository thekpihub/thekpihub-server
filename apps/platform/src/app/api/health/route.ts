/**
 * Basic Health Check Endpoint
 * GET /api/health
 *
 * Returns a simple status indicating if the application is running.
 * Used by uptime monitoring services and load balancers.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime?: number;
  version?: string;
  message?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<HealthResponse>> {
  try {
    // Calculate uptime (simplified - in production, track process start time)
    const uptime = process.uptime ? Math.floor(process.uptime()) : 0;

    // Get version from package.json or environment
    const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

    const response: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime,
      version,
      message: 'Platform is operational',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const response: HealthResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };

    return NextResponse.json(response, { status: 503 });
  }
}

// Allow HEAD requests for monitoring tools
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
}
