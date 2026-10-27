import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function VideoPlayer({ src, onProgress }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    let hls;
    if (src.includes('.m3u8') && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
    } else {
      video.src = src;
    }

    const onTime = () => {
      if (onProgress) {
        onProgress({
          watchedSeconds: Math.floor(video.currentTime),
          duration: Math.floor(video.duration || 0),
        });
      }
    };

    video.addEventListener('timeupdate', onTime);
    return () => {
      video.removeEventListener('timeupdate', onTime);
      if (hls) hls.destroy();
    };
  }, [src, onProgress]);

  return (
    <div className="video-shell">
      <video ref={videoRef} controls playsInline />
    </div>
  );
}
