import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requirePermission } from "./lib/auth";

export const listForProduct = query({
  args: {
    product_id: v.id("products"),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("reviews")
      .withIndex("by_product_status", (q: any) =>
        q.eq("product_id", args.product_id).eq("status", "published")
      )
      .collect();
    const reviews = [];
    for (const row of rows.sort((a: any, b: any) => b.created_at - a.created_at)) {
      const media = await ctx.db
        .query("review_media")
        .withIndex("by_review", (q: any) => q.eq("review_id", row._id))
        .collect();
      reviews.push({ ...row, media });
    }
    return reviews;
  },
});

export const submit = mutation({
  args: {
    product_id: v.id("products"),
    guest_name: v.optional(v.string()),
    rating: v.number(),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    media_urls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const product = await ctx.db.get(args.product_id);
    if (!product) throw new Error("Product not found");
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const now = Date.now();
    const reviewId = await ctx.db.insert("reviews", {
      product_id: args.product_id,
      user_id: (userId as any) ?? undefined,
      guest_name: args.guest_name,
      rating: args.rating,
      title: args.title,
      body: args.body,
      verified_purchase: false,
      status: "pending",
      helpful_count: 0,
      created_at: now,
      updated_at: now,
    });

    const media = args.media_urls ?? [];
    for (let i = 0; i < media.length; i++) {
      await ctx.db.insert("review_media", {
        review_id: reviewId,
        url: media[i],
        media_type: "image",
        sort_order: i,
        created_at: now,
      });
    }

    return reviewId;
  },
});

export const voteHelpful = mutation({
  args: {
    review_id: v.id("reviews"),
    guest_token: v.optional(v.string()),
    vote: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const review = await ctx.db.get(args.review_id);
    if (!review) throw new Error("Review not found");

    const existingVotes = await ctx.db
      .query("review_votes")
      .withIndex("by_review", (q: any) => q.eq("review_id", args.review_id))
      .collect();
    const existing = existingVotes.find(
      (vote: any) =>
        (userId && vote.user_id === userId) ||
        (args.guest_token && vote.guest_token === args.guest_token)
    );

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        vote: args.vote,
        created_at: now,
      });
    } else {
      await ctx.db.insert("review_votes", {
        review_id: args.review_id,
        user_id: (userId as any) ?? undefined,
        guest_token: args.guest_token,
        vote: args.vote,
        created_at: now,
      });
    }

    const votes = await ctx.db
      .query("review_votes")
      .withIndex("by_review", (q: any) => q.eq("review_id", args.review_id))
      .collect();
    const helpfulCount = votes.filter((vote: any) => vote.vote === "helpful").length;
    await ctx.db.patch(args.review_id, {
      helpful_count: helpfulCount,
      updated_at: now,
    });
  },
});

export const adminList = query({
  handler: async (ctx) => {
    await requirePermission(ctx, "reviews.read");
    const reviews = await ctx.db.query("reviews").collect();
    return reviews.sort((a: any, b: any) => b.created_at - a.created_at);
  },
});

export const adminModerate = mutation({
  args: {
    review_id: v.id("reviews"),
    status: v.string(),
    verified_purchase: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "reviews.write");
    await ctx.db.patch(args.review_id, {
      status: args.status,
      verified_purchase: args.verified_purchase,
      updated_at: Date.now(),
    });
  },
});

export const askQuestion = mutation({
  args: {
    product_id: v.id("products"),
    guest_name: v.optional(v.string()),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const product = await ctx.db.get(args.product_id);
    if (!product) throw new Error("Product not found");
    const now = Date.now();
    return await ctx.db.insert("product_questions", {
      product_id: args.product_id,
      user_id: (userId as any) ?? undefined,
      guest_name: args.guest_name,
      question: args.question,
      status: "pending",
      created_at: now,
      updated_at: now,
    });
  },
});

export const listQuestions = query({
  args: {
    product_id: v.id("products"),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("product_questions")
      .withIndex("by_product", (q: any) => q.eq("product_id", args.product_id))
      .collect();
    const published = questions
      .filter((question: any) => question.status === "published")
      .sort((a: any, b: any) => b.created_at - a.created_at);

    const rows = [];
    for (const question of published) {
      const answers = await ctx.db
        .query("product_answers")
        .withIndex("by_question", (q: any) => q.eq("question_id", question._id))
        .collect();
      rows.push({
        ...question,
        answers: answers
          .filter((answer: any) => answer.status === "published")
          .sort((a: any, b: any) => a.created_at - b.created_at),
      });
    }
    return rows;
  },
});

export const answerQuestion = mutation({
  args: {
    question_id: v.id("product_questions"),
    answer: v.string(),
    publish: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requirePermission(ctx, "reviews.write");
    const question = await ctx.db.get(args.question_id);
    if (!question) throw new Error("Question not found");
    const now = Date.now();
    const answerId = await ctx.db.insert("product_answers", {
      question_id: args.question_id,
      user_id: userId,
      answer: args.answer,
      is_admin: true,
      status: args.publish === false ? "pending" : "published",
      created_at: now,
      updated_at: now,
    });

    await ctx.db.patch(args.question_id, {
      status: args.publish === false ? "pending" : "published",
      updated_at: now,
    });
    return answerId;
  },
});

export const adminListQuestions = query({
  handler: async (ctx) => {
    await requirePermission(ctx, "reviews.read");
    const questions = await ctx.db.query("product_questions").collect();
    const rows = [];
    for (const question of questions.sort((a: any, b: any) => b.created_at - a.created_at)) {
      const product = await ctx.db.get(question.product_id);
      const answers = await ctx.db
        .query("product_answers")
        .withIndex("by_question", (q: any) => q.eq("question_id", question._id))
        .collect();
      rows.push({
        ...question,
        product_name: product?.name ?? "",
        answers: answers.sort((a: any, b: any) => a.created_at - b.created_at),
      });
    }
    return rows;
  },
});

export const adminUpdateQuestionStatus = mutation({
  args: {
    question_id: v.id("product_questions"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "reviews.write");
    await ctx.db.patch(args.question_id, {
      status: args.status,
      updated_at: Date.now(),
    });
  },
});

export const adminUpdateAnswerStatus = mutation({
  args: {
    answer_id: v.id("product_answers"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "reviews.write");
    await ctx.db.patch(args.answer_id, {
      status: args.status,
      updated_at: Date.now(),
    });
  },
});
