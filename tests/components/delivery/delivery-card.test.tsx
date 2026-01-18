/**
 * DeliveryCard component tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../utils/render-with-providers';
import { DeliveryCard, DeliveryCardSkeleton } from '@/components/delivery/delivery-card';
import { createMockDelivery } from '../../utils/fixtures';

describe('DeliveryCard', () => {
  describe('Rendering', () => {
    it('renders platform name correctly', () => {
      const delivery = createMockDelivery({ platform: 'doordash' });
      render(<DeliveryCard delivery={delivery} />);

      expect(screen.getByText('DoorDash')).toBeInTheDocument();
    });

    it('renders status label correctly', () => {
      const delivery = createMockDelivery({
        status: 'out_for_delivery',
        statusLabel: 'Out for Delivery',
      });
      render(<DeliveryCard delivery={delivery} />);

      expect(screen.getByText('Out for Delivery')).toBeInTheDocument();
    });

    it('renders destination address', () => {
      const delivery = createMockDelivery({
        destination: {
          address: '123 Main Street, San Francisco, CA 94102',
          lat: 37.7749,
          lng: -122.4194,
        },
      });
      render(<DeliveryCard delivery={delivery} />);

      expect(screen.getByText(/123 Main Street/)).toBeInTheDocument();
    });

    it('renders item count', () => {
      const delivery = createMockDelivery({
        order: {
          itemCount: 5,
          totalAmount: 2500,
        },
      });
      render(<DeliveryCard delivery={delivery} />);

      expect(screen.getByText('5 items')).toBeInTheDocument();
    });

    it('renders singular item text for 1 item', () => {
      const delivery = createMockDelivery({
        order: {
          itemCount: 1,
          totalAmount: 1500,
        },
      });
      render(<DeliveryCard delivery={delivery} />);

      expect(screen.getByText('1 item')).toBeInTheDocument();
    });

    it('renders order total when available', () => {
      const delivery = createMockDelivery({
        order: {
          itemCount: 3,
          totalAmount: 2599, // $25.99
        },
      });
      render(<DeliveryCard delivery={delivery} />);

      expect(screen.getByText('$25.99')).toBeInTheDocument();
    });
  });

  describe('Driver Information', () => {
    it('renders driver name when available and active', () => {
      const delivery = createMockDelivery({
        status: 'out_for_delivery',
        driver: {
          name: 'John',
          location: {
            lat: 37.7749,
            lng: -122.4194,
            timestamp: new Date(),
          },
        },
      });
      render(<DeliveryCard delivery={delivery} />);

      expect(screen.getByText('John')).toBeInTheDocument();
    });

    it('renders vehicle info when available', () => {
      const delivery = createMockDelivery({
        status: 'out_for_delivery',
        driver: {
          name: 'John',
          vehicle: {
            color: 'Red',
            make: 'Toyota',
          },
          location: {
            lat: 37.7749,
            lng: -122.4194,
            timestamp: new Date(),
          },
        },
      });
      render(<DeliveryCard delivery={delivery} />);

      expect(screen.getByText('Red Toyota')).toBeInTheDocument();
    });

    it('does not render driver info for delivered status', () => {
      const delivery = createMockDelivery({
        status: 'delivered',
        driver: {
          name: 'John',
        },
      });
      render(<DeliveryCard delivery={delivery} />);

      expect(screen.queryByText('John')).not.toBeInTheDocument();
    });
  });

  describe('Status States', () => {
    it('shows "Delivered" text for delivered status', () => {
      const delivery = createMockDelivery({
        status: 'delivered',
        statusLabel: 'Delivered',
      });
      render(<DeliveryCard delivery={delivery} />);

      // The component shows "Delivered" in both the header (span) and the status badge
      const deliveredElements = screen.getAllByText('Delivered');
      expect(deliveredElements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows "Cancelled" text for cancelled status', () => {
      const delivery = createMockDelivery({
        status: 'cancelled',
        statusLabel: 'Cancelled',
      });
      render(<DeliveryCard delivery={delivery} />);

      // The component shows "Cancelled" in both the header (span) and the status badge
      const cancelledElements = screen.getAllByText('Cancelled');
      expect(cancelledElements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows "Delayed" indicator for delayed status', () => {
      const delivery = createMockDelivery({ status: 'delayed', statusLabel: 'Delayed' });
      render(<DeliveryCard delivery={delivery} />);

      // Should show both status label and delayed indicator
      const delayedElements = screen.getAllByText('Delayed');
      expect(delayedElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Interactions', () => {
    it('calls onClick when card is clicked', async () => {
      const delivery = createMockDelivery({
        status: 'out_for_delivery',
        statusLabel: 'Out for Delivery',
      });
      const handleClick = vi.fn();
      render(<DeliveryCard delivery={delivery} onClick={handleClick} />);

      // Find the card by looking for the cursor-pointer class
      const card = document.querySelector('[class*="cursor-pointer"]');
      expect(card).toBeInTheDocument();

      if (card) {
        fireEvent.click(card);
        expect(handleClick).toHaveBeenCalledTimes(1);
      }
    });

    it('calls onExpand when details button is clicked', () => {
      const delivery = createMockDelivery({ status: 'out_for_delivery' });
      const handleExpand = vi.fn();
      const handleClick = vi.fn();
      render(
        <DeliveryCard
          delivery={delivery}
          onClick={handleClick}
          onExpand={handleExpand}
        />
      );

      const detailsButton = screen.getByRole('button', { name: /details/i });
      fireEvent.click(detailsButton);

      expect(handleExpand).toHaveBeenCalledTimes(1);
      // Should not trigger onClick when clicking details button
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('renders details button only when onExpand is provided', () => {
      const delivery = createMockDelivery({ status: 'out_for_delivery' });
      const { rerender } = render(<DeliveryCard delivery={delivery} />);

      expect(screen.queryByRole('button', { name: /details/i })).not.toBeInTheDocument();

      rerender(<DeliveryCard delivery={delivery} onExpand={() => {}} />);

      expect(screen.getByRole('button', { name: /details/i })).toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('applies selected styling when isSelected is true', () => {
      const delivery = createMockDelivery({ status: 'out_for_delivery' });
      const { container } = render(<DeliveryCard delivery={delivery} isSelected />);

      // Check for ring styling which indicates selection
      const card = container.querySelector('[class*="ring-"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Progress Indicator', () => {
    it('renders progress indicator for active deliveries', () => {
      const delivery = createMockDelivery({ status: 'out_for_delivery' });
      render(<DeliveryCard delivery={delivery} />);

      // Progress bars should be rendered
      const progressBars = document.querySelectorAll('[class*="h-1.5"]');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('does not render progress indicator for cancelled status', () => {
      const delivery = createMockDelivery({ status: 'cancelled' });
      render(<DeliveryCard delivery={delivery} />);

      // Progress bars should not be present for cancelled
      const progressSection = document.querySelector('.mt-3');
      // Check that there's no progress container after footer
      expect(progressSection?.querySelector('[class*="h-1.5"]')).toBeFalsy();
    });
  });
});

describe('DeliveryCardSkeleton', () => {
  it('renders skeleton placeholders', () => {
    render(<DeliveryCardSkeleton />);

    // Should have multiple skeleton elements
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('applies custom className', () => {
    render(<DeliveryCardSkeleton className="test-class" />);

    const skeleton = document.querySelector('.test-class');
    expect(skeleton).toBeInTheDocument();
  });
});
