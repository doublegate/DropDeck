import { z } from 'zod';

/**
 * Instacart OAuth token response schema
 */
export const InstacartTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  token_type: z.string().default('Bearer'),
  expires_in: z.number(),
  scope: z.string().optional(),
});

export type InstacartTokenResponse = z.infer<typeof InstacartTokenResponseSchema>;

/**
 * Instacart shopper location
 */
export const InstacartLocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  heading: z.number().optional(),
  speed: z.number().optional(),
  accuracy: z.number().optional(),
  updated_at: z.string().optional(),
});

export type InstacartLocation = z.infer<typeof InstacartLocationSchema>;

/**
 * Instacart shopper information
 */
export const InstacartShopperSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  photo_url: z.string().optional(),
  phone_number: z.string().optional(),
  rating: z.number().optional(),
  location: InstacartLocationSchema.optional(),
});

export type InstacartShopper = z.infer<typeof InstacartShopperSchema>;

/**
 * Instacart order item
 */
export const InstacartOrderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number(),
  unit_price: z.number().optional(),
  total_price: z.number().optional(),
  image_url: z.string().optional(),
  upc: z.string().optional(),
  replaced: z.boolean().optional(),
  replacement_item: z
    .object({
      id: z.string(),
      name: z.string(),
      quantity: z.number(),
    })
    .optional(),
});

export type InstacartOrderItem = z.infer<typeof InstacartOrderItemSchema>;

/**
 * Instacart delivery address
 */
export const InstacartAddressSchema = z.object({
  street_address: z.string(),
  street_address_2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  postal_code: z.string(),
  country: z.string().default('US'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  delivery_instructions: z.string().optional(),
});

export type InstacartAddress = z.infer<typeof InstacartAddressSchema>;

/**
 * Instacart retailer information
 */
export const InstacartRetailerSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  logo_url: z.string().optional(),
});

export type InstacartRetailer = z.infer<typeof InstacartRetailerSchema>;

/**
 * Instacart order status
 */
export type InstacartOrderStatus =
  | 'order_placed'
  | 'order_acknowledged'
  | 'shopper_assigned'
  | 'shopping'
  | 'checkout'
  | 'ready'
  | 'on_the_way'
  | 'at_store'
  | 'delivering'
  | 'almost_there'
  | 'delivered'
  | 'cancelled';

/**
 * Instacart order
 */
export const InstacartOrderSchema = z.object({
  id: z.string(),
  external_id: z.string().optional(),
  status: z.string(),
  retailer: InstacartRetailerSchema.optional(),
  items: z.array(InstacartOrderItemSchema).optional(),
  items_count: z.number().optional(),
  subtotal: z.number().optional(),
  total: z.number().optional(),
  currency: z.string().default('USD'),
  delivery_address: InstacartAddressSchema,
  shopper: InstacartShopperSchema.optional(),
  estimated_delivery: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
  delivery_window: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
  created_at: z.string(),
  updated_at: z.string(),
  delivered_at: z.string().optional(),
  cancelled_at: z.string().optional(),
  tracking_url: z.string().optional(),
});

export type InstacartOrder = z.infer<typeof InstacartOrderSchema>;

/**
 * Instacart orders list response
 */
export const InstacartOrdersResponseSchema = z.object({
  orders: z.array(InstacartOrderSchema),
  pagination: z
    .object({
      page: z.number(),
      per_page: z.number(),
      total_count: z.number(),
      total_pages: z.number(),
    })
    .optional(),
});

export type InstacartOrdersResponse = z.infer<typeof InstacartOrdersResponseSchema>;

/**
 * Instacart webhook event types
 */
export type InstacartWebhookEventType =
  | 'order.created'
  | 'order.updated'
  | 'order.cancelled'
  | 'shopper.assigned'
  | 'shopper.location_updated'
  | 'delivery.started'
  | 'delivery.completed';

/**
 * Instacart webhook payload
 */
export const InstacartWebhookPayloadSchema = z.object({
  event_id: z.string(),
  event_type: z.string(),
  timestamp: z.string(),
  data: z.object({
    order: InstacartOrderSchema.optional(),
    order_id: z.string().optional(),
    status: z.string().optional(),
    shopper: InstacartShopperSchema.optional(),
    location: InstacartLocationSchema.optional(),
    eta_minutes: z.number().optional(),
  }),
});

export type InstacartWebhookPayload = z.infer<typeof InstacartWebhookPayloadSchema>;

/**
 * Instacart API error response
 */
export const InstacartApiErrorSchema = z.object({
  error: z.string(),
  error_description: z.string().optional(),
  message: z.string().optional(),
  code: z.string().optional(),
});

export type InstacartApiError = z.infer<typeof InstacartApiErrorSchema>;
