import { z } from "zod";
import { specialities } from "./constants";
const ids = z
  .array(z.string().refine((v) => specialities.some((s) => s.id === v)))
  .min(1)
  .max(6);
const title = z.string().trim().min(2).max(200);
export const studentSchema = z.object({
  firstName: title,
  lastName: title,
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.-]{3,60}$/),
  phone: z.string().max(30).optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  specialityId: z.string().refine((v) => specialities.some((s) => s.id === v)),
  password: z.string().min(12).max(128),
  status: z.enum(["ACTIVE", "SUSPENDED", "ARCHIVED"]).default("ACTIVE"),
  notes: z.string().max(3000).default(""),
});
export const chapterSchema = z.object({
  title,
  description: z.string().max(5000).default(""),
  position: z.coerce.number().int().min(0).default(0),
  published: z.boolean().default(false),
  specialityIds: ids,
});
export const lessonSchema = chapterSchema.extend({
  chapterId: z.string().min(1),
  videoId: z.string().nullable().optional(),
  duration: z.coerce.number().int().min(0).default(0),
});
export const liveSchema = z.object({
  title,
  description: z.string().max(5000).default(""),
  startsAt: z.string().datetime(),
  duration: z.coerce.number().int().min(15).max(480),
  specialityIds: ids,
  recording: z.boolean().default(false),
  status: z
    .enum(["SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"])
    .default("SCHEDULED"),
});
export const resourceSchema = z.object({
  title,
  objectKey: z.string().regex(/^documents\/[a-zA-Z0-9_-]+\.pdf$/),
  kind: z.enum(["PDF", "SUMMARY", "CORRECTION", "BAC"]).default("PDF"),
  published: z.boolean().default(false),
  specialityIds: ids,
  lessonId: z.string().nullable().optional(),
});
export const exerciseSchema = z.object({
  title,
  statement: z.string().min(1).max(20000),
  solution: z.string().max(20000).default(""),
  resourceId: z.string().nullable().optional(),
  specialityIds: ids,
  published: z.boolean().default(false),
});
export const examSchema = z.object({
  title,
  duration: z.coerce.number().int().min(1).max(300),
  kind: z.enum(["PRACTICE", "BAC", "QUIZ"]).default("PRACTICE"),
  specialityIds: ids,
  published: z.boolean().default(false),
  questions: z
    .array(
      z
        .object({
          text: z.string().min(1).max(5000),
          options: z.array(z.string().min(1).max(1000)).min(2).max(6),
          correctIndex: z.number().int().min(0),
          points: z.number().int().min(1).max(20).default(1),
        })
        .refine((q) => q.correctIndex < q.options.length),
    )
    .min(1)
    .max(100),
});
