import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const toNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const parseList = (value = '') =>
  value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: toNumber(process.env.PORT, 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lmswlc',
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: toNumber(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  platformName: process.env.PLATFORM_NAME || 'Aurex Academy',
  platformFeePercent: toNumber(process.env.PLATFORM_FEE_PERCENT, 15),
  storageAdapter: process.env.STORAGE_ADAPTER || 'local',
  videoDelivery: process.env.VIDEO_DELIVERY || 'local',
  uploadMaxMb: toNumber(process.env.UPLOAD_MAX_MB, 500),
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || '',
    cloudFrontDomain: process.env.CLOUDFRONT_DOMAIN || '',
    cloudFrontKeyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID || '',
    cloudFrontPrivateKey: (process.env.CLOUDFRONT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    signedUrlTtl: toNumber(process.env.CLOUDFRONT_SIGNED_URL_TTL, 3600),
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    currency: process.env.STRIPE_CURRENCY || 'usd',
  },
  ffmpegPath: process.env.FFMPEG_PATH || '',
  ffprobePath: process.env.FFPROBE_PATH || '',
  webrtc: {
    stunUrls: parseList(process.env.WEBRTC_STUN_URLS || 'stun:stun.l.google.com:19302'),
    turnUrls: parseList(process.env.WEBRTC_TURN_URLS || ''),
    turnUsername: process.env.WEBRTC_TURN_USERNAME || '',
    turnCredential: process.env.WEBRTC_TURN_CREDENTIAL || '',
  },
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@lmswlc.local',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
    instructorEmail: process.env.SEED_INSTRUCTOR_EMAIL || 'instructor@lmswlc.local',
    instructorPassword: process.env.SEED_INSTRUCTOR_PASSWORD || 'Instructor123!',
    studentEmail: process.env.SEED_STUDENT_EMAIL || 'student@lmswlc.local',
    studentPassword: process.env.SEED_STUDENT_PASSWORD || 'Student123!',
  },
};

export const storageRoot = path.resolve(__dirname, '../../storage');
