import React, { useEffect, useRef, useState } from "react";
import lottie, { AnimationItem } from "lottie-web";
import loaderJson from "./loader.json"; // import direct
import { logger } from "renderer/lib/logger";

interface LoadingBarsProps {
  progress: number; // 0..1 ou 0..100
  currentStatus: "downloading now" | "uploading";
  smooth?: boolean;   // interpolation
  smoothingMs?: number;
}

const LOADING_ANIMATION_FRAMES = 70; // Nombre de frames effectives dans l'animation (70 sur les 240)

export default function LoadingBars({
  progress,
  currentStatus,
  smooth = true,
  smoothingMs = 250,
}: LoadingBarsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const lastFrameRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const [currentFileSpeed, setCurrentFileSpeed] = useState('');

  progress = currentStatus === 'uploading' ? 100 : progress;

  const toPercent = (p: number) => Math.max(0, Math.min(100, p));

  useEffect(() => {
    if (!containerRef.current) return;

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: false,
      autoplay: false,
      animationData: loaderJson,
      rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
    });

    animRef.current = anim;

    const onReady = () => {
      anim.goToAndStop(0, true);
      lastFrameRef.current = 0;
    };

    // selon versions de lottie-web, "DOMLoaded" ou "data_ready"
    anim.addEventListener("DOMLoaded", onReady);
    anim.addEventListener("data_ready", onReady);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      anim.removeEventListener("DOMLoaded", onReady);
      anim.removeEventListener("data_ready", onReady);
      anim.destroy();
      animRef.current = null;
    };
  }, []);

  useEffect(() => {
    window.App.onDownloadProgress((progress: number, speed: string, eta: string) => {
      setCurrentFileSpeed(speed);
    });
    return () => { window.App.removeDownloadProgressListener(); };
  }, []);

  useEffect(() => {
    const anim = animRef.current;
    if (!anim) return;

    const percent = toPercent(progress);
    const totalFrames = Math.max(1, Math.floor(anim.totalFrames || 1));

    // 🎯 SOLUTION : Utiliser seulement les 70 premières frames
    const ACTIVE_FRAMES = 70; // Au lieu de totalFrames
    const target = Math.round((percent / 100) * (LOADING_ANIMATION_FRAMES - 1));

    if (!smooth) {
      anim.goToAndStop(target, true);
      lastFrameRef.current = target;
      return;
    }

    const start = lastFrameRef.current;
    const delta = target - start;
    if (delta === 0) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const startTs = performance.now();
    const dur = Math.max(1, smoothingMs);

    const step = (ts: number) => {
      const t = Math.min(1, (ts - startTs) / dur);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const frame = Math.round(start + delta * eased);
      anim.goToAndStop(frame, true);
      lastFrameRef.current = frame;
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else rafRef.current = null;
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [progress, smooth, smoothingMs]);

  return (
    <div className="w-full h-[96px] flex flex-col items-center gap-6 py-4 mb-[39px]">
      <div className="w-[166px] h-8 flex justify-center items-center">
        <span
          className="uppercase text-white font-normal text-[46px] leading-none tracking-[-0.1em]"
          style={{ fontFamily: "LT Railway", fontStyle: "normal" }}
        >
          Running
        </span>
      </div>

      <div className="w-full h-2 flex items-center justify-center gap-2">
        <span
          className="h-2 uppercase text-white font-normal text-[11px] tracking-[0.1em] leading-none flex items-center justify-center whitespace-nowrap"
          style={{ fontFamily: "Akzidenz-Grotesk Pro" }}
        >
          {currentStatus}
        </span>

        {/* Container Lottie */}
        <div className="flex items-center justify-center w-[55px] h-[7px]">
          <div
            ref={containerRef}
            style={{
              width: 55,
              height: 30, // ajuste à la hauteur de ton loader
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
      {/* Download speed */}
      <div className="flex items-center justify-between text-xs text-white/70">
        <span>Speed: {currentFileSpeed}</span>
      </div>
    </div>
  );
}
