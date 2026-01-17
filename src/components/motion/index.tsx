'use client';

import { AnimatePresence, type MotionProps, motion } from 'framer-motion';
import {
  fadeVariants,
  pageTransitionVariants,
  scaleVariants,
  slideUpVariants,
  staggerContainerVariants,
  staggerItemVariants,
} from '@/lib/animations';

// Re-export motion and AnimatePresence for convenience
export { motion, AnimatePresence };

// Animated container with fade
export function FadeIn({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & MotionProps) {
  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Animated container that slides up
export function SlideUp({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & MotionProps) {
  return (
    <motion.div
      variants={slideUpVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Animated container with scale
export function ScaleIn({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & MotionProps) {
  return (
    <motion.div
      variants={scaleVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Staggered list container
export function StaggerContainer({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & MotionProps) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Staggered list item
export function StaggerItem({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & MotionProps) {
  return (
    <motion.div variants={staggerItemVariants} className={className} {...props}>
      {children}
    </motion.div>
  );
}

// Page wrapper with transitions
export function PageTransition({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & MotionProps) {
  return (
    <motion.div
      variants={pageTransitionVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Lazy motion provider for reduced bundle size
// Use this at the app root for optimized animations
export { domAnimation, LazyMotion } from 'framer-motion';
