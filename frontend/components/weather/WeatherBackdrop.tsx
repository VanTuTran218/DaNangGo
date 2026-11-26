"use client";

import { useEffect, useRef } from "react";

export type WeatherAtmosphere =
  | "sunny"
  | "partly-cloudy"
  | "cloudy"
  | "rain"
  | "thunder"
  | "night";

export function resolveAtmosphere(
  code: number | null | undefined,
  isNight = false,
): WeatherAtmosphere {
  if (code === null || code === undefined) {
    return isNight ? "night" : "partly-cloudy";
  }
  if (code >= 95) return "thunder";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code === 3 || code === 45 || code === 48) return "cloudy";
  if (code === 2) return isNight ? "night" : "partly-cloudy";
  if (code === 0 || code === 1) return isNight ? "night" : "sunny";
  return isNight ? "night" : "partly-cloudy";
}

const ATMOSPHERE_GRADIENT: Record<WeatherAtmosphere, string> = {
  sunny: "from-[#063455] via-[#0B4F73] to-[#071D2D]",
  "partly-cloudy": "from-[#073342] via-[#0A475D] to-[#051823]",
  cloudy: "from-[#122634] via-[#1C3343] to-[#07141E]",
  rain: "from-[#061824] via-[#0E2839] to-[#040E16]",
  thunder: "from-[#060D1D] via-[#111A36] to-[#030711]",
  night: "from-[#04101A] via-[#081D2C] to-[#030B12]",
};

export default function WeatherBackdrop({
  atmosphere,
}: {
  atmosphere: WeatherAtmosphere;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (atmosphere !== "rain" && atmosphere !== "thunder") return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    const dpr =
      typeof window !== "undefined"
        ? Math.min(window.devicePixelRatio || 1, 2)
        : 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const dropCount = atmosphere === "thunder" ? 135 : 85;
    const drops = Array.from({ length: dropCount }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      len: 12 + Math.random() * 18,
      speed: (atmosphere === "thunder" ? 13 : 8.8) + Math.random() * 5.5,
      opacity: 0.14 + Math.random() * 0.3,
    }));

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1.15;
      ctx.lineCap = "round";

      for (const d of drops) {
        ctx.strokeStyle = `rgba(165, 243, 252, ${d.opacity})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 2.2, d.y + d.len);
        ctx.stroke();

        d.x -= 1.1;
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
      {/* Subtle architectural observatory coordinate grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(230,217,183,0.9) 1px, transparent 1px), linear-gradient(to bottom, rgba(230,217,183,0.9) 1px, transparent 1px)",
          backgroundSize: "76px 76px",
        }}
      />

      {/* Coastal bioluminescent horizon accents */}
      <div className="pointer-events-none absolute -top-32 right-[-8%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.14)_0%,transparent_68%)]" />
      <div className="pointer-events-none absolute bottom-[-20%] left-[-8%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(232,123,57,0.11)_0%,transparent_68%)]" />

      {/* Sunny rays & golden solar crown */}
      {(atmosphere === "sunny" || atmosphere === "partly-cloudy") && (
        <>
          <div className="weather-sun-glow pointer-events-none absolute -top-28 -right-24 h-[480px] w-[480px] rounded-full bg-amber-300/28 blur-3xl" />
          <div className="weather-sun-core pointer-events-none absolute top-16 right-12 h-24 w-24 rounded-full bg-gradient-to-br from-amber-200 to-orange-400/65 opacity-75 blur-xl sm:right-24" />
          <div className="weather-sun-rays pointer-events-none absolute -top-44 -right-44 h-[620px] w-[620px] rounded-full opacity-22" />
        </>
      )}

      {/* Drifting coastal clouds */}
      {(atmosphere === "partly-cloudy" ||
        atmosphere === "cloudy" ||
        atmosphere === "rain" ||
        atmosphere === "thunder") && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className={`weather-cloud-1 absolute top-16 left-[-18%] h-28 w-[440px] rounded-full blur-3xl ${
              atmosphere === "partly-cloudy"
                ? "bg-sky-200/18"
                : "bg-cyan-100/10"
            }`}
          />
          <div
            className={`weather-cloud-2 absolute top-44 right-[-15%] h-32 w-[520px] rounded-full blur-3xl ${
              atmosphere === "partly-cloudy"
                ? "bg-amber-100/12"
                : "bg-slate-200/10"
            }`}
          />
          <div
            className={`weather-cloud-3 absolute top-72 left-[14%] h-24 w-[380px] rounded-full blur-2xl ${
              atmosphere === "partly-cloudy"
                ? "bg-white/10"
                : "bg-teal-100/8"
            }`}
          />
        </div>
      )}

      {/* Night stars & moon glow */}
      {atmosphere === "night" && (
        <div className="pointer-events-none absolute inset-0">
          <div className="weather-stars absolute inset-0 opacity-75" />
          <div className="absolute top-20 right-20 h-28 w-28 rounded-full bg-[#E6D9B7]/18 blur-2xl" />
        </div>
      )}

      {/* Rain canvas */}
      {(atmosphere === "rain" || atmosphere === "thunder") && (
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      )}

      {/* Lightning flash */}
      {atmosphere === "thunder" && (
        <div className="weather-lightning pointer-events-none absolute inset-0 bg-indigo-200/22" />
      )}

      {/* Top/bottom protective contrast vignette for razor-sharp readability */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#030D14]/65 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#030D14]/75 to-transparent" />

      <style jsx>{`
        @keyframes sunPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.92;
          }
        }
        @keyframes sunSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes cloudDriftSlow {
          0% {
            transform: translateX(-10%);
          }
          50% {
            transform: translateX(30%);
          }
          100% {
            transform: translateX(-10%);
          }
        }
        @keyframes cloudDriftReverse {
          0% {
            transform: translateX(10%);
          }
          50% {
            transform: translateX(-28%);
          }
          100% {
            transform: translateX(10%);
          }
        }
        @keyframes lightningFlash {
          0%,
          88%,
          92%,
          96%,
          100% {
            opacity: 0;
          }
          89%,
          93% {
            opacity: 0.55;
          }
          90%,
          94% {
            opacity: 0.08;
          }
        }
        .weather-sun-glow {
          animation: sunPulse 7s ease-in-out infinite;
        }
        .weather-sun-rays {
          background: repeating-conic-gradient(
            from 0deg,
            rgba(254, 240, 138, 0.24) 0deg 12deg,
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
            radial-gradient(1.5px 1.5px at 15% 20%, rgba(255, 253, 245, 0.9), transparent),
            radial-gradient(1px 1px at 32% 12%, rgba(230, 217, 183, 0.75), transparent),
            radial-gradient(2px 2px at 54% 25%, rgba(255, 253, 245, 0.85), transparent),
            radial-gradient(1px 1px at 78% 18%, rgba(165, 243, 252, 0.75), transparent),
            radial-gradient(1.5px 1.5px at 88% 34%, rgba(255, 253, 245, 0.8), transparent),
            radial-gradient(1px 1px at 22% 45%, rgba(230, 217, 183, 0.6), transparent),
            radial-gradient(1.5px 1.5px at 66% 40%, rgba(255, 253, 245, 0.7), transparent);
        }
      `}</style>
    </div>
  );
}
