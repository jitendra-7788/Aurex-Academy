import { env } from '../../config/env.js';
import { localStorage } from './localStorage.js';

export function getStorage() {
  // S3 adapter can be plugged in when AWS credentials are present.
  // Local adapter keeps development fully functional without AWS.
  if (env.storageAdapter === 's3' && env.aws.accessKeyId && env.aws.s3Bucket) {
    // Intentionally fall back to local until S3 upload is configured end-to-end.
    console.warn('S3 storage adapter requested but local adapter is used for uploads in this build.');
  }
  return localStorage;
}
