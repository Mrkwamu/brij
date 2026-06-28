# Brij 

**API Key management infrastructure for developers**
 
## What is Brij? 

Brij is an API key management service for developers. Instead of building your own key issuance, hashing, validation, rotation, and revocation logic, you integrate with Brij's verification endpoint. It validates incoming API keys, checks permissions, enforces quotas and rate limits, and returns whether the request should be allowed.

Keys are never stored in plain text. Instead, Brij stores an HMAC-SHA256 hash, so a database breach never exposes users' API keys. Every verify call checks the key status, expiry, rotation deadline and rate limit in a single request, with Redis caching to keep latency low.

## Features

- **Key issuance** — create structured API keys with a prefix name, environment (live/test), and cryptographic secret
- **Secure hashing** — keys are stored as HMAC-SHA256 hashes, never raw plain text
- **Key verification** — single endpoint to validate a key's status, permissions, expiry, and rate limit
- **Grace-period rotation** — rotate a key while the old one stays valid for a configurable window, so nothing breaks in deployed apps
- **Instant revocation** — revoke a key and bust its Redis cache entry immediately
- **Rate limiting** — per-key request limits enforced via Redis
- **Quota enforcement** — monthly request quotas per user plan, tracked and incremented on every verify call
- **Plan management** — free, starter, pro, and enterprise tiers with upgrade/downgrade support
- **Scheduled cleanup** — a cron job automatically finalizes expired rotations in the database
- **Workspace organisation** — group APIs under workspaces, each workspace belonging to a user
- **Authentication system**
  - User registration with email OTP verification via Resend
  - OTP delivery handled by a BullMQ background job — registration doesn't block on email delivery
  - JWT access token + refresh token issued on login
  - Refresh token stored in an httpOnly cookie, never exposed to JavaScript
  - Full JWT rotation on every refresh — old refresh token invalidated, new pair issued

 ## Tech Stack

| Layer | Technology |
| ------ | ----------|
| Framework | NestJs (Typescript) |
| Database | PostgreSQL + Prisma |
| Cache | Redis |
| Authentication | JWT + HMAC API Keys |
| Email | Resend |
| Queue | BullMQ | 
| Job Scheduling | @nestjs/schedule |
| Documentation | Swagger | 
| Deployment | Railway |


 ## Getting Started
 
 ### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- A [Resend](https://resend.com) account for email


 ### Installation

 Clone the respository and install the project dependencies

 ```bash
git clone https://github.com/Mrkwamu/brij.git
cd brij
npm install
```

### Environment Variables 

create a `.env` file in the project root and the following variables:

```env
APP_NAME=Brij
PORT=5000
NODE_ENV=development

DATABASE_URL=postgresql://user:password@localhost:5432/brij

REDIS_URL=redis://localhost:6379

ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_EXPIRY=15m
REFRESH_EXPIRY=7d

HASH_SECRET_KEY=your_hash_secret

RESEND_KEY=your_resend_api_key
FROM=noreply@example.com

OTP_EXPIRY=5m
```

### Database Setup

Run the database migrations:

```bash
npx prisma migrate dev
```

Run the database seed:
```bash
npx prisma db seed
```

### Run the Application

Start the development server:

```bash
npm run start:dev
```

Build the application for production:

```bash
npm run build
```

Run the production build:

```bash
npm run start:prod
```


## API Documentation

Brij exposes interactive API documentation through Swagger/OpenAPI

- **Live:** `https://brij-production.up.railway.app/docs`
- **Local:** `http://localhost:5000/docs`


### Verify an API Key

```bash
curl -X 'POST' \
  'https://brij-production.up.railway.app/api/v1/verify' \
  -H 'Authorization: Bearer <your-api-key>' \
  -H 'Content-Type: application/json' \
  -d '{
  "namespace": "payment-api",
  "identifier": "user_123"
}'
```

**Response:**

```json
{
    "success": true,
    "message": "API key verified successfully",
    "data": {
        "allowed": true,
        "publicId": "key_Xj6LVoB0gC",
        "permission": [
            "read",
            "write"
        ],
        "remaining": 4,
        "limit": 5,
        "resetAt": 1782665234
    }
}
```

### Error Response

Error responses do **not** use the `BaseResponse` wrapper
```json
{
    "statusCode": 429,
    "message": "Rate limit exceeded. Please try again later.",
    "path": "/api/v1/verify",
    "timestamp": "2026-06-28T16:57:43.776Z"
}
```

## Design Decisions

### HMAC-SHA256 instead of bcrypt

API keys are randomly generated with high entropy, so they don't have the same attack model as user passwords. bcrypt is intentionally slow to protect weak, human-created passwords, but that extra cost doesn't provide much value for API keys.

I chose HMAC-SHA256 because it's deterministic, fast, and allows key verification without introducing unnecessary latency on every request.

### Grace-period key rotation

Replacing an API key shouldn't immediately break applications that are still using the old one. When a key is rotated, the new key becomes available immediately while the old key remains valid for a configurable grace period.

Once the grace period expires, a scheduled job automatically revokes the old key. This allows applications to update their configuration without downtime.

### Fail closed on verification errors

If Redis or PostgreSQL is unavailable during key verification, Brij rejects the request instead of allowing it through.


## Roadmap

- [ ] Usage logging
- [ ] Automatic quota reset
- [ ] Webhook notifications
- [ ] API key expiry notifications

## License

MIT




