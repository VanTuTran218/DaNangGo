"use client";

import { useEffect, useRef } from "react";

export type WeatherAtmosphere = "sunny" | "partly-cloudy" | "cloudy" | "rain" | "thunder" | "night";

export function resolveAtmosphere(code: number | null | undefined, isNight = false): WeatherAtmosphere {
  if (code === null || code === undefined) return isNight ? "night" : "partly-cloudy";
  if (code >= 95) return "thunder";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code === 3 || code === 45 || code === 48) return "cloudy";
  if (code === 2) return isNight ? "night" : "partly-cloudy";
  if (code === 0 || code === 1) return isNight ? "night" : "sunny";
  return isNight ? "night" : "partly-cloudy";
}

const ATMOSPHERE_GRADIENT: Record<WeatherAtmosphere, string> = {
  sunny: "from-[#0284C7] via-[#0EA5E9] to-[#38BDF8]",
  "partly-cloudy": "from-[#0F766E] via-[#0284C7] to-[#38BDF8]",
  cloudy: "from-[#475569] via-[#64748B] to-[#334155]",
  rain: "from-[#1E293B] via-[#334155] to-[#0F172A]",
  thunder: "from-[#0F172A] via-[#1E1B4B] to-[#020617]",
  night: "from-[#0F172A] via-[#1E293B] to-[#0B1120]",
};

export default function WeatherBackdrop({ atmosphere }: { atmosphere: WeatherAtmosphere }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (atmosphere !== "rain" && atmosphere !== "thunder") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const dropCount = atmosphere === "thunder" ? 150 : 95;
    const drops = Array.from({ length: dropCount }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      len: 12 + Math.random() * 18,
      speed: (atmosphere === "thunder" ? 14 : 9.5) + Math.random() * 6,
      opacity: 0.18 + Math.random() * 0.35,
    }));

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1.25;
      ctx.lineCap = "round";

      for (const d of drops) {
        ctx.strokeStyle = `rgba(186, 230, 253, ${d.opacity})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 2.5, d.y + d.len);
        ctx.stroke();

        d.x -= 1.2;
        d.y += d.speed;
        if (d.y > h + 20) {
          d.y = -20;
          d.x = Math.random() * (w + 60);
        }
        if (d.x < -20) d.x = w + 10;
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [atmosphere]);

  return (
    <div
      className={`fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br ${ATMOSPHERE_GRADIENT[atmosphere]} transition-colors duration-700`}
      aria-hidden="true"
    >
      {/* Sunny rays & warm glow */}
      {(atmosphere === "sunny" || atmosphere === "partly-cloudy") && (
        <>
          <div className="weather-sun-glow absolute -top-24 -right-24 w-[460px] h-[460px] rounded-full bg-amber-300/35 blur-3xl pointer-events-none" />
          <div className="weather-sun-core absolute top-14 right-12 sm:right-24 w-28 h-28 rounded-full bg-gradient-to-br from-amber-200 to-yellow-400/70 blur-xl opacity-80 pointer-events-none" />
          <div className="weather-sun-rays absolute -top-40 -right-40 w-[620px] h-[620px] rounded-full opacity-25 pointer-events-none" />
        </>
      )}

      {/* Drifting clouds */}
      {(atmosphere === "partly-cloudy" ||
        atmosphere === "cloudy" ||
        atmosphere === "rain" ||
        atmosphere === "thunder") && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className={`weather-cloud-1 absolute top-16 left-[-20%] w-[420px] h-28 rounded-full blur-2xl ${
              atmosphere === "partly-cloudy" ? "bg-white/25" : "bg-slate-200/20"
            }`}
          />
          <div
            className={`weather-cloud-2 absolute top-40 right-[-15%] w-[520px] h-32 rounded-full blur-3xl ${
              atmosphere === "partly-cloudy" ? "bg-white/20" : "bg-slate-300/15"
            }`}
          />
          <div
            className={`weather-cloud-3 absolute top-72 left-[15%] w-[360px] h-24 rounded-full blur-2xl ${
              atmosphere === "partly-cloudy" ? "bg-white/15" : "bg-slate-100/12"
            }`}
          />
        </div>
      )}

      {/* Night stars */}
      {atmosphere === "night" && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="weather-stars absolute inset-0 opacity-70" />
          <div className="absolute top-20 right-20 w-24 h-24 rounded-full bg-indigo-200/20 blur-2xl" />
        </div>
      )}

      {/* Rain canvas */}
      {(atmosphere === "rain" || atmosphere === "thunder") && (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      )}

      {/* Lightning flash */}
      {atmosphere === "thunder" && (
        <div className="weather-lightning absolute inset-0 bg-indigo-100/30 pointer-events-none" />
      )}

      <style jsx>{`
        @keyframes sunPulse {
          0%, 100% { transform: scale(1); opacity: 0.75; }
          50% { transform: scale(1.12); opacity: 0.95; }
        }
        @keyframes sunSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes cloudDriftSlow {
          0% { transform: translateX(-10%); }
          50% { transform: translateX(35%); }
          100% { transform: translateX(-10%); }
        }
        @keyframes cloudDriftReverse {
          0% { transform: translateX(10%); }
          50% { transform: translateX(-30%); }
          100% { transform: translateX(10%); }
        }
        @keyframes lightningFlash {
          0%, 88%, 92%, 96%, 100% { opacity: 0; }
          89%, 93% { opacity: 0.65; }
          90%, 94% { opacity: 0.1; }
        }
        .weather-sun-glow {
          animation: sunPulse 7s ease-in-out infinite;
        }
        .weather-sun-rays {
          background: repeating-conic-gradient(
            from 0deg,
            rgba(254, 240, 138, 0.28) 0deg 12deg,
            transparent 12deg 30deg
          );
          mask-image: radial-gradient(circle, black 10%, transparent 68%);
          -webkit-mask-image: radial-gradient(circle, black 10%, transparent 68%);
          animation: sunSpin 45s linear infinite;
        }
        .weather-cloud-1 {
          animation: cloudDriftSlow 28s ease-in-out infinite;
        }
        .weather-cloud-2 {
          animation: cloudDriftReverse 34s ease-in-out infinite;
        }
        .weather-cloud-3 {
          animation: cloudDriftSlow 22s ease-in-out infinite;
        }
        .weather-lightning {
          animation: lightningFlash 6.5s infinite;
        }
        .weather-stars {
          background-image:
            radial-gradient(1.5px 1.5px at 15% 20%, rgba(255,255,255,0.9), transparent),
            radial-gradient(1px 1px at 32% 12%, rgba(255,255,255,0.7), transparent),
            radial-gradient(2px 2px at 54% 25%, rgba(255,255,255,0.85), transparent),
            radial-gradient(1px 1px at 78% 18%, rgba(255,255,255,0.75), transparent),
            radial-gradient(1.5px 1.5px at 88% 34%, rgba(255,255,255,0.8), transparent),
            radial-gradient(1px 1px at 22% 45%, rgba(255,255,255,0.6), transparent),
            radial-gradient(1.5px 1.5px at 66% 40%, rgba(255,255,255,0.7), transparent);
        }
      `}</style>
    </div>
  );
}
