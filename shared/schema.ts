import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  city: text("city").notNull(),
  userType: text("user_type").notNull(), // 'entrepreneur' | 'investor' | 'admin'
  isVerified: boolean("is_verified").default(false),
  avatar: text("avatar"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Posts table - handles both investment opportunities and regular community posts
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  postType: text("post_type").notNull(), // 'investment' | 'community'
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category"),
  images: jsonb("images").$type<string[]>().default([]),
  attachments: jsonb("attachments").$type<string[]>().default([]),
  
  // Investment-specific fields (only used when postType = 'investment')
  fundingMin: integer("funding_min"),
  fundingMax: integer("funding_max"),
  useOfFunds: text("use_of_funds"),
  timeline: text("timeline"),
  expectedRoi: text("expected_roi"),
  teamSize: integer("team_size"),
  businessPlan: text("business_plan"),
  
  status: text("status").default("pending"), // 'pending' | 'approved' | 'rejected'
  isActive: boolean("is_active").default(true),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Keep business listings for backward compatibility (will migrate existing data)
export const businessListings = pgTable("business_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entrepreneurId: varchar("entrepreneur_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  fundingMin: integer("funding_min").notNull(),
  fundingMax: integer("funding_max").notNull(),
  useOfFunds: text("use_of_funds").notNull(),
  timeline: text("timeline"),
  expectedRoi: text("expected_roi"),
  teamSize: integer("team_size"),
  images: jsonb("images").$type<string[]>().default([]),
  businessPlan: text("business_plan"), // URL to uploaded file
  status: text("status").default("pending"), // 'pending' | 'approved' | 'rejected'
  isActive: boolean("is_active").default(true),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id).notNull(),
  postId: varchar("post_id").references(() => posts.id),
  listingId: varchar("listing_id").references(() => businessListings.id), // Keep for backward compatibility
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // 'text' | 'file'
  fileUrl: text("file_url"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  raterId: varchar("rater_id").references(() => users.id).notNull(),
  ratedUserId: varchar("rated_user_id").references(() => users.id).notNull(),
  listingId: varchar("listing_id").references(() => businessListings.id),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const interests = pgTable("interests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  investorId: varchar("investor_id").references(() => users.id).notNull(),
  postId: varchar("post_id").references(() => posts.id),
  listingId: varchar("listing_id").references(() => businessListings.id), // Keep for backward compatibility
  message: text("message"),
  status: text("status").default("pending"), // 'pending' | 'accepted' | 'rejected'
  createdAt: timestamp("created_at").defaultNow(),
});

// Post likes table for community engagement
export const postLikes = pgTable("post_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  postId: varchar("post_id").references(() => posts.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userPostUnique: unique().on(table.userId, table.postId),
}));

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").references(() => users.id).notNull(),
  reportedUserId: varchar("reported_user_id").references(() => users.id),
  postId: varchar("post_id").references(() => posts.id),
  listingId: varchar("listing_id").references(() => businessListings.id), // Keep for backward compatibility
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").default("pending"), // 'pending' | 'resolved' | 'dismissed'
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  listings: many(businessListings),
  posts: many(posts),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  givenRatings: many(ratings, { relationName: "rater" }),
  receivedRatings: many(ratings, { relationName: "rated" }),
  interests: many(interests),
  reports: many(reports, { relationName: "reporter" }),
  reportedBy: many(reports, { relationName: "reported" }),
  likes: many(postLikes),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  messages: many(messages),
  interests: many(interests),
  reports: many(reports),
  likes: many(postLikes),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
}));

export const businessListingsRelations = relations(businessListings, ({ one, many }) => ({
  entrepreneur: one(users, {
    fields: [businessListings.entrepreneurId],
    references: [users.id],
  }),
  messages: many(messages),
  ratings: many(ratings),
  interests: many(interests),
  reports: many(reports),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
  listing: one(businessListings, {
    fields: [messages.listingId],
    references: [businessListings.id],
  }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  rater: one(users, {
    fields: [ratings.raterId],
    references: [users.id],
    relationName: "rater",
  }),
  ratedUser: one(users, {
    fields: [ratings.ratedUserId],
    references: [users.id],
    relationName: "rated",
  }),
  listing: one(businessListings, {
    fields: [ratings.listingId],
    references: [businessListings.id],
  }),
}));

export const interestsRelations = relations(interests, ({ one }) => ({
  investor: one(users, {
    fields: [interests.investorId],
    references: [users.id],
  }),
  listing: one(businessListings, {
    fields: [interests.listingId],
    references: [businessListings.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
    relationName: "reporter",
  }),
  reportedUser: one(users, {
    fields: [reports.reportedUserId],
    references: [users.id],
    relationName: "reported",
  }),
  listing: one(businessListings, {
    fields: [reports.listingId],
    references: [businessListings.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isVerified: true,
});

export const insertBusinessListingSchema = createInsertSchema(businessListings).omit({
  id: true,
  createdAt: true,
  status: true,
  views: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});

export const insertInterestSchema = createInsertSchema(interests).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  status: true,
  views: true,
  likes: true,
});

export const insertPostLikeSchema = createInsertSchema(postLikes).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type BusinessListing = typeof businessListings.$inferSelect;
export type InsertBusinessListing = z.infer<typeof insertBusinessListingSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type PostLike = typeof postLikes.$inferSelect;
export type InsertPostLike = z.infer<typeof insertPostLikeSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Interest = typeof interests.$inferSelect;
export type InsertInterest = z.infer<typeof insertInterestSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
