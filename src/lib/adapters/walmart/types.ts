import { z } from 'zod';

/**
 * Walmart order type
 */
export type WalmartOrderType = 'delivery' | 'pickup' | 'express';

/**
 * Walmart order status
 */
export type WalmartOrderStatus =
  | 'ORDER_PLACED'
  | 'ORDER_RECEIVED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_HEADING_TO_STORE'
  | 'DRIVER_AT_STORE'
  | 'ON_THE_WAY'
  | 'ARRIVING'
  | 'DELIVERED'
  | 'PICKED_UP'
  | 'CANCELLED';

/**
 * Walmart driver location
 */
export const WalmartDriverLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  heading: z.number().optional(),
  speed: z.number().optional(),
  updated_at: z.string().optional(),
});

export type WalmartDriverLocation = z.infer<typeof WalmartDriverLocationSchema>;

/**
 * Walmart driver information
 */
export const WalmartDriverSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  photo_url: z.string().optional(),
  vehicle: z
    .object({
      make: z.string().optional(),
      model: z.string().optional(),
      color: z.string().optional(),
      license_plate: z.string().optional(),
    })
    .optional(),
  location: WalmartDriverLocationSchema.optional(),
});

export type WalmartDriver = z.infer<typeof WalmartDriverSchema>;

/**
 * Walmart order item
 */
export const WalmartOrderItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  quantity: z.number(),
  price: z.number().optional(),
  image_url: z.string().optional(),
  upc: z.string().optional(),
  substituted: z.boolean().optional(),
  substituted_with: z.string().optional(),
});

export type WalmartOrderItem = z.infer<typeof WalmartOrderItemSchema>;

/**
 * Walmart delivery address
 */
export const WalmartAddressSchema = z.object({
  address_line_1: z.string(),
  address_line_2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  postal_code: z.string(),
  country: z.string().default('US'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type WalmartAddress = z.infer<typeof WalmartAddressSchema>;

/**
 * Walmart store information
 */
export const WalmartStoreSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: WalmartAddressSchema.optional(),
  phone: z.string().optional(),
});

export type WalmartStore = z.infer<typeof WalmartStoreSchema>;

/**
 * Walmart delivery slot
 */
export const WalmartDeliverySlotSchema = z.object({
  slot_id: z.string().optional(),
  start_time: z.string(),
  end_time: z.string(),
  type: z.enum(['standard', 'express']).optional(),
  fee: z.number().optional(),
});

export type WalmartDeliverySlot = z.infer<typeof WalmartDeliverySlotSchema>;

/**
 * Walmart order
 */
export const WalmartOrderSchema = z.object({
  order_id: z.string(),
  order_number: z.string().optional(),
  status: z.string(),
  order_type: z.string().optional(), // 'DELIVERY', 'PICKUP', 'EXPRESS'
  items: z.array(WalmartOrderItemSchema).optional(),
  items_count: z.number().optional(),
  subtotal: z.number().optional(),
  total: z.number().optional(),
  currency: z.string().default('USD'),
  store: WalmartStoreSchema.optional(),
  delivery_address: WalmartAddressSchema.optional(),
  delivery_instructions: z.string().optional(),
  delivery_slot: WalmartDeliverySlotSchema.optional(),
  driver: WalmartDriverSchema.optional(),
  eta_minutes: z.number().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  delivered_at: z.string().optional(),
  picked_up_at: z.string().optional(),
  cancelled_at: z.string().optional(),
  tracking_url: z.string().optional(),
});

export type WalmartOrder = z.infer<typeof WalmartOrderSchema>;

/**
 * Walmart orders list response
 */
export const WalmartOrdersResponseSchema = z.object({
  orders: z.array(WalmartOrderSchema),
  has_more: z.boolean().optional(),
  next_cursor: z.string().optional(),
});

export type WalmartOrdersResponse = z.infer<typeof WalmartOrdersResponseSchema>;

/**
 * Walmart session data (stored encrypted)
 */
export interface WalmartSessionData {
  cookies: Record<string, string>;
  userAgent: string;
  lastRefreshed: string;
}

/**
 * Walmart login credentials
 */
export interface WalmartCredentials {
  email: string;
  password: string;
}

/**
 * Walmart API error
 */
export const WalmartApiErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type WalmartApiError = z.infer<typeof WalmartApiErrorSchema>;
