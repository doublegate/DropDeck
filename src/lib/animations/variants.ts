import type { Transition, Variants } from 'framer-motion';

/**
 * DropDeck Animation System
 * Consistent, accessible animations following the design system
 *
 * Timing Guidelines:
 * - Fast: 150ms - Micro-interactions (hover, focus)
 * - Normal: 200ms - State changes (toggle, select)
 * - Slow: 300ms - Page transitions, modals
 *
 * Accessibility:
 * - All animations respect prefers-reduced-motion
 * - Use reducedMotion variants for accessible alternatives
 */

/**
 * Check if user prefers reduced motion (server-safe)
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Create reduced motion variant (instant transitions)
 */
export function createReducedMotionVariant(variants: Variants): Variants {
  const reducedVariants: Variants = {};

  for (const [key, value] of Object.entries(variants)) {
    if (typeof value === 'object' && value !== null) {
      reducedVariants[key] = {
        ...value,
        transition: { duration: 0 },
      };
    } else {
      reducedVariants[key] = value;
    }
  }

  return reducedVariants;
}

/**
 * Get variants based on motion preference
 */
export function getAccessibleVariants(variants: Variants, reducedMotion: boolean): Variants {
  return reducedMotion ? createReducedMotionVariant(variants) : variants;
}

// Default transition settings
export const defaultTransition: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
};

export const smoothTransition: Transition = {
  type: 'tween',
  ease: [0.4, 0, 0.2, 1],
  duration: 0.2,
};

export const slowTransition: Transition = {
  type: 'tween',
  ease: [0.4, 0, 0.2, 1],
  duration: 0.3,
};

// Fade variants
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: smoothTransition,
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

// Slide up variants (for modals, toasts)
export const slideUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.15 },
  },
};

// Slide in from left (for sidebars)
export const slideInLeftVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.15 },
  },
};

// Slide in from right (for panels)
export const slideInRightVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.15 },
  },
};

// Scale variants (for cards, buttons)
export const scaleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

// Staggered children variants (for lists)
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
};

// Card hover variants
export const cardHoverVariants: Variants = {
  initial: {
    y: 0,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  },
  hover: {
    y: -2,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    transition: { duration: 0.15 },
  },
  tap: {
    y: 0,
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

// Button press variants
export const buttonPressVariants: Variants = {
  initial: { scale: 1 },
  tap: { scale: 0.97 },
};

// Page transition variants
export const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: slowTransition,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2 },
  },
};

// Dropdown/Menu variants
export const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -4,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -4,
    transition: { duration: 0.1 },
  },
};

// Toast notification variants
export const toastVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

// Skeleton pulse variants
export const skeletonVariants: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: 1,
    transition: {
      repeat: Infinity,
      repeatType: 'reverse',
      duration: 0.8,
    },
  },
};

// Status indicator pulse (for ETA arriving)
export const pulseVariants: Variants = {
  initial: { opacity: 1 },
  animate: {
    opacity: [1, 0.7, 1],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'easeInOut',
    },
  },
};

/**
 * Reduced motion variants (instant transitions)
 * Use these when prefers-reduced-motion is enabled
 */
export const reducedMotionVariants = {
  fade: createReducedMotionVariant(fadeVariants),
  slideUp: createReducedMotionVariant(slideUpVariants),
  slideInLeft: createReducedMotionVariant(slideInLeftVariants),
  slideInRight: createReducedMotionVariant(slideInRightVariants),
  scale: createReducedMotionVariant(scaleVariants),
  dropdown: createReducedMotionVariant(dropdownVariants),
  toast: createReducedMotionVariant(toastVariants),
  page: createReducedMotionVariant(pageTransitionVariants),
};

/**
 * No animation transition (for reduced motion)
 */
export const noAnimationTransition: Transition = {
  duration: 0,
};

/**
 * Get transition based on motion preference
 */
export function getAccessibleTransition(
  transition: Transition,
  reducedMotion: boolean
): Transition {
  return reducedMotion ? noAnimationTransition : transition;
}
