import "server-only";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url({ protocol: /^https?$/ }),
  SMTP_URL: z.url({ protocol: /^smtps?$/ }),
  EMAIL_FROM: z.string().min(3),
  HIBP_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

/**
 * Validated server environment. Throws on first use if a variable is missing or malformed,
 * listing only variable names – never their values (NFR-SEC-010, NFR-PRV-004).
 */
export function env(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const names = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid environment variables: ${names}`);
  }
  cached = parsed.data;
  return cached;
}
