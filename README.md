# Aurex Academy — Learning Management System with Live Classes

Full-stack MERN LMS for an internship demonstration: courses, video processing, quizzes, WebRTC live classes, certificates, Stripe test payments, and role-based dashboards.

## Features

- **Students:** browse/enroll, watch lessons, take quizzes, join live classes, track progress, earn PDF certificates
- **Instructors:** create courses/lessons, upload videos (BullMQ + FFmpeg), schedule live classes, quizzes, revenue dashboard
- **Admins:** approve instructors, moderate courses, manage users/enrollments/payments
- **Video:** local storage + HLS processing; optional AWS CloudFront signed delivery when configured
- **Payments:** Stripe Checkout in test mode with webhook/session verification (no card data stored)

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React, Vite, Redux Toolkit, React Router, Socket.IO client, hls.js |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, Socket.IO |
| Jobs | BullMQ, Redis, FFmpeg |
| Payments | Stripe (test mode) |
| Certificates | PDFKit |

## Project structure

```
LMSWLC10/
  backend/          Express API + worker
  frontend/         React + Vite SPA
  docker-compose.yml  MongoDB + Redis
  PROJECT_PROGRESS.md
```

## Prerequisites (Windows)

- Node.js 18+ (tested on 22)
- Docker Desktop (recommended for MongoDB + Redis)
- FFmpeg on PATH (`ffmpeg -version`)
- Optional: Stripe test keys, AWS CloudFront credentials for production delivery

## Quick start (PowerShell)

```powershell
cd D:\LMSWLC10

# 1) Start MongoDB + Redis
docker compose up -d

# 2) Install dependencies
npm run install:all

# 3) Backend env (already seeded with local defaults)
Copy-Item backend\.env.example backend\.env -ErrorAction SilentlyContinue

# 4) Seed demo users + sample course
npm run seed

# 5) Start API, worker, and frontend (3 terminals or use concurrently)
npm run dev:backend
npm run dev:worker
npm run dev:frontend
```

Or from the repo root after `npm install`:

```powershell
npm run docker:up
npm run install:all
npm run seed
npm run dev
```

- Frontend: https://aurex-academy-lms.netlify.app/  
- API: http://localhost:5000  
- Swagger: http://localhost:5000/api/docs  

### Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lmswlc.local | Admin123! |
| Instructor | instructor@lmswlc.local | Instructor123! |
| Student | student@lmswlc.local | Student123! |

## Environment variables

See `backend/.env.example` and `frontend/.env.example`.

Important backend keys:

- `MONGODB_URI`, `REDIS_HOST`, `REDIS_PORT`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `STORAGE_ADAPTER=local`, `VIDEO_DELIVERY=local` (default for local/dev)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (test mode)
- `CLOUDFRONT_*` / `AWS_*` only when using CloudFront
- `WEBRTC_STUN_URLS`, optional `WEBRTC_TURN_*`

**CloudFront is not active** unless `VIDEO_DELIVERY=cloudfront` and distribution + signing keys are set. Local media is served from `/media`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run docker:up` | Start MongoDB + Redis |
| `npm run dev:backend` | API with watch |
| `npm run dev:worker` | Video processing worker |
| `npm run dev:frontend` | Vite dev server |
| `npm run seed` | Seed demo data |
| `npm test` | Backend Jest tests |
| `npm run build` | Frontend production build |

## Stripe test mode

1. Set `STRIPE_SECRET_KEY=sk_test_...` in `backend/.env`
2. For webhooks locally, use Stripe CLI:  
   `stripe listen --forward-to localhost:5000/api/payments/webhook`
3. Set `STRIPE_WEBHOOK_SECRET` from the CLI output
4. Paid enrollment creates a Checkout Session; enrollment is granted only after verified payment (webhook or `/api/payments/confirm/:sessionId`)

Never store card numbers in this application.

## AWS CloudFront (optional production)

1. Upload/process videos to your chosen origin (S3 or equivalent)
2. Create a CloudFront distribution
3. Configure signed URLs with a key pair
4. Set env vars: `VIDEO_DELIVERY=cloudfront`, `CLOUDFRONT_DOMAIN`, `CLOUDFRONT_KEY_PAIR_ID`, `CLOUDFRONT_PRIVATE_KEY`, AWS credentials as needed

This repo does **not** deploy a CloudFront distribution for you.

## WebRTC / live classes

- Signaling and chat: Socket.IO (`live:*`, `webrtc:signal`)
- ICE servers from `WEBRTC_STUN_URLS` / TURN env vars
- Many NATs require a TURN server for reliable connectivity

## FFmpeg

```powershell
ffmpeg -version
```

If missing, install via winget or https://www.gyan.dev/ffmpeg/builds/ and ensure it is on PATH. Optionally set `FFMPEG_PATH` / `FFPROBE_PATH`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| API cannot connect to Mongo | `docker compose up -d` and check port 27017 |
| Video upload queue fails | Start Redis + `npm run dev:worker` |
| HLS not playing | Confirm worker processed job; check lesson `video.status` |
| Instructor cannot login | Admin must approve pending instructors |
| Stripe checkout 503 | Set a real `sk_test_...` key |
| CORS / cookies | Match `CLIENT_URL` with the Vite origin; refresh cookie path is `/api/auth` |

## API documentation

Interactive docs: `http://localhost:5000/api/docs`  
OpenAPI JSON: `http://localhost:5000/api/docs.json`

## License

Internship / educational project.
