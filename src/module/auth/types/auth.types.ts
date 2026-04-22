export interface JwtPayload {
  userId: string;
}

export interface AuthSession {
  userId: string;
  token: string;
  device: string;
  ipAddress: string;
  expiresAt: Date;
}

export type AuthTokenResult = {
  accessToken: string;
  refreshToken: string;
  refreshTokenTtlMs: number;
  expiresAt: Date;
};
