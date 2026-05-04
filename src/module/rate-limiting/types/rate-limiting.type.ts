export type RateLimitContext = {
  apiKeyId: string;
  workspaceId?: string;
  ip: string;
  identifier?: string;
  endpoint: string;
};
