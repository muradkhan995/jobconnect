import { hash, verify } from "@node-rs/argon2";

/**
 * Argon2id (the library default) with OWASP's recommended minimum parameters:
 * 19 MiB memory, 2 iterations, 1 lane (NFR-SEC-001).
 */
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(data: {
  hash: string;
  password: string;
}): Promise<boolean> {
  try {
    return await verify(data.hash, data.password);
  } catch {
    // A malformed stored hash must fail closed, never throw a 500 that hints at internals.
    return false;
  }
}
