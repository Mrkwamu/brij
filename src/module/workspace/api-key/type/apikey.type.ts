import { ApiKeyStatus } from '../../../../../generated/prisma/enums';

export interface ApiResponse {
  publicId: string;
  name: string;
}

export interface ApikeysResponse {
  publicId: string;
  keyName: string;
  keyPrefix: string;
  status: ApiKeyStatus;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
}

export interface ApikeyResponse {
  publicId: string;
  keyName: string;
  keyPrefix: string;
  permission: string[];
  environment: string;
  status: ApiKeyStatus;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  policies: {
    limit: number | null;
    window: number | null;
  } | null;
}

export interface ApiKeyStatusResponse {
  status: ApiKeyStatus;
  updatedAt: Date;
}

export interface RotateApiKeyResponse {
  apikey: string;
  gracePeriod: GracePeriod;
  revokeAt: Date;
}

export const gracePeriods = ['30m', '1h', '24h'] as const;

export type GracePeriod = (typeof gracePeriods)[number];
