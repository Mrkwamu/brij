export interface RateLimitCtx {
  lookupKey: string;
  namespace?: string;
  identifier?: string;
}

export interface RateLimitPolicy {
  limit: number;
  window: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
}

export type LuaResult = [number, number, number, number];
