import "server-only";
import { notFound } from "next/navigation";
import { z } from "zod";
import { DomainError } from "@/lib/http/errors";

/** For pages: a service's "not found" (or a malformed id) renders the 404 page. */
export async function orNotFound<T>(
  id: string,
  load: () => Promise<T>,
): Promise<T> {
  if (!z.uuid().safeParse(id).success) notFound();
  try {
    return await load();
  } catch (err) {
    if (err instanceof DomainError && err.status === 404) notFound();
    throw err;
  }
}
