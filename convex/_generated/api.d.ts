/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as addresses from "../addresses.js";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_slugify from "../lib/slugify.js";
import type * as orders from "../orders.js";
import type * as paymentMethods from "../paymentMethods.js";
import type * as pressQuotes from "../pressQuotes.js";
import type * as products from "../products.js";
import type * as seed from "../seed.js";
import type * as seedData from "../seedData.js";
import type * as siteHome from "../siteHome.js";
import type * as siteSections from "../siteSections.js";
import type * as siteSettings from "../siteSettings.js";
import type * as testimonials from "../testimonials.js";
import type * as userProfiles from "../userProfiles.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  addresses: typeof addresses;
  admin: typeof admin;
  auth: typeof auth;
  categories: typeof categories;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/slugify": typeof lib_slugify;
  orders: typeof orders;
  paymentMethods: typeof paymentMethods;
  pressQuotes: typeof pressQuotes;
  products: typeof products;
  seed: typeof seed;
  seedData: typeof seedData;
  siteHome: typeof siteHome;
  siteSections: typeof siteSections;
  siteSettings: typeof siteSettings;
  testimonials: typeof testimonials;
  userProfiles: typeof userProfiles;
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
