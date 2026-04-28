import { IsInt, Min, Max } from 'class-validator';

export class PolicyDto {
  // max number of requests allowed within the time window
  // e.g: 100 requests
  @IsInt({ message: 'limit must be a whole number' })
  @Min(1, { message: 'limit must be at least 1 request' })
  @Max(10000, { message: 'limit cannot exceed 10000 requests' })
  limit!: number;

  // duration of the rate limit window in seconds
  // example: 60 = 1 minute,  86400 = 1 day
  @IsInt({ message: 'window must be a whole number (in seconds)' })
  @Min(1, { message: 'window must be at least 1 second' })
  @Max(86400, { message: 'window cannot exceed 86400 seconds (24 hours)' })
  window!: number;
}
