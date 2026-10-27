import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import { env } from '../config/env.js';

export function isCloudFrontConfigured() {
  return Boolean(
    env.aws.cloudFrontDomain &&
      env.aws.cloudFrontKeyPairId &&
      env.aws.cloudFrontPrivateKey
  );
}

export function getVideoDeliveryUrl({ hlsKey, relativePath, useSigned = true }) {
  const key = hlsKey || relativePath;
  if (!key) return null;

  if (env.videoDelivery === 'cloudfront' && isCloudFrontConfigured()) {
    const url = `https://${env.aws.cloudFrontDomain}/${key.replace(/^\/+/, '')}`;
    if (!useSigned) return url;

    const expires = new Date(Date.now() + env.aws.signedUrlTtl * 1000);
    return getSignedUrl({
      url,
      keyPairId: env.aws.cloudFrontKeyPairId,
      privateKey: env.aws.cloudFrontPrivateKey,
      dateLessThan: expires.toISOString(),
    });
  }

  // Local delivery via API static/media routes
  return `${env.apiUrl}/media/${key.replace(/^\/+/, '')}`;
}

export function getDeliveryMode() {
  if (env.videoDelivery === 'cloudfront' && isCloudFrontConfigured()) {
    return 'cloudfront';
  }
  return 'local';
}
