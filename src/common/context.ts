import type { Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../auth/auth.js';
import { db } from '../database/db.js';
import { hash, token } from './crypto.js';
import { env } from '../config/env.js';
export type Context = {
  req: Request;
  res: Response;
  actor: string;
  userId?: string;
  email?: string;
  sessionCreatedAt?: Date;
  twoFactorEnabled: boolean;
  capabilities: string[];
  requestId: string;
};
export async function context(req: Request, res: Response): Promise<Context> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  let credential = req.cookies?.nkb_guest as string | undefined;
  if (!credential || !/^[a-f0-9]{64}$/.test(credential)) {
    credential = token();
    res.cookie('nkb_guest', credential, {
      httpOnly: true,
      secure: env.PUBLIC_APP_URL.startsWith('https:'),
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 86400000,
    });
  }
  const userId = session?.user.id;
  const grant = userId ? await db.staffGrant.findUnique({ where: { userId } }) : null;
  return {
    req,
    res,
    actor: userId ? 'user:' + userId : 'guest:' + hash(credential),
    userId,
    email: session?.user.email,
    sessionCreatedAt: session?.session.createdAt,
    twoFactorEnabled: session?.user.twoFactorEnabled === true,
    capabilities: grant?.active ? grant.capabilities : [],
    requestId: res.getHeader('X-Request-ID') as string,
  };
}
