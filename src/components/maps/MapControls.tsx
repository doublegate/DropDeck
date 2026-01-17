'use client';

import { cn } from '@/lib/utils';

/**
 * MapControls props
 */
interface MapControlsProps {
  /** Callback for zoom in */
  onZoomIn?: () => void;
  /** Callback for zoom out */
  onZoomOut?: () => void;
  /** Callback for center on location */
  onCenter?: () => void;
  /** Callback for fullscreen toggle */
  onFullscreen?: () => void;
  /** Callback for recenter on delivery */
  onRecenter?: () => void;
  /** Show zoom controls */
  showZoom?: boolean;
  /** Show center control */
  showCenter?: boolean;
  /** Show fullscreen control */
  showFullscreen?: boolean;
  /** Show recenter control */
  showRecenter?: boolean;
  /** Is fullscreen mode active */
  isFullscreen?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * MapControls component
 * Custom controls for map interaction
 */
export function MapControls({
  onZoomIn,
  onZoomOut,
  onCenter,
  onFullscreen,
  onRecenter,
  showZoom = true,
  showCenter = false,
  showFullscreen = false,
  showRecenter = true,
  isFullscreen = false,
  className,
}: MapControlsProps) {
  return (
    <div className={cn('absolute top-2 right-2 flex flex-col gap-1 z-10', className)}>
      {/* Zoom controls */}
      {showZoom && (
        <div className="flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
          <ControlButton onClick={onZoomIn} title="Zoom in">
            <PlusIcon />
          </ControlButton>
          <div className="h-px bg-slate-200 dark:bg-slate-700" />
          <ControlButton onClick={onZoomOut} title="Zoom out">
            <MinusIcon />
          </ControlButton>
        </div>
      )}

      {/* Center on user location */}
      {showCenter && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
          <ControlButton onClick={onCenter} title="Center on my location">
            <LocationIcon />
          </ControlButton>
        </div>
      )}

      {/* Recenter on delivery */}
      {showRecenter && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
          <ControlButton onClick={onRecenter} title="Recenter on delivery">
            <CrosshairIcon />
          </ControlButton>
        </div>
      )}

      {/* Fullscreen toggle */}
      {showFullscreen && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
          <ControlButton
            onClick={onFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
          </ControlButton>
        </div>
      )}
    </div>
  );
}

/**
 * Control button component
 */
function ControlButton({
  onClick,
  title,
  children,
}: {
  onClick?: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'p-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors',
        'text-slate-600 dark:text-slate-300'
      )}
    >
      {children}
    </button>
  );
}

// Icons - aria-hidden since the button has a title for accessibility
function PlusIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z"
      />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function CrosshairIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
      <path strokeLinecap="round" d="M12 2v4m0 12v4M2 12h4m12 0h4" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4m12 0h-4m0 16h4v-4M4 20v-4" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 4v4H4m16 0h-4V4m0 16v-4h4M4 16h4v4"
      />
    </svg>
  );
}

export type { MapControlsProps };
