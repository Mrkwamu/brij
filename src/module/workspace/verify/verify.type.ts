import { ApiKeyStatus } from '../../../../generated/prisma/enums';

export interface ParsedApikey {
  raw: string;
  prefixName: string;
  env: string;
  lookupKey: string;
}

export interface VerifyApiKey {
  allowed: boolean;
  keyId: string;
  // ownerId: string;
  permission?: string[];
  remaining?: number;
  limit?: number;
  resetAt: number;
}

export type ApiKeyCache = {
  id: string;
  hashedKey: string;
  permission: string[];
  expiresAt: Date | null;
  rotateAt: Date | null;
  status: ApiKeyStatus;
  lastUsedAt: Date | null;
  policy: {
    limit: number | null;
    window: number | null;
    burstLimit: number | null;
  };
  userId: string;
};
