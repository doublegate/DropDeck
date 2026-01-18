/**
 * ETADisplay component tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '../../utils/render-with-providers';
import { ETADisplay, ETADisplayCompact } from '@/components/delivery/eta-display';
import { createMockDelivery } from '../../utils/fixtures';
import type { ETAResult } from '@/lib/services/eta';

/**
 * Create a mock ETAResult for testing
 */
function createMockETAResult(overrides: Partial<ETAResult> = {}): ETAResult {
  return {
    estimatedArrival: new Date(Date.now() + 15 * 60 * 1000),
    minutesRemaining: 15,
    confidence: 85,
    confidenceLevel: 'high',
    range: null,
    source: 'platform',
    factors: ['Platform ETA available'],
    ...overrides,
  };
}

describe('ETADisplay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('displays minutes remaining', () => {
      const delivery = createMockDelivery({ status: 'out_for_delivery' });
      const etaResult = createMockETAResult({ minutesRemaining: 15 });

      render(<ETADisplay delivery={delivery} etaResult={etaResult} />);

      expect(screen.getByText('15 min')).toBeInTheDocument();
    });

    it('displays "Arriving now" for < 1 minute', () => {
      const delivery = createMockDelivery({ status: 'arriving' });
      const etaResult = createMockETAResult({ minutesRemaining: 0.5 });

      render(<ETADisplay delivery={delivery} etaResult={etaResult} />);

      expect(screen.getByText('Arriving now')).toBeInTheDocument();
    });

    it('displays hours and minutes for > 60 minutes', () => {
      const delivery = createMockDelivery({ status: 'preparing' });
      const etaResult = createMockETAResult({ minutesRemaining: 90 });

      render(<ETADisplay delivery={delivery} etaResult={etaResult} />);

      expect(screen.getByText('1 hr 30 min')).toBeInTheDocument();
    });

    it('displays just hours when minutes are 0', () => {
      const delivery = createMockDelivery({ status: 'preparing' });
      const etaResult = createMockETAResult({ minutesRemaining: 120 });

      render(<ETADisplay delivery={delivery} etaResult={etaResult} />);

      expect(screen.getByText('2 hr')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders small size correctly', () => {
      const delivery = createMockDelivery();
      const etaResult = createMockETAResult({ minutesRemaining: 15 });

      render(<ETADisplay delivery={delivery} etaResult={etaResult} size="sm" />);

      const timeElement = screen.getByText('15 min');
      expect(timeElement).toHaveClass('text-lg');
    });

    it('renders medium size correctly', () => {
      const delivery = createMockDelivery();
      const etaResult = createMockETAResult({ minutesRemaining: 15 });

      render(<ETADisplay delivery={delivery} etaResult={etaResult} size="md" />);

      const timeElement = screen.getByText('15 min');
      expect(timeElement).toHaveClass('text-2xl');
    });

    it('renders large size correctly', () => {
      const delivery = createMockDelivery();
      const etaResult = createMockETAResult({ minutesRemaining: 15 });

      render(<ETADisplay delivery={delivery} etaResult={etaResult} size="lg" />);

      const timeElement = screen.getByText('15 min');
      expect(timeElement).toHaveClass('text-3xl');
    });
  });

  describe('Confidence Indicators', () => {
    it('shows confidence badge for medium confidence', () => {
      const delivery = createMockDelivery();
      const etaResult = createMockETAResult({
        minutesRemaining: 15,
        confidence: 60,
        confidenceLevel: 'medium',
      });

      render(<ETADisplay delivery={delivery} etaResult={etaResult} showConfidence />);

      expect(screen.getByText('Estimated')).toBeInTheDocument();
    });

    it('shows confidence badge for low confidence', () => {
      const delivery = createMockDelivery();
      const etaResult = createMockETAResult({
        minutesRemaining: 15,
        confidence: 40,
        confidenceLevel: 'low',
      });

      render(<ETADisplay delivery={delivery} etaResult={etaResult} showConfidence />);

      expect(screen.getByText('Approximate')).toBeInTheDocument();
    });

    it('does not show confidence badge for high confidence', () => {
      const delivery = createMockDelivery();
      const etaResult = createMockETAResult({
        minutesRemaining: 15,
        confidence: 90,
        confidenceLevel: 'high',
      });

      render(<ETADisplay delivery={delivery} etaResult={etaResult} showConfidence />);

      expect(screen.queryByText('High confidence')).not.toBeInTheDocument();
      expect(screen.queryByText('Estimated')).not.toBeInTheDocument();
    });

    it('hides confidence badge when showConfidence is false', () => {
      const delivery = createMockDelivery();
      const etaResult = createMockETAResult({
        minutesRemaining: 15,
        confidence: 40,
        confidenceLevel: 'low',
      });

      render(<ETADisplay delivery={delivery} etaResult={etaResult} showConfidence={false} />);

      expect(screen.queryByText('Approximate')).not.toBeInTheDocument();
    });
  });

  describe('Status-based Styling', () => {
    it('applies arriving pulse animation for arriving status', () => {
      const delivery = createMockDelivery({ status: 'arriving' });
      const etaResult = createMockETAResult({ minutesRemaining: 2 });

      render(<ETADisplay delivery={delivery} etaResult={etaResult} />);

      const timeElement = screen.getByText('2 min');
      expect(timeElement).toHaveClass('animate-pulse');
    });

    it('applies arriving pulse when minutesRemaining < 5', () => {
      const delivery = createMockDelivery({ status: 'out_for_delivery' });
      const etaResult = createMockETAResult({ minutesRemaining: 3 });

      render(<ETADisplay delivery={delivery} etaResult={etaResult} />);

      const timeElement = screen.getByText('3 min');
      expect(timeElement).toHaveClass('animate-pulse');
    });

    it('applies success color for delivered status', () => {
      const delivery = createMockDelivery({ status: 'delivered' });
      const etaResult = createMockETAResult({ minutesRemaining: 0 });

      render(<ETADisplay delivery={delivery} etaResult={etaResult} />);

      const timeElement = screen.getByText('Arriving now');
      expect(timeElement).toHaveClass('text-success');
    });
  });
});

describe('ETADisplayCompact', () => {
  it('renders compact format', () => {
    const delivery = createMockDelivery({ status: 'out_for_delivery' });
    const etaResult = createMockETAResult({ minutesRemaining: 15 });

    render(<ETADisplayCompact delivery={delivery} etaResult={etaResult} />);

    const timeElement = screen.getByText('15 min');
    expect(timeElement).toHaveClass('text-lg');
    expect(timeElement).toHaveClass('font-semibold');
  });

  it('applies pulse for arriving deliveries', () => {
    const delivery = createMockDelivery({ status: 'arriving' });
    const etaResult = createMockETAResult({ minutesRemaining: 2 });

    render(<ETADisplayCompact delivery={delivery} etaResult={etaResult} />);

    const timeElement = screen.getByText('2 min');
    expect(timeElement).toHaveClass('animate-pulse');
  });

  it('applies custom className', () => {
    const delivery = createMockDelivery({ status: 'delivered' });
    const etaResult = createMockETAResult({ minutesRemaining: 0 });

    render(<ETADisplayCompact delivery={delivery} etaResult={etaResult} className="custom-class" />);

    const timeElement = screen.getByText('Arriving now');
    expect(timeElement).toHaveClass('custom-class');
  });
});
