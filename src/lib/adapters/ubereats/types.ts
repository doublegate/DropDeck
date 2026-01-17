import { z } from 'zod';

/**
 * Uber Eats OAuth token response
 */
export const UberEatsTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  token_type: z.string().default('Bearer'),
  expires_in: z.number(),
  scope: z.string().optional(),
});

export type UberEatsTokenResponse = z.infer<typeof UberEatsTokenResponseSchema>;

/**
 * Uber Eats courier location
 */
export const UberEatsCourierLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  bearing: z.number().optional(),
  speed: z.number().optional(),
  accuracy: z.number().optional(),
});

export type UberEatsCourierLocation = z.infer<typeof UberEatsCourierLocationSchema>;

/**
 * Uber Eats courier vehicle
 */
export const UberEatsCourierVehicleSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  license_plate: z.string().optional(),
  vehicle_type: z.string().optional(),
});

export type UberEatsCourierVehicle = z.infer<typeof UberEatsCourierVehicleSchema>;

/**
 * Uber Eats courier information
 */
export const UberEatsCourierSchema = z.object({
  name: z.string(),
  phone_number: z.string().optional(),
  picture_url: z.string().optional(),
  rating: z.number().optional(),
  vehicle: UberEatsCourierVehicleSchema.optional(),
  location: UberEatsCourierLocationSchema.optional(),
});

export type UberEatsCourier = z.infer<typeof UberEatsCourierSchema>;

/**
 * Uber Eats order item
 */
export const UberEatsOrderItemSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  quantity: z.number(),
  price: z
    .object({
      amount: z.number(),
      currency: z.string(),
    })
    .optional(),
  selected_options: z
    .array(
      z.object({
        title: z.string(),
        price: z
          .object({
            amount: z.number(),
            currency: z.string(),
          })
          .optional(),
      })
    )
    .optional(),
  special_instructions: z.string().optional(),
});

export type UberEatsOrderItem = z.infer<typeof UberEatsOrderItemSchema>;

/**
 * Uber Eats address
 */
export const UberEatsAddressSchema = z.object({
  street_address: z.string().optional(),
  street_address_2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  formatted_address: z.string().optional(),
});

export type UberEatsAddress = z.infer<typeof UberEatsAddressSchema>;

/**
 * Uber Eats store information
 */
export const UberEatsStoreSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone_number: z.string().optional(),
  address: UberEatsAddressSchema.optional(),
  hero_image_url: z.string().optional(),
});

export type UberEatsStore = z.infer<typeof UberEatsStoreSchema>;

/**
 * Uber Eats order status
 */
export type UberEatsOrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DENIED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'COURIER_ASSIGNED'
  | 'COURIER_HEADING_TO_STORE'
  | 'COURIER_AT_STORE'
  | 'IN_TRANSIT'
  | 'ARRIVING'
  | 'DELIVERED'
  | 'CANCELLED';

/**
 * Uber Eats delivery ETA
 */
export const UberEatsDeliveryEtaSchema = z.object({
  estimated_arrival: z.string().optional(),
  estimated_minutes: z.number().optional(),
  min_minutes: z.number().optional(),
  max_minutes: z.number().optional(),
});

export type UberEatsDeliveryEta = z.infer<typeof UberEatsDeliveryEtaSchema>;

/**
 * Uber Eats order
 */
export const UberEatsOrderSchema = z.object({
  id: z.string(),
  display_id: z.string().optional(),
  status: z.string(),
  store: UberEatsStoreSchema.optional(),
  items: z.array(UberEatsOrderItemSchema).optional(),
  subtotal: z
    .object({
      amount: z.number(),
      currency: z.string(),
    })
    .optional(),
  total: z
    .object({
      amount: z.number(),
      currency: z.string(),
    })
    .optional(),
  delivery_address: UberEatsAddressSchema.optional(),
  delivery_instructions: z.string().optional(),
  courier: UberEatsCourierSchema.optional(),
  delivery_eta: UberEatsDeliveryEtaSchema.optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
  delivered_at: z.string().optional(),
  cancelled_at: z.string().optional(),
  tracking_url: z.string().optional(),
  delivery_photo_url: z.string().optional(),
});

export type UberEatsOrder = z.infer<typeof UberEatsOrderSchema>;

/**
 * Uber Eats orders list response
 */
export const UberEatsOrdersResponseSchema = z.object({
  orders: z.array(UberEatsOrderSchema),
  next_page_token: z.string().optional(),
});

export type UberEatsOrdersResponse = z.infer<typeof UberEatsOrdersResponseSchema>;

/**
 * Uber Eats webhook event types
 */
export type UberEatsWebhookEventType =
  | 'orders.status_update'
  | 'orders.courier_update'
  | 'orders.delivery_complete';

/**
 * Uber Eats webhook payload
 */
export const UberEatsWebhookPayloadSchema = z.object({
  event_id: z.string(),
  event_type: z.string(),
  event_time: z.string(),
  meta: z
    .object({
      user_id: z.string().optional(),
      resource_id: z.string().optional(),
    })
    .optional(),
  data: z.object({
    order_id: z.string(),
    status: z.string().optional(),
    courier: UberEatsCourierSchema.optional(),
    delivery_eta: UberEatsDeliveryEtaSchema.optional(),
    delivery_photo_url: z.string().optional(),
  }),
});

export type UberEatsWebhookPayload = z.infer<typeof UberEatsWebhookPayloadSchema>;

/**
 * Uber Eats API error
 */
export const UberEatsApiErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
  errors: z
    .array(
      z.object({
        code: z.string(),
        message: z.string(),
      })
    )
    .optional(),
});

export type UberEatsApiError = z.infer<typeof UberEatsApiErrorSchema>;

/**
 * PKCE code verifier storage
 */
export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  createdAt: Date;
}
