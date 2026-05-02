'use client';

import { useRef, useState } from 'react';

export default function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-lg shadow-slate-950/50 cursor-pointer group" onClick={toggle}>
      <video
        ref={videoRef}
        src={src}
        playsInline
        controls={playing}
        className="w-full"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />

      {/* 中央再生ボタン（未再生時のみ表示） */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/90 shadow-lg group-hover:scale-110 transition-transform">
            {/* 再生アイコン */}
            <svg className="w-7 h-7 text-slate-900 ml-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
