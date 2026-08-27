/**
 * Detailed Health Check Endpoint
 * GET /api/health/detailed
 *
 * Returns comprehensive system status including database, external services,
 * and performance metrics. Used by monitoring dashboards and incident response.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: string;
  message?: string;
}

interface DetailedHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    platform: ServiceStatus;
    database?: ServiceStatus;
    stripe?: ServiceStatus;
    anthropic?: ServiceStatus;
  };
  metrics: {
    memory: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
    cpu?: NodeJS.CpuUsage;
  };
  checks: {
    totalChecks: number;
    healthyChecks: number;
    degradedChecks: number;
    unhealthyChecks: number;
  };
}

async function checkDatabase(): Promise<ServiceStatus> {
  const startTime = Date.now();
  const checkTime = new Date().toISOString();

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        name: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: checkTime,
        message: 'Missing Supabase credentials',
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Simple query to check database connectivity
    const { error, data } = await Promise.race([
      supabase.from('profiles').select('id').limit(1),
      new Promise<{ error: Error; data: null }>((_, reject) =>
        setTimeout(() => reject(new Error('Database check timeout')), 5000)
      ),
    ]);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        name: 'database',
        status: responseTime > 3000 ? 'degraded' : 'unhealthy',
        responseTime,
        lastChecked: checkTime,
        message: error.message,
      };
    }

    return {
      name: 'database',
      status: 'healthy',
      responseTime,
      lastChecked: checkTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: 'database',
      status: responseTime > 5000 ? 'degraded' : 'unhealthy',
      responseTime,
      lastChecked: checkTime,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkStripe(): Promise<ServiceStatus | null> {
  const startTime = Date.now();
  const checkTime = new Date().toISOString();

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return null; // Stripe not configured
    }

    // Stripe test by validating the API key format
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey.startsWith('sk_test_') && !stripeKey.startsWith('sk_live_')) {
      return {
        name: 'stripe',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: checkTime,
        message: 'Invalid Stripe API key format',
      };
    }

    // In production, you could make an actual Stripe API call here
    // For now, we just validate the key format
    const responseTime = Date.now() - startTime;

    return {
      name: 'stripe',
      status: 'healthy',
      responseTime,
      lastChecked: checkTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: 'stripe',
      status: 'unhealthy',
      responseTime,
      lastChecked: checkTime,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkAnthropicAPI(): Promise<ServiceStatus | null> {
  const startTime = Date.now();
  const checkTime = new Date().toISOString();

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return null; // Anthropic not configured
    }

    // Validate API key format
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey.startsWith('sk-') && !apiKey.startsWith('sk_test_')) {
      return {
        name: 'anthropic',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: checkTime,
        message: 'Invalid Anthropic API key format',
      };
    }

    const responseTime = Date.now() - startTime;

    return {
      name: 'anthropic',
      status: 'healthy',
      responseTime,
      lastChecked: checkTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: 'anthropic',
      status: 'unhealthy',
      responseTime,
      lastChecked: checkTime,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<DetailedHealthResponse>> {
  try {
    const startTime = Date.now();

    // Check all services in parallel
    const [dbStatus, stripeStatus, anthropicStatus] = await Promise.all([
      checkDatabase(),
      checkStripe(),
      checkAnthropicAPI(),
    ]);

    // Build services object
    const services: Record<string, ServiceStatus> = {
      platform: {
        name: 'platform',
        status: 'healthy',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
      },
    };

    if (dbStatus) services.database = dbStatus;
    if (stripeStatus) services.stripe = stripeStatus;
    if (anthropicStatus) services.anthropic = anthropicStatus;

    // Calculate overall status
    const serviceValues = Object.values(services);
    const healthyChecks = serviceValues.filter((s) => s.status === 'healthy').length;
    const degradedChecks = serviceValues.filter((s) => s.status === 'degraded').length;
    const unhealthyChecks = serviceValues.filter((s) => s.status === 'unhealthy').length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyChecks > 0) overallStatus = 'unhealthy';
    else if (degradedChecks > 0) overallStatus = 'degraded';

    // Get memory metrics
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage ? process.cpuUsage() : undefined;

    const response: DetailedHealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? Math.floor(process.uptime()) : 0,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'unknown',
      services: services as DetailedHealthResponse['services'],
      metrics: {
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024), // MB
          rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        },
        cpu: cpuUsage,
      },
      checks: {
        totalChecks: serviceValues.length,
        healthyChecks,
        degradedChecks,
        unhealthyChecks,
      },
    };

    // Return appropriate status code
    const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    const response: DetailedHealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? Math.floor(process.uptime()) : 0,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'unknown',
      services: {
        platform: {
          name: 'platform',
          status: 'unhealthy',
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      metrics: {
        memory: {
          heapUsed: 0,
          heapTotal: 0,
          external: 0,
          rss: 0,
        },
      },
      checks: {
        totalChecks: 1,
        healthyChecks: 0,
        degradedChecks: 0,
        unhealthyChecks: 1,
      },
    };

    return NextResponse.json(response, { status: 503 });
  }
}
