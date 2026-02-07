import { describe, expect, it } from "vitest";
import path from "node:path";
import fs from "node:fs";
import { ConvexHttpClient } from "convex/browser";

function readEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return {};
  const contents = fs.readFileSync(filePath, "utf8");
  const entries = contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      if (index === -1) return null;
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim();
      return [key, value] as const;
    })
    .filter((entry): entry is readonly [string, string] => !!entry);

  return Object.fromEntries(entries);
}

function resolveConvexUrl() {
  if (process.env.CONVEX_URL) return process.env.CONVEX_URL;
  const cwd = process.cwd();
  const env = readEnvFile(path.join(cwd, ".env"));
  if (env.CONVEX_URL) return env.CONVEX_URL;
  const devVars = readEnvFile(path.join(cwd, ".dev.vars"));
  return devVars.CONVEX_URL ?? "";
}

describe("Convex DB sanity", () => {
  it("deployment responds for key public queries", async () => {
    const convexUrl = resolveConvexUrl();
    expect(convexUrl, "CONVEX_URL must be configured in env").toBeTruthy();

    const client = new ConvexHttpClient(convexUrl);
    const [settings, categoriesSeo, productsSeo, collections, blogPosts, pages, health] =
      await Promise.all([
        client.query("siteSettings:get"),
        client.query("categories:listSeo"),
        client.query("products:listSeo"),
        client.query("collections:listPublic"),
        client.query("content:listPosts"),
        client.query("content:listPages"),
        client.query("content:seoHealthReport"),
      ]);

    expect(settings === null || typeof settings === "object").toBe(true);
    expect(Array.isArray(categoriesSeo)).toBe(true);
    expect(Array.isArray(productsSeo)).toBe(true);
    expect(Array.isArray(collections)).toBe(true);
    expect(Array.isArray(blogPosts)).toBe(true);
    expect(Array.isArray(pages)).toBe(true);
    expect(typeof health).toBe("object");
    expect(typeof health.summary?.broken_link_count).toBe("number");
  });

  it("search and recommendation queries return stable payload shapes", async () => {
    const convexUrl = resolveConvexUrl();
    expect(convexUrl, "CONVEX_URL must be configured in env").toBeTruthy();

    const client = new ConvexHttpClient(convexUrl);
    const searchResult = await client.query("products:search", {
      sort: "best-selling",
      limit: 5,
    });
    const products = await client.query("products:list");
    const cart = await client.query("cart:getCurrent", {
      guest_token: "sanity-guest-token",
    });
    const recommendationBundle =
      products.length > 0
        ? await client.query("products:recommendationBundle", {
            product_id: products[0]._id,
            limit: 4,
          })
        : null;

    expect(typeof searchResult).toBe("object");
    expect(Array.isArray(searchResult.products)).toBe(true);
    expect(typeof searchResult.total).toBe("number");
    expect(cart === null || typeof cart === "object").toBe(true);
    if (recommendationBundle) {
      expect(Array.isArray(recommendationBundle.frequently_bought_together)).toBe(true);
      expect(Array.isArray(recommendationBundle.complete_the_look)).toBe(true);
      expect(Array.isArray(recommendationBundle.tag_matches)).toBe(true);
    }
  });

  it("protected promotions query fails safely instead of crashing", async () => {
    const convexUrl = resolveConvexUrl();
    expect(convexUrl, "CONVEX_URL must be configured in env").toBeTruthy();

    const client = new ConvexHttpClient(convexUrl);
    const discounts = await client.query("discounts:adminList");

    expect(Array.isArray(discounts)).toBe(true);
  });
});
