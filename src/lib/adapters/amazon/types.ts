import { z } from 'zod';

/**
 * Amazon order type
 */
export type AmazonOrderType = 'package' | 'fresh' | 'whole_foods';

/**
 * Amazon delivery status
 */
export type AmazonDeliveryStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'ARRIVING_TODAY'
  | 'DELIVERED'
  | 'DELIVERY_ATTEMPTED'
  | 'RETURNED'
  | 'CANCELLED';

/**
 * Amazon OAuth token response
 */
export const AmazonTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  token_type: z.string().default('bearer'),
  expires_in: z.number(),
});

export type AmazonTokenResponse = z.infer<typeof AmazonTokenResponseSchema>;

/**
 * Amazon driver location
 */
export const AmazonDriverLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timestamp: z.string().optional(),
});

export type AmazonDriverLocation = z.infer<typeof AmazonDriverLocationSchema>;

/**
 * Amazon tracking event
 */
export const AmazonTrackingEventSchema = z.object({
  event_code: z.string(),
  event_description: z.string().optional(),
  event_time: z.string(),
  location: z
    .object({
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

export type AmazonTrackingEvent = z.infer<typeof AmazonTrackingEventSchema>;

/**
 * Amazon delivery window
 */
export const AmazonDeliveryWindowSchema = z.object({
  start_time: z.string(),
  end_time: z.string(),
});

export type AmazonDeliveryWindow = z.infer<typeof AmazonDeliveryWindowSchema>;

/**
 * Amazon order item
 */
export const AmazonOrderItemSchema = z.object({
  asin: z.string().optional(),
  title: z.string(),
  quantity: z.number(),
  price: z
    .object({
      amount: z.number(),
      currency: z.string(),
    })
    .optional(),
  image_url: z.string().optional(),
  is_substitution: z.boolean().optional(),
  original_item: z
    .object({
      asin: z.string(),
      title: z.string(),
    })
    .optional(),
});

export type AmazonOrderItem = z.infer<typeof AmazonOrderItemSchema>;

/**
 * Amazon shipping address
 */
export const AmazonAddressSchema = z.object({
  name: z.string().optional(),
  address_line_1: z.string(),
  address_line_2: z.string().optional(),
  address_line_3: z.string().optional(),
  city: z.string(),
  state_or_region: z.string(),
  postal_code: z.string(),
  country_code: z.string().default('US'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type AmazonAddress = z.infer<typeof AmazonAddressSchema>;

/**
 * Amazon package/shipment
 */
export const AmazonShipmentSchema = z.object({
  shipment_id: z.string(),
  tracking_number: z.string().optional(),
  carrier: z.string().optional(),
  status: z.string(),
  items: z.array(AmazonOrderItemSchema).optional(),
  delivery_window: AmazonDeliveryWindowSchema.optional(),
  promised_delivery_date: z.string().optional(),
  actual_delivery_date: z.string().optional(),
  tracking_events: z.array(AmazonTrackingEventSchema).optional(),
  driver_location: AmazonDriverLocationSchema.optional(),
  delivery_photo_url: z.string().optional(),
  stops_remaining: z.number().optional(),
});

export type AmazonShipment = z.infer<typeof AmazonShipmentSchema>;

/**
 * Amazon order
 */
export const AmazonOrderSchema = z.object({
  order_id: z.string(),
  marketplace_id: z.string().optional(),
  order_type: z.string().optional(), // 'StandardOrder', 'FreshOrder', 'WholeFoodsOrder'
  purchase_date: z.string(),
  last_update_date: z.string(),
  order_status: z.string(),
  fulfillment_channel: z.string().optional(), // 'AFN' (Amazon), 'MFN' (Merchant)
  merchant: z.string().optional(), // 'AMAZON', 'WHOLE_FOODS', etc.
  delivery_type: z.string().optional(), // 'SAME_DAY', 'NEXT_DAY', 'STANDARD'
  category: z.string().optional(), // 'GROCERY', 'GENERAL', etc.
  shipping_address: AmazonAddressSchema.optional(),
  delivery_instructions: z.string().optional(),
  total: z
    .object({
      amount: z.number(),
      currency: z.string(),
    })
    .optional(),
  shipments: z.array(AmazonShipmentSchema).optional(),
});

export type AmazonOrder = z.infer<typeof AmazonOrderSchema>;

/**
 * Amazon orders list response
 */
export const AmazonOrdersResponseSchema = z.object({
  orders: z.array(AmazonOrderSchema),
  next_token: z.string().optional(),
});

export type AmazonOrdersResponse = z.infer<typeof AmazonOrdersResponseSchema>;

/**
 * Amazon real-time tracking response
 * Based on the documented DEANSExternalPackageLocationDetailsProxy endpoint
 */
export const AmazonRealtimeTrackingSchema = z.object({
  lastKnownLocation: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
  stopsRemaining: z.number().optional(),
  estimatedArrival: z
    .object({
      startTime: z.string(),
      endTime: z.string(),
    })
    .optional(),
  deliveryPhoto: z.string().optional(),
});

export type AmazonRealtimeTracking = z.infer<typeof AmazonRealtimeTrackingSchema>;

/**
 * Amazon API error
 */
export const AmazonApiErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
  details: z.string().optional(),
});

export type AmazonApiError = z.infer<typeof AmazonApiErrorSchema>;

/**
 * Known Amazon carriers
 */
export const AMAZON_CARRIERS = {
  AMZL: 'Amazon Logistics',
  UPS: 'UPS',
  USPS: 'USPS',
  FEDEX: 'FedEx',
  ONTRAC: 'OnTrac',
  DHL: 'DHL',
} as const;

export type AmazonCarrier = keyof typeof AMAZON_CARRIERS;
