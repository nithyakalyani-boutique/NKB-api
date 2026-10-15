import { Module, Controller, Get, Post, Patch, Delete, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { routes } from './routes.js';
import { context } from './common/context.js';
import { csrf, safeEqual } from './common/crypto.js';
import { Problem, requireThat } from './common/problem.js';
import { can } from './auth/permissions.js';
import { env, origins } from './config/env.js';
import { ZodError } from 'zod';
const methods = { GET: Get, POST: Post, PATCH: Patch, DELETE: Delete };
const buckets = new Map<string, { count: number; until: number }>();
const controllers = routes.map((route, index) => {
  class Endpoint {
    async handle(req: Request, res: Response) {
      res.setHeader('Cache-Control', 'private, no-store');
      try {
        const key = (req.ip || 'unknown') + ':' + route.path;
        const now = Date.now();
        let bucket = buckets.get(key);
        if (!bucket || bucket.until < now) {
          bucket = { count: 0, until: now + 60000 };
          buckets.set(key, bucket);
        }
        if (buckets.size > 10000)
          for (const [k, b] of buckets) if (b.until < now) buckets.delete(k);
        const limit = route.path.includes('access') ? 10 : route.method === 'GET' ? 180 : 60;
        requireThat(++bucket.count <= limit, 'RATE_LIMIT', 'Please wait before trying again.', 429);
        const ctx = await context(req, res);
        if (!route.webhook && route.method !== 'GET') {
          requireThat(
            origins.includes(req.header('Origin') || ''),
            'INVALID_ORIGIN',
            'Request origin is not allowed.',
            403,
          );
          requireThat(
            safeEqual(req.header('X-CSRF-Token') || '', csrf(ctx.actor)),
            'CSRF_INVALID',
            'Refresh the page before trying again.',
            403,
          );
        }
        if (route.authenticated || route.permission)
          requireThat(ctx.userId, 'UNAUTHENTICATED', 'Sign in to continue.', 401);
        if (route.permission) {
          requireThat(
            can(ctx.capabilities, route.permission),
            'FORBIDDEN',
            'Your staff role cannot perform this action.',
            403,
          );
          if (env.APP_ENV === 'production')
            requireThat(
              ctx.twoFactorEnabled,
              'MFA_REQUIRED',
              'Enable staff multi-factor authentication.',
              403,
            );
          if (
            env.APP_ENV === 'production' &&
            ['staff.manage', 'refunds.issue'].includes(route.permission)
          )
            requireThat(
              ctx.sessionCreatedAt && Date.now() - ctx.sessionCreatedAt.getTime() < 900000,
              'RECENT_AUTH_REQUIRED',
              'Sign in again for this sensitive action.',
              403,
            );
        }
        const input = (route.schema ? route.schema.parse(req.body) : req.body || {}) as Record<
          string,
          unknown
        >;
        const params = Object.fromEntries(
          Object.entries(req.params).map(([k, v]) => [k, String(v)]),
        );
        const result = await route.handler(ctx, input, params);
        if (!res.headersSent) res.status(route.status || 200).json(result);
      } catch (error) {
        const requestId = res.getHeader('X-Request-ID');
        const validation = error instanceof ZodError;
        const p =
          error instanceof Problem
            ? error
            : new Problem(
                validation ? 400 : 500,
                validation ? 'INVALID_INPUT' : 'INTERNAL_ERROR',
                validation
                  ? 'Check the highlighted input fields.'
                  : 'Something went wrong. Please try again.',
              );
        if (p.status === 500)
          console.error(
            JSON.stringify({
              level: 'error',
              requestId,
              route: route.path,
              category: error instanceof Error ? error.constructor.name : 'Unknown',
            }),
          );
        if (p.status === 429) res.setHeader('Retry-After', '60');
        res
          .status(p.status)
          .type('application/problem+json')
          .json({
            type: 'urn:nkb:error:' + p.code.toLowerCase(),
            title: p.message,
            status: p.status,
            code: p.code,
            requestId,
            errors: validation
              ? error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
              : undefined,
          });
      }
    }
  }
  Object.defineProperty(Endpoint, 'name', { value: 'Endpoint' + index });
  Controller('api/v1')(Endpoint);
  const descriptor = Object.getOwnPropertyDescriptor(Endpoint.prototype, 'handle')!;
  methods[route.method](route.path)(Endpoint.prototype, 'handle', descriptor);
  Req()(Endpoint.prototype, 'handle', 0);
  Res()(Endpoint.prototype, 'handle', 1);
  return Endpoint;
});
@Module({ controllers })
export class AppModule {}
