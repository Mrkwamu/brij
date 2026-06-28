# Brij 

**API Key management infrastructure for developers**
 
## What is Brij? 

 Brij is a backend service that handles API access. Instead of building you own key issuance, hashing, validation, rotation and revocation logic, you point your API at Brij's verify endpoint. It tells you whether the incomin key is valid, the permissions it carries and how many requests are left.

Keys are never stored in plain text, only an HMAC-SHA256 is stored, so a database breach never exposes the user's secrets. Every verify call checks the key status, expiry, rotation deadline and rate limit in a single request, with Redis caching to keep latency low.

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
| Authentication | JWT |
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
npx prisma db seed
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

Interactive API documentation available at:

- **Live:** `https://brij-production.up.railway.app/docs`
- **Local:** `http://localhost:5000/docs`


### Verify an API Key

```bash
curl -X 'POST' \
  'https://brij-production.up.railway.app/api/v1/verify' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer paymentbrij_live_c9f2aaa21bddbea349d1f5809d89d4c5308077308030ce202d70339f4fdf47e64b8675' \
  -H 'Content-Type: application/json' \
  -d '{
  "namespace": "payment-api",
  "identifier": "user_123"
}'
```


