import { AuthConfig } from "convex/server";

/**
 * Convex auth config for Clerk.
 * - Set CLERK_JWT_ISSUER_DOMAIN in Convex dashboard (or .env.local for `npx convex dev`).
 *   Use your Clerk Frontend API URL, e.g. https://pumped-monkey-9.clerk.accounts.dev
 * - In Clerk dashboard: JWT template named "convex" (audience/convex).
 */
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN ?? "",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
