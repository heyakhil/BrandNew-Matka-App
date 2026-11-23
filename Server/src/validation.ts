import { z } from "zod";

const stakePaise = z.number().int().positive().safe();
const side = z.enum(["open", "close"]);
const digit = z.number().int().min(0).max(9);
const panna = z.string().regex(/^\d{3}$/);
const jodi = z.string().regex(/^\d{2}$/);

export const betRequestSchema = z.discriminatedUnion("game", [
  z.object({ game: z.literal("single"), side, ank: digit, stakePaise }),
  z.object({
    game: z.literal("singleBulk"),
    side,
    anks: z.array(digit).min(1),
    stakePaise,
  }),
  z.object({ game: z.literal("jodi"), jodi, stakePaise }),
  z.object({
    game: z.literal("jodiBulk"),
    jodis: z.array(jodi).min(1),
    stakePaise,
  }),
  z.object({ game: z.literal("sp"), side, panna, stakePaise }),
  z.object({ game: z.literal("dp"), side, panna, stakePaise }),
  z.object({ game: z.literal("tp"), side, panna, stakePaise }),
  z.object({
    game: z.literal("spBulk"),
    side,
    pannas: z.array(panna).min(1),
    stakePaise,
  }),
  z.object({
    game: z.literal("dpBulk"),
    side,
    pannas: z.array(panna).min(1),
    stakePaise,
  }),
  z.object({
    game: z.literal("tpBulk"),
    side,
    pannas: z.array(panna).min(1),
    stakePaise,
  }),
  z.object({ game: z.literal("sdDpTp"), side, ank: digit, stakePaise }),
  z.object({
    game: z.literal("spMotor"),
    side,
    digits: z.array(digit).min(3),
    stakePaise,
  }),
  z.object({
    game: z.literal("dpMotor"),
    side,
    digits: z.array(digit).min(2),
    stakePaise,
  }),
  z.object({
    game: z.literal("redJodi"),
    jodis: z.array(jodi).optional(),
    stakePaise,
  }),
  z.object({ game: z.literal("pannaFamily"), side, panna, stakePaise }),
  z.object({
    game: z.literal("cyclePatti"),
    side,
    first: digit,
    second: digit,
    stakePaise,
  }),
  z.object({ game: z.literal("jodiFamily"), jodi, stakePaise }),
  z.object({
    game: z.literal("halfSangam"),
    variant: z.enum(["openPannaCloseAnk", "openAnkClosePanna"]),
    panna,
    ank: digit,
    stakePaise,
  }),
  z.object({
    game: z.literal("fullSangam"),
    openPanna: panna,
    closePanna: panna,
    stakePaise,
  }),
]);

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }, "Invalid market date.");
export const objectIdSchema = z.string().regex(/^[\da-f]{24}$/i);
export const credentialsSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8).max(128),
});

export const playerLoginSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Enter a 10-digit mobile number."),
  password: z.string().min(8).max(128),
});

const passwordConfirmation = z.object({
  password: z.string().min(8).max(128),
  confirmPassword: z.string(),
}).refine(value => value.password === value.confirmPassword, {
  message: "Passwords do not match.", path: ["confirmPassword"],
});

export const playerRegisterSchema = passwordConfirmation.safeExtend({
  name: z.string().trim().min(2).max(80),
  phone: z.string().regex(/^\d{10}$/, "Enter a 10-digit mobile number."),
  dob: dateSchema.refine(value => value <= new Date().toISOString().slice(0, 10), "Date of birth cannot be in the future."),
});

export const registrationVerifySchema = z.object({
  challengeId: objectIdSchema,
  otp: z.string().regex(/^\d{4}$/, "Enter the 4-digit code."),
});

export const passwordResetStartSchema = z.object({
  phone: z.string().regex(/^\d{10}$/),
});

export const passwordResetVerifySchema = z.object({
  challengeId: objectIdSchema,
  otp: z.string().regex(/^\d{4}$/, "Enter the 4-digit code."),
});

export const passwordResetFinishSchema = passwordConfirmation.safeExtend({
  challengeId: objectIdSchema,
  resetToken: z.string().regex(/^[\da-f]{64}$/i),
});
