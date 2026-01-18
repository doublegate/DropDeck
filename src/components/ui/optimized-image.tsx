'use client';

/**
 * Optimized Image Component
 * Sprint 5.3 - Performance Optimizations
 */

import { useState, useEffect, useRef, memo } from 'react';
import Image, { type ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Props for OptimizedImage
 */
interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  /** Fallback image URL if main image fails */
  fallbackSrc?: string;
  /** Whether to show loading skeleton */
  showSkeleton?: boolean;
  /** Aspect ratio for placeholder */
  aspectRatio?: number;
  /** Whether to lazy load (default: true) */
  lazy?: boolean;
  /** Blur data URL for placeholder */
  blurDataURL?: string;
}

/**
 * Generate a tiny blur placeholder
 */
function generateBlurPlaceholder(width = 10, height = 10): string {
  // Create a simple SVG blur placeholder
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <filter id="b" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="1"/>
      </filter>
      <rect width="100%" height="100%" fill="#1a1a2e" filter="url(#b)"/>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Default blur placeholder
 */
const defaultBlurDataURL = generateBlurPlaceholder();

/**
 * OptimizedImage component
 * Provides loading states, error handling, and lazy loading
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  fallbackSrc,
  showSkeleton = true,
  aspectRatio,
  lazy = true,
  blurDataURL = defaultBlurDataURL,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset state when src changes
  useEffect(() => {
    setCurrentSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  // Handle load complete
  const handleLoad = () => {
    setIsLoading(false);
  };

  // Handle error
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);

    // Try fallback if available
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setIsLoading(true);
      setHasError(false);
    }
  };

  // Calculate aspect ratio style
  const aspectRatioStyle = aspectRatio ? { aspectRatio: `${aspectRatio}` } : undefined;

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        isLoading && showSkeleton && 'animate-pulse bg-[var(--dd-bg-tertiary)]',
        className
      )}
      style={aspectRatioStyle}
    >
      {!hasError && currentSrc && (
        <Image
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          loading={lazy ? 'lazy' : 'eager'}
          placeholder="blur"
          blurDataURL={blurDataURL}
          onLoad={handleLoad}
          onError={handleError}
          className={cn('transition-opacity duration-300', isLoading ? 'opacity-0' : 'opacity-100')}
          {...props}
        />
      )}

      {/* Error state */}
      {hasError && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--dd-bg-tertiary)] text-[var(--dd-text-muted)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
});

/**
 * Avatar image with circular shape and initials fallback
 */
export const AvatarImage = memo(function AvatarImage({
  src,
  alt,
  name,
  size = 40,
  className,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height' | 'aspectRatio'> & {
  name?: string;
  size?: number;
}) {
  const [hasError, setHasError] = useState(false);

  // Generate initials from name
  const initials =
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  // Reset error state when src changes - intentionally depend on src prop
  // biome-ignore lint/correctness/useExhaustiveDependencies: src dependency is intentional
  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError || !src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-brand-cyan text-white font-semibold',
          className
        )}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={cn('relative rounded-full overflow-hidden', className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="object-cover"
        onError={() => setHasError(true)}
        {...props}
      />
    </div>
  );
});

/**
 * Platform icon image with color fallback
 */
export const PlatformIcon = memo(function PlatformIcon({
  platform,
  iconUrl,
  color,
  size = 24,
  className,
}: {
  platform: string;
  iconUrl?: string;
  color?: string;
  size?: number;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !iconUrl) {
    // Fallback to colored circle with first letter
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full text-white font-semibold',
          className
        )}
        style={{
          width: size,
          height: size,
          backgroundColor: color || '#64748B',
          fontSize: size * 0.5,
        }}
      >
        {(platform[0] ?? '?').toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={iconUrl}
      alt={`${platform} icon`}
      width={size}
      height={size}
      className={cn('object-contain', className)}
      onError={() => setHasError(true)}
    />
  );
});

export default OptimizedImage;
