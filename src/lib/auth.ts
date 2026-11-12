import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { haveIBeenPwned } from "better-auth/plugins/haveibeenpwned";
import type { UserRole } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { getRequestId } from "@/lib/http/request-id";
import { requestLogger } from "@/lib/logger";
import { uuidv7 } from "@/lib/uuidv7";
import { recordAudit } from "@/modules/audit/audit";
import {
  existingAccountEmail,
  resetPasswordEmail,
  verificationEmail,
} from "@/modules/auth/emails";
import { hashPassword, verifyPassword } from "@/modules/auth/password";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  checkSignup,
} from "@/modules/auth/signup-rules";

const DAY_SECONDS = 24 * 60 * 60;

function requestContext(headers?: Headers | null) {
  const requestId = headers ? getRequestId(headers) : "unknown";
  return { requestId, log: requestLogger(requestId) };
}

function createAuth() {
  const e = env();
  const db = getDb();

  return betterAuth({
    appName: "JobConnect",
    baseURL: e.BETTER_AUTH_URL,
    secret: e.BETTER_AUTH_SECRET,
    trustedOrigins: [e.BETTER_AUTH_URL],
    database: prismaAdapter(db, { provider: "postgresql", transaction: true }),
    telemetry: { enabled: false }, // NFR-PRV-001: no usage data leaves the app

    advanced: {
      database: { generateId: () => uuidv7() }, // docs/09 §1
      useSecureCookies: e.NODE_ENV === "production",
      cookiePrefix: "jobconnect",
    },

    user: {
      additionalFields: {
        role: { type: "string", required: true, input: true },
        privacyPolicyVersion: { type: "string", required: true, input: true },
        status: {
          type: "string",
          required: false,
          input: false,
          defaultValue: "ACTIVE",
        },
        privacyConsentAt: { type: "date", required: false, input: false },
      },
    },

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true, // FR-AUTH-006
      autoSignIn: false,
      minPasswordLength: PASSWORD_MIN_LENGTH, // FR-AUTH-003
      maxPasswordLength: PASSWORD_MAX_LENGTH,
      password: { hash: hashPassword, verify: verifyPassword }, // Argon2id, NFR-SEC-001
      resetPasswordTokenExpiresIn: 60 * 60, // FR-AUTH-008
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail(resetPasswordEmail(user.email, user.name, url));
      },
      onPasswordReset: async ({ user }, request) => {
        const { role } = await db.user.findUniqueOrThrow({
          where: { id: user.id },
          select: { role: true },
        });
        await recordAudit(db, {
          action: "auth.password_reset",
          actor: { userId: user.id, role },
          target: { type: "user", id: user.id },
          requestId: requestContext(request?.headers).requestId,
        });
      },
      // Same response as a new sign-up, so the form can't reveal who is registered.
      onExistingUserSignUp: async ({ user }) => {
        await sendEmail(
          existingAccountEmail(
            user.email,
            user.name,
            `${e.BETTER_AUTH_URL}/login`,
          ),
        );
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      expiresIn: DAY_SECONDS, // FR-AUTH-005: 24 hours
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail(verificationEmail(user.email, user.name, url));
      },
    },

    rateLimit: {
      enabled: true,
      storage: "database", // shared across instances (NFR-SEC-007)
      modelName: "rateLimit",
      window: 60,
      max: 120,
      customRules: {
        "/sign-in/email": { window: 60, max: 10 },
        "/sign-up/email": { window: 60, max: 10 },
        "/request-password-reset": { window: 60, max: 10 },
        "/reset-password": { window: 60, max: 10 },
      },
    },

    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const check = checkSignup({
              role: user["role"],
              privacyPolicyVersion: user["privacyPolicyVersion"],
            });
            if (!check.ok)
              throw new APIError("BAD_REQUEST", { message: check.message });
            return {
              data: { ...user, status: "ACTIVE", privacyConsentAt: new Date() },
            };
          },
          after: async (user, ctx) => {
            await recordAudit(db, {
              action: "auth.signup",
              actor: { userId: user.id, role: user["role"] as UserRole },
              target: { type: "user", id: user.id },
              requestId: requestContext(ctx?.headers).requestId,
            });
          },
        },
      },
      session: {
        create: {
          // Suspended or deleted accounts cannot log in (FR-ADM-006, BR-USR-002).
          before: async (session) => {
            const user = await db.user.findUnique({
              where: { id: session.userId },
              select: { status: true },
            });
            if (user?.status !== "ACTIVE") {
              throw new APIError("FORBIDDEN", {
                code: "ACCOUNT_SUSPENDED",
                message: "This account can't sign in. Contact support.",
              });
            }
          },
          after: async (session, ctx) => {
            const user = await db.user.findUnique({
              where: { id: session.userId },
              select: { role: true },
            });
            await recordAudit(db, {
              action: "auth.login",
              actor: user ? { userId: session.userId, role: user.role } : null,
              target: { type: "user", id: session.userId },
              ipAddress: session.ipAddress || null,
              requestId: requestContext(ctx?.headers).requestId,
            });
          },
        },
      },
    },

    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        const { requestId, log } = requestContext(ctx.headers);
        const failed = ctx.context.returned instanceof APIError;
        if (ctx.path === "/sign-in/email" && failed) {
          // No email in the audit entry (NFR-PRV-004); the request id links to the logs.
          await recordAudit(db, {
            action: "auth.login_failed",
            actor: null,
            requestId,
          });
          log.info("sign-in failed");
        }
        if (ctx.path === "/request-password-reset" && !failed) {
          await recordAudit(db, {
            action: "auth.password_reset_requested",
            actor: null,
            requestId,
          });
        }
      }),
    },

    plugins: [
      haveIBeenPwned({
        enabled: e.HIBP_ENABLED,
        customPasswordCompromisedMessage:
          "This password has appeared in a data breach. Please choose a different one.",
      }),
      nextCookies(), // must be last: lets server actions set auth cookies
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

const globalForAuth = globalThis as unknown as { auth?: Auth };

/** Created on first use, like the database client, so `next build` needs no secrets. */
export function getAuth(): Auth {
  globalForAuth.auth ??= createAuth();
  return globalForAuth.auth;
}
