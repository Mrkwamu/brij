import {
  AlgorithmType,
  ApiKeyStatus,
} from '../../../../../generated/prisma/enums';

export interface ApikeysResponse {
  id: string;
  keyName: string | null;
  keyPrefix: string;
  status: ApiKeyStatus;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
}
export type ApiKeyCache = {
  id: string;
  hashedKey: string;
  permission: string[];
  expiresAt: Date | null;
  status: ApiKeyStatus;
  lastUsedAt: Date | null;
  policies: {
    limit: number | null;
    window: number | null;
    type: AlgorithmType;
  };
};
