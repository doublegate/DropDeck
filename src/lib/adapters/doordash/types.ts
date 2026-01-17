import { z } from 'zod';

/**
 * DoorDash delivery status types
 */
export type DoorDashDeliveryStatus =
  | 'created'
  | 'confirmed'
  | 'enroute_to_pickup'
  | 'arrived_at_pickup'
  | 'picked_up'
  | 'enroute_to_dropoff'
  | 'arrived_at_dropoff'
  | 'delivered'
  | 'cancelled';

/**
 * DoorDash vehicle type
 */
export const DoorDashVehicleSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.string().optional(),
  color: z.string().optional(),
  license_plate_last_four: z.string().optional(),
});

export type DoorDashVehicle = z.infer<typeof DoorDashVehicleSchema>;

/**
 * DoorDash dasher location
 */
export const DoorDashLocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  heading: z.number().optional(),
  speed_mph: z.number().optional(),
  timestamp: z.string().optional(),
});

export type DoorDashLocation = z.infer<typeof DoorDashLocationSchema>;

/**
 * DoorDash dasher information
 */
export const DoorDashDasherSchema = z.object({
  id: z.string().optional(),
  first_name: z.string(),
  last_name: z.string().optional(),
  phone_number: z.string().optional(),
  phone_number_country_code: z.string().optional(),
  rating: z.number().optional(),
  profile_image_url: z.string().optional(),
  vehicle: DoorDashVehicleSchema.optional(),
  location: DoorDashLocationSchema.optional(),
});

export type DoorDashDasher = z.infer<typeof DoorDashDasherSchema>;

/**
 * DoorDash address
 */
export const DoorDashAddressSchema = z.object({
  street: z.string(),
  unit: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zip_code: z.string(),
  country: z.string().default('US'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  subpremise: z.string().optional(),
  full_address: z.string().optional(),
});

export type DoorDashAddress = z.infer<typeof DoorDashAddressSchema>;

/**
 * DoorDash order item
 */
export const DoorDashOrderItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  price: z.number().optional(),
  description: z.string().optional(),
  special_instructions: z.string().optional(),
});

export type DoorDashOrderItem = z.infer<typeof DoorDashOrderItemSchema>;

/**
 * DoorDash delivery
 */
export const DoorDashDeliverySchema = z.object({
  external_delivery_id: z.string(),
  currency: z.string().default('USD'),
  order_value: z.number().optional(),
  items: z.array(DoorDashOrderItemSchema).optional(),
  pickup_address: DoorDashAddressSchema.optional(),
  pickup_phone_number: z.string().optional(),
  pickup_business_name: z.string().optional(),
  pickup_instructions: z.string().optional(),
  dropoff_address: DoorDashAddressSchema,
  dropoff_phone_number: z.string().optional(),
  dropoff_contact_given_name: z.string().optional(),
  dropoff_contact_family_name: z.string().optional(),
  dropoff_instructions: z.string().optional(),
  delivery_status: z.string(),
  cancellation_reason: z.string().optional(),
  updated_at: z.string(),
  created_at: z.string(),
  picked_up_at: z.string().optional(),
  delivered_at: z.string().optional(),
  cancelled_at: z.string().optional(),
  estimated_pickup_time: z.string().optional(),
  actual_pickup_time: z.string().optional(),
  estimated_delivery_time: z.string().optional(),
  actual_delivery_time: z.string().optional(),
  delivery_verification_image_url: z.string().optional(),
  fee: z.number().optional(),
  tip: z.number().optional(),
  dasher: DoorDashDasherSchema.optional(),
  support_reference: z.string().optional(),
  tracking_url: z.string().optional(),
});

export type DoorDashDelivery = z.infer<typeof DoorDashDeliverySchema>;

/**
 * DoorDash delivery list response
 */
export const DoorDashDeliveriesResponseSchema = z.object({
  deliveries: z.array(DoorDashDeliverySchema),
  has_more: z.boolean().optional(),
  continuation_token: z.string().optional(),
});

export type DoorDashDeliveriesResponse = z.infer<typeof DoorDashDeliveriesResponseSchema>;

/**
 * DoorDash webhook event names
 */
export type DoorDashWebhookEventName =
  | 'DELIVERY_CREATED'
  | 'DELIVERY_STATUS_UPDATED'
  | 'DASHER_CONFIRMED'
  | 'DASHER_CONFIRMED_PICKUP_ARRIVAL'
  | 'DASHER_PICKED_UP'
  | 'DASHER_ENROUTE_TO_DROPOFF'
  | 'DASHER_CONFIRMED_DROPOFF_ARRIVAL'
  | 'DELIVERY_CANCELLED'
  | 'DASHER_LOCATION_UPDATE';

/**
 * DoorDash webhook payload
 */
export const DoorDashWebhookPayloadSchema = z.object({
  event_name: z.string(),
  event_id: z.string(),
  external_delivery_id: z.string(),
  delivery_status: z.string(),
  timestamp: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  dasher: DoorDashDasherSchema.optional(),
  estimated_delivery_time: z.string().optional(),
  pickup_time: z.string().optional(),
  dropoff_time: z.string().optional(),
  cancellation_reason: z.string().optional(),
  delivery_verification_image_url: z.string().optional(),
});

export type DoorDashWebhookPayload = z.infer<typeof DoorDashWebhookPayloadSchema>;

/**
 * DoorDash API error
 */
export const DoorDashApiErrorSchema = z.object({
  field_errors: z
    .array(
      z.object({
        field: z.string(),
        error: z.string(),
      })
    )
    .optional(),
  message: z.string().optional(),
  error: z.string().optional(),
  error_code: z.string().optional(),
});

export type DoorDashApiError = z.infer<typeof DoorDashApiErrorSchema>;
