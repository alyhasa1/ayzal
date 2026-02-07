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
import type * as analytics from "../analytics.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as campaigns from "../campaigns.js";
import type * as cart from "../cart.js";
import type * as categories from "../categories.js";
import type * as checkout from "../checkout.js";
import type * as collections from "../collections.js";
import type * as content from "../content.js";
import type * as customers360 from "../customers360.js";
import type * as discounts from "../discounts.js";
import type * as http from "../http.js";
import type * as inventory from "../inventory.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_orderDeleteAccess from "../lib/orderDeleteAccess.js";
import type * as lib_slugify from "../lib/slugify.js";
import type * as notifications from "../notifications.js";
import type * as orderTracking from "../orderTracking.js";
import type * as orders from "../orders.js";
import type * as paymentMethods from "../paymentMethods.js";
import type * as payments from "../payments.js";
import type * as pressQuotes from "../pressQuotes.js";
import type * as products from "../products.js";
import type * as rbac from "../rbac.js";
import type * as returns from "../returns.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as seedData from "../seedData.js";
import type * as segments from "../segments.js";
import type * as shipping from "../shipping.js";
import type * as siteHome from "../siteHome.js";
import type * as siteSections from "../siteSections.js";
import type * as siteSettings from "../siteSettings.js";
import type * as support from "../support.js";
import type * as taxes from "../taxes.js";
import type * as testimonials from "../testimonials.js";
import type * as userProfiles from "../userProfiles.js";
import type * as users from "../users.js";
import type * as wishlist from "../wishlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  addresses: typeof addresses;
  admin: typeof admin;
  analytics: typeof analytics;
  audit: typeof audit;
  auth: typeof auth;
  campaigns: typeof campaigns;
  cart: typeof cart;
  categories: typeof categories;
  checkout: typeof checkout;
  collections: typeof collections;
  content: typeof content;
  customers360: typeof customers360;
  discounts: typeof discounts;
  http: typeof http;
  inventory: typeof inventory;
  "lib/audit": typeof lib_audit;
  "lib/auth": typeof lib_auth;
  "lib/orderDeleteAccess": typeof lib_orderDeleteAccess;
  "lib/slugify": typeof lib_slugify;
  notifications: typeof notifications;
  orderTracking: typeof orderTracking;
  orders: typeof orders;
  paymentMethods: typeof paymentMethods;
  payments: typeof payments;
  pressQuotes: typeof pressQuotes;
  products: typeof products;
  rbac: typeof rbac;
  returns: typeof returns;
  reviews: typeof reviews;
  seed: typeof seed;
  seedData: typeof seedData;
  segments: typeof segments;
  shipping: typeof shipping;
  siteHome: typeof siteHome;
  siteSections: typeof siteSections;
  siteSettings: typeof siteSettings;
  support: typeof support;
  taxes: typeof taxes;
  testimonials: typeof testimonials;
  userProfiles: typeof userProfiles;
  users: typeof users;
  wishlist: typeof wishlist;
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
