/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as lib_auth from "../lib/auth.js";
import type * as lib_gameEngine from "../lib/gameEngine.js";
import type * as roomPlayers from "../roomPlayers.js";
import type * as rooms from "../rooms.js";
import type * as roundAnswers from "../roundAnswers.js";
import type * as rounds from "../rounds.js";
import type * as seed from "../seed.js";
import type * as songs from "../songs.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "lib/auth": typeof lib_auth;
  "lib/gameEngine": typeof lib_gameEngine;
  roomPlayers: typeof roomPlayers;
  rooms: typeof rooms;
  roundAnswers: typeof roundAnswers;
  rounds: typeof rounds;
  seed: typeof seed;
  songs: typeof songs;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
