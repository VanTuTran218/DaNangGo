"use client";

/**
 * IntroCloudLayers V11.2 — GPU-Optimized Cloud Flight & 2.5D Coastal Landscape Parallax
 *
 * Optimizations:
 * - Waits for `isReady` (preloaded & decoded assets) before running motion so frame 1 is silky smooth.
 * - Uses pure GPU transform + opacity with subtle scale range (1.06 -> 1.00) — no excessive zoom or x/y jumps.
 * - Eliminates `mix-blend-soft-light` full-viewport blend readback and Gaussian-blurred cloud SVGs.
 * - Automatically unmounts temporary parting cloud layers once cleared to minimize GPU overdraw.
 * - Activates desktop mouse parallax only when `isParallaxActive` is true (after entrance settles).
 */

import React, { useEffect, useState } from "react";
import { motion, type MotionValue, useTransform } from "framer-motion";

interface IntroCloudLayersProps {
  isReady: boolean;
  isParallaxActive: boolean;
  prefersReduced: boolean;
  isExiting: boolean;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_OUT_CUBIC = [0.22, 1, 0.36, 1] as const;

const IntroCloudLayers = React.memo(function IntroCloudLayers({
  isReady,
  isParallaxActive,
  prefersReduced,
  isExiting,
  mouseX,
  mouseY,
}: IntroCloudLayersProps) {
  const [cloudsCleared, setCloudsCleared] = useState(false);

  // Damped mouse-responsive parallax offsets (Desktop Ready State only)
  const bgParallaxX = useTransform(mouseX, [-0.5, 0.5], [-6, 6]);
  const bgParallaxY = useTransform(mouseY, [-0.5, 0.5], [-4, 4]);

  const lightParallaxX = useTransform(mouseX, [-0.5, 0.5], [-12, 12]);
  const lightParallaxY = useTransform(mouseY, [-0.5, 0.5], [-9, 9]);

  // Gỡ bỏ các lớp mây đã tản hẳn sau khi chuỗi bay vào kết thúc để giảm GPU overdraw
  useEffect(() => {
    if (!isReady || prefersReduced || cloudsCleared) return;
    const timer = setTimeout(() => {
      setCloudsCleared(true);
    }, 2550);
    return () => clearTimeout(timer);
  }, [isReady, prefersReduced, cloudsCleared]);

  const useParallax = isParallaxActive && !prefersReduced;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none bg-[#0A2029]"
    >
      {/* ================================================================
          LAYER D: COASTAL LANDSCAPE PANORAMA (Da Nang My Khe & Son Tra)
          ================================================================ */}
      <motion.div
        style={useParallax ? { x: bgParallaxX, y: bgParallaxY } : undefined}
        className="absolute -inset-[3%] w-[106%] h-[106%]"
      >
        <motion.div
          className="relative w-full h-full"
          initial={
            prefersReduced
              ? { scale: 1, opacity: 1 }
              : { scale: 1.06, opacity: 0 }
          }
          animate={
            isExiting
              ? {
                  scale: prefersReduced ? 1 : 1.04,
                  opacity: 1,
                }
              : isReady
                ? {
                    scale: 1,
                    opacity: 1,
                  }
                : {
                    scale: 1.06,
                    opacity: 0,
                  }
          }
          transition={
            isExiting
              ? { duration: 0.52, ease: EASE_OUT_CUBIC }
              : { duration: 1.95, ease: EASE_OUT_EXPO }
          }
        >
          <img
            src="/images/intro/landscape/intro-coastal-panorama.jpg"
            alt="Toàn cảnh bờ biển Mỹ Khê và bán đảo Sơn Trà Đà Nẵng trong ánh bình minh"
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            className="w-full h-full object-cover object-[58%_42%] sm:object-[52%_45%]"
          />
        </motion.div>
      </motion.div>

      {/* ================================================================
          DISTANT MOUNTAIN SILHOUETTE LAYER (Composited without blend readback)
          ================================================================ */}
      <motion.div
        style={useParallax ? { x: bgParallaxX, y: bgParallaxY } : undefined}
        className="absolute inset-x-0 bottom-0 h-[55%] opacity-[0.22]"
      >
        <img
          src="/images/cinematic/mountains/distant-mountain-layer.svg"
          alt=""
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover object-bottom"
        />
      </motion.div>

      {/* ================================================================
          ABOVE-THE-CLOUDS AERIAL CANOPY (Scene 01–02 Flight Entry)
          Unmounts cleanly once fully faded out to free GPU layers
          ================================================================ */}
      {!prefersReduced && !cloudsCleared && (
        <motion.div
          className="absolute -inset-[4%] w-[108%] h-[108%]"
          initial={{ opacity: 0.78, scale: 1, y: 0 }}
          animate={
            isExiting
              ? { opacity: 0, scale: 1.06, y: -16 }
              : isReady
                ? { opacity: 0, scale: 1.08, y: -22 }
                : { opacity: 0.78, scale: 1, y: 0 }
          }
          transition={{
            duration: isExiting ? 0.35 : 1.75,
            delay: isExiting ? 0 : 0.2,
            ease: EASE_OUT_CUBIC,
          }}
        >
          <picture>
            <source
              srcSet="/images/intro/landscape/intro-above-clouds.webp"
              type="image/webp"
            />
            <img
              src="/images/intro/landscape/intro-above-clouds.jpg"
              alt=""
              loading="eager"
              decoding="sync"
              className="w-full h-full object-cover object-center"
            />
          </picture>
        </motion.div>
      )}

      {/* ================================================================
          LAYER E: GOLDEN ATMOSPHERIC LIGHT & TOPOGRAPHIC CONTOURS
          ================================================================ */}
      <motion.div
        style={useParallax ? { x: lightParallaxX, y: lightParallaxY } : undefined}
        className="absolute -inset-[3%] w-[106%] h-[106%]"
      >
        <img
          src="/images/intro/atmosphere/intro-golden-light.svg"
          alt=""
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover"
        />
        <img
          src="/images/intro/atmosphere/intro-coastal-contours.svg"
          alt=""
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-75"
        />
      </motion.div>

      {/* ================================================================
          CINEMATIC EDITORIAL SCRIM (Protects typography contrast)
          ================================================================ */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,32,41,0.42) 0%, rgba(16,40,50,0.14) 38%, rgba(16,40,50,0.24) 68%, rgba(10,32,41,0.58) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 64% 58% at 50% 50%, rgba(10,32,41,0.28) 0%, rgba(10,32,41,0.08) 58%, rgba(10,32,41,0.45) 100%)",
        }}
      />

      {/* ================================================================
          MULTI-LAYER CLOUD FLIGHT (Layers A, B, C — Blur-Free SVGs)
          Parts outward cleanly using GPU transform + opacity, then unmounts.
          ================================================================ */}
      {!prefersReduced && !cloudsCleared && (
        <div className="absolute inset-0 overflow-hidden">
          {/* Layer A — Distant Clouds */}
          <motion.div
            className="absolute -inset-x-[8%] inset-y-0"
            initial={{ opacity: 0.65, scale: 1, y: 0 }}
            animate={
              isExiting
                ? { opacity: 0, scale: 1.08, y: -18 }
                : isReady
                  ? { opacity: 0, scale: 1.07, y: -20 }
                  : { opacity: 0.65, scale: 1, y: 0 }
            }
            transition={{
              duration: isExiting ? 0.35 : 2.0,
              delay: isExiting ? 0 : 0.25,
              ease: EASE_OUT_CUBIC,
            }}
          >
            <img
              src="/images/intro/clouds/intro-cloud-distant.svg"
              alt=""
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Layer B — Midground Clouds */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0.78, x: "0%", y: "0%", scale: 1 }}
            animate={
              isExiting
                ? { opacity: 0, x: "-14%", scale: 1.09 }
                : isReady
                  ? { opacity: 0, x: "-18%", y: "4%", scale: 1.1 }
                  : { opacity: 0.78, x: "0%", y: "0%", scale: 1 }
            }
            transition={{
              duration: isExiting ? 0.35 : 1.95,
              delay: isExiting ? 0 : 0.3,
              ease: EASE_OUT_CUBIC,
            }}
          >
            <img
              src="/images/intro/clouds/intro-cloud-midground.svg"
              alt=""
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Layer C — Foreground Clouds (Desktop/Tablet) */}
          <motion.div
            className="absolute inset-0 hidden sm:block"
            initial={{ opacity: 0.82, x: "0%", y: "0%", scale: 1 }}
            animate={
              isExiting
                ? { opacity: 0, x: "18%", scale: 1.12 }
                : isReady
                  ? { opacity: 0, x: "22%", y: "6%", scale: 1.12 }
                  : { opacity: 0.82, x: "0%", y: "0%", scale: 1 }
            }
            transition={{
              duration: isExiting ? 0.35 : 1.85,
              delay: isExiting ? 0 : 0.35,
              ease: EASE_OUT_CUBIC,
            }}
          >
            <img
              src="/images/intro/clouds/intro-cloud-foreground.svg"
              alt=""
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      )}
    </div>
  );
});

export default IntroCloudLayers;
