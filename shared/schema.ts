import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
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
  listingId: varchar("listing_id").references(() => businessListings.id),
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
  listingId: varchar("listing_id").references(() => businessListings.id).notNull(),
  message: text("message"),
  status: text("status").default("pending"), // 'pending' | 'accepted' | 'rejected'
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").references(() => users.id).notNull(),
  reportedUserId: varchar("reported_user_id").references(() => users.id),
  listingId: varchar("listing_id").references(() => businessListings.id),
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").default("pending"), // 'pending' | 'resolved' | 'dismissed'
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  listings: many(businessListings),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  givenRatings: many(ratings, { relationName: "rater" }),
  receivedRatings: many(ratings, { relationName: "rated" }),
  interests: many(interests),
  reports: many(reports, { relationName: "reporter" }),
  reportedBy: many(reports, { relationName: "reported" }),
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type BusinessListing = typeof businessListings.$inferSelect;
export type InsertBusinessListing = z.infer<typeof insertBusinessListingSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Interest = typeof interests.$inferSelect;
export type InsertInterest = z.infer<typeof insertInterestSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
