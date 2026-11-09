'use client';

import { ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

interface SurveyStepCardProps {
  children: ReactNode;
  direction: 'next' | 'prev';
  stepKey: string | number;
}

export default function SurveyStepCard({
  children,
  direction,
  stepKey,
}: SurveyStepCardProps) {
  const prefersReduced = useReducedMotion();

  // Slide horizontal theo hướng tiến (+40px) hoặc lùi (-40px)
  const variants: Variants = {
    enter: (dir: 'next' | 'prev') => ({
      x: prefersReduced ? 0 : dir === 'next' ? 40 : -40,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 350, damping: 30 },
        opacity: { duration: 0.25, ease: 'easeOut' as const },
      },
    },
    exit: (dir: 'next' | 'prev') => ({
      x: prefersReduced ? 0 : dir === 'next' ? -40 : 40,
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 350, damping: 30 },
        opacity: { duration: 0.2, ease: 'easeIn' as const },
      },
    }),
  };

  return (
    <motion.div
      key={stepKey}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      className="space-y-6"
    >
      {children}
    </motion.div>
  );
}
