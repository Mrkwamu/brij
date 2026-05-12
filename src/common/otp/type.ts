export interface GenerateOtpResult {
  otp: number;
  hashedOtp: string;
  expiresAt: Date;
}
