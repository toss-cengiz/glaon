// Saved dashboard layouts — first domain endpoint (#420). The shape is
// deliberately minimal: a payload `record` opaque to apps/api, scoped
// per { userId, homeId }. Frontend owns the layout grammar (which card
// goes where, what colour, etc.); apps/api just persists + serves.

import { z } from 'zod';

const Iso8601 = z.string().datetime({ offset: true });

export const LayoutPayloadSchema = z.record(z.unknown());
export type LayoutPayload = z.infer<typeof LayoutPayloadSchema>;

export const LayoutSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  homeId: z.string().min(1),
  name: z.string().min(1).max(120),
  payload: LayoutPayloadSchema,
  createdAt: Iso8601,
  updatedAt: Iso8601,
});
export type Layout = z.infer<typeof LayoutSchema>;

export const CreateLayoutRequestSchema = z.object({
  homeId: z.string().min(1),
  name: z.string().min(1).max(120),
  payload: LayoutPayloadSchema,
});
export type CreateLayoutRequest = z.infer<typeof CreateLayoutRequestSchema>;

export const UpdateLayoutRequestSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  payload: LayoutPayloadSchema.optional(),
});
export type UpdateLayoutRequest = z.infer<typeof UpdateLayoutRequestSchema>;

export const LayoutListResponseSchema = z.object({
  layouts: z.array(LayoutSchema),
});
export type LayoutListResponse = z.infer<typeof LayoutListResponseSchema>;

export const LayoutListQuerySchema = z.object({
  homeId: z.string().min(1).optional(),
});
export type LayoutListQuery = z.infer<typeof LayoutListQuerySchema>;
