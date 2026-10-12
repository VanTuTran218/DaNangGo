import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import type { Request, Response } from 'express';
import { requireAuth } from '../src/middleware/requireAuth';

const secret = 'test-only-shared-jwt-secret-with-32-plus-characters';

function createToken(claims: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function invokeMiddleware(authorization?: string) {
  let statusCode: number | undefined;
  let body: unknown;
  let nextCalled = false;
  const request = {
    header: () => authorization,
  } as unknown as Request;
  const response = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(value: unknown) {
      body = value;
      return this;
    },
  } as unknown as Response;

  requireAuth(request, response, () => {
    nextCalled = true;
  });

  return { request, statusCode, body, nextCalled };
}

test('rejects a request without a bearer token', () => {
  const result = invokeMiddleware();

  assert.equal(result.statusCode, 401);
  assert.equal(result.nextCalled, false);
});

test('accepts a valid HS256 token and exposes its numeric subject', () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = secret;
  try {
    const token = createToken({ sub: '42', exp: Math.floor(Date.now() / 1000) + 60 });
    const result = invokeMiddleware(`Bearer ${token}`);

    assert.equal(result.nextCalled, true);
    assert.deepEqual(result.request.authenticatedUser, { id: 42 });
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test('rejects expired tokens', () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = secret;
  try {
    const token = createToken({ sub: 42, exp: Math.floor(Date.now() / 1000) - 1 });
    const result = invokeMiddleware(`Bearer ${token}`);

    assert.equal(result.statusCode, 401);
    assert.equal(result.nextCalled, false);
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});
