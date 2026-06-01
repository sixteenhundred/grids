/**
 * Service layer barrel (SERVER-ONLY).
 *
 * Re-exports only. Importing this pulls the AI service (Anthropic SDK), so do
 * not import it from client code. Scaffolds (stripe/storage/email) contain no
 * uninstalled-SDK imports, so this stays build-safe.
 */
export * from "./types";
export * as ai from "./ai.service";
export * as stripe from "./stripe.service";
export * as storage from "./storage.service";
export * as email from "./email.service";
