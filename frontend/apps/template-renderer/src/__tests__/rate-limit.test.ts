/**
 * Rate-limit tests — STEP 10 (login brute-force limiter).
 *
 * Covers the general window limiter and the login-specific budget
 * (5 attempts / 15 min / IP, OWASP ASVS V2.2).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isLoginRateLimited,
  isRateLimited,
  resetRateLimiter,
} from '../lib/rate-limit';

const NOW = 1_000_000_000_000;

test('general limiter allows the window budget then blocks', () => {
  resetRateLimiter();
  for (let i = 0; i < 120; i += 1) {
    assert.equal(isRateLimited('ip|t', NOW + i), false);
  }
  assert.equal(isRateLimited('ip|t', NOW + 121), true);
});

test('login limiter allows 5 attempts then blocks (brute force)', () => {
  resetRateLimiter();
  for (let i = 0; i < 5; i += 1) {
    assert.equal(isLoginRateLimited('login|1.2.3.4', NOW + i), false, `attempt ${i + 1}`);
  }
  assert.equal(isLoginRateLimited('login|1.2.3.4', NOW + 6), true);
  assert.equal(isLoginRateLimited('login|1.2.3.4', NOW + 7), true);
});

test('login limiter windows reset after 15 minutes', () => {
  resetRateLimiter();
  for (let i = 0; i < 5; i += 1) {
    isLoginRateLimited('login|9.9.9.9', NOW);
  }
  assert.equal(isLoginRateLimited('login|9.9.9.9', NOW + 1), true);
  // 15 minutes later the budget is restored.
  assert.equal(isLoginRateLimited('login|9.9.9.9', NOW + 15 * 60 * 1000 + 1), false);
});

test('login limiter keys are isolated per IP', () => {
  resetRateLimiter();
  for (let i = 0; i < 5; i += 1) {
    isLoginRateLimited('login|a', NOW);
  }
  assert.equal(isLoginRateLimited('login|a', NOW + 1), true);
  assert.equal(isLoginRateLimited('login|b', NOW + 1), false);
});
