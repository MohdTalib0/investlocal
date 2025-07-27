import { 
  users, 
  businessListings, 
  posts,
  postLikes,
  messages, 
  ratings, 
  interests, 
  reports,
  type User, 
  type InsertUser,
  type BusinessListing,
  type InsertBusinessListing,
  type Post,
  type InsertPost,
  type PostLike,
  type InsertPostLike,
  type Message,
  type InsertMessage,
  type Rating,
  type InsertRating,
  type Interest,
  type InsertInterest,
  type Report,
  type InsertReport
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, count } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Posts methods (unified for investment & community posts)
  createPost(post: InsertPost): Promise<Post>;
  getPosts(filters?: {
    postType?: 'investment' | 'community';
    category?: string;
    city?: string;
    fundingMin?: number;
    fundingMax?: number;
    search?: string;
    status?: string;
  }): Promise<Post[]>;
  getPost(id: string): Promise<Post | undefined>;
  updatePost(id: string, updates: Partial<Post>): Promise<Post>;
  getUserPosts(userId: string): Promise<Post[]>;
  deletePost(id: string): Promise<void>;
  likePost(userId: string, postId: string): Promise<void>;
  unlikePost(userId: string, postId: string): Promise<void>;
  getPostLikes(postId: string): Promise<PostLike[]>;
  
  // Business listing methods (kept for backward compatibility)
  createBusinessListing(listing: InsertBusinessListing): Promise<BusinessListing>;
  getBusinessListings(filters?: {
    category?: string;
    city?: string;
    fundingMin?: number;
    fundingMax?: number;
    search?: string;
    status?: string;
  }): Promise<BusinessListing[]>;
  getBusinessListing(id: string): Promise<BusinessListing | undefined>;
  updateBusinessListing(id: string, updates: Partial<BusinessListing>): Promise<BusinessListing>;
  deleteBusinessListing(id: string): Promise<void>;
  getUserListings(userId: string): Promise<BusinessListing[]>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getConversation(senderId: string, receiverId: string): Promise<Message[]>;
  getUserConversations(userId: string): Promise<{ user: User; lastMessage: Message; unreadCount: number }[]>;
  markMessagesAsRead(senderId: string, receiverId: string): Promise<void>;
  
  // Rating methods
  createRating(rating: InsertRating): Promise<Rating>;
  getUserRatings(userId: string): Promise<Rating[]>;
  getListingRatings(listingId: string): Promise<Rating[]>;
  
  // Interest methods
  createInterest(interest: InsertInterest): Promise<Interest>;
  getListingInterests(listingId: string): Promise<Interest[]>;
  getUserInterests(userId: string): Promise<Interest[]>;
  updateInterestStatus(id: string, status: string): Promise<Interest>;
  
  // Report methods
  createReport(report: InsertReport): Promise<Report>;
  getReports(status?: string): Promise<Report[]>;
  updateReportStatus(id: string, status: string): Promise<Report>;
  
  // Admin methods
  getPendingListings(): Promise<BusinessListing[]>;
  getPendingUsers(): Promise<User[]>;
  getSystemStats(): Promise<{
    totalUsers: number;
    totalListings: number;
    pendingReviews: number;
    totalInterests: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  // Posts methods
  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async getPosts(filters?: {
    postType?: 'investment' | 'community';
    category?: string;
    city?: string;
    fundingMin?: number;
    fundingMax?: number;
    search?: string;
    status?: string;
  }): Promise<Post[]> {
    const conditions = [eq(posts.isActive, true)];
    
    if (filters?.status) {
      conditions.push(eq(posts.status, filters.status));
    } else {
      conditions.push(eq(posts.status, "approved"));
    }
    
    if (filters?.postType) {
      conditions.push(eq(posts.postType, filters.postType));
    }
    
    if (filters?.category) {
      conditions.push(eq(posts.category, filters.category));
    }
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(posts.title, `%${filters.search}%`),
          ilike(posts.content, `%${filters.search}%`)
        )!
      );
    }
    
    if (filters?.fundingMin && filters.postType === 'investment') {
      conditions.push(eq(posts.fundingMin, filters.fundingMin));
    }
    
    if (filters?.fundingMax && filters.postType === 'investment') {
      conditions.push(eq(posts.fundingMax, filters.fundingMax));
    }
    
    return await db.select().from(posts).where(and(...conditions)).orderBy(desc(posts.createdAt));
  }

  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    const [post] = await db.update(posts).set(updates).where(eq(posts.id, id)).returning();
    return post;
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    return await db.select().from(posts)
      .where(and(eq(posts.authorId, userId), eq(posts.isActive, true)))
      .orderBy(desc(posts.createdAt));
  }

  async deletePost(id: string): Promise<void> {
    await db.update(posts).set({ isActive: false }).where(eq(posts.id, id));
  }

  async likePost(userId: string, postId: string): Promise<void> {
    try {
      await db.insert(postLikes).values({ userId, postId });
      // Increment like count on post
      const post = await this.getPost(postId);
      if (post) {
        await this.updatePost(postId, { likes: (post.likes || 0) + 1 });
      }
    } catch (error) {
      // Like already exists, ignore
    }
  }

  async unlikePost(userId: string, postId: string): Promise<void> {
    await db.delete(postLikes).where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)));
    // Decrement like count on post
    const post = await this.getPost(postId);
    if (post && (post.likes || 0) > 0) {
      await this.updatePost(postId, { likes: (post.likes || 0) - 1 });
    }
  }

  async getPostLikes(postId: string): Promise<PostLike[]> {
    return await db.select().from(postLikes).where(eq(postLikes.postId, postId));
  }

  async createBusinessListing(listing: InsertBusinessListing): Promise<BusinessListing> {
    const [newListing] = await db.insert(businessListings).values(listing).returning();
    return newListing;
  }

  async getBusinessListings(filters?: {
    category?: string;
    city?: string;
    fundingMin?: number;
    fundingMax?: number;
    search?: string;
    status?: string;
  }): Promise<BusinessListing[]> {
    let query = db.select().from(businessListings).where(eq(businessListings.isActive, true));
    
    const conditions = [eq(businessListings.isActive, true)];
    
    if (filters?.status) {
      conditions.push(eq(businessListings.status, filters.status));
    } else {
      conditions.push(eq(businessListings.status, "approved"));
    }
    
    if (filters?.category) {
      conditions.push(eq(businessListings.category, filters.category));
    }
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(businessListings.title, `%${filters.search}%`),
          ilike(businessListings.description, `%${filters.search}%`)
        )!
      );
    }
    
    if (filters?.fundingMin) {
      conditions.push(eq(businessListings.fundingMin, filters.fundingMin));
    }
    
    if (filters?.fundingMax) {
      conditions.push(eq(businessListings.fundingMax, filters.fundingMax));
    }
    
    const listings = await db
      .select()
      .from(businessListings)
      .where(and(...conditions))
      .orderBy(desc(businessListings.createdAt));
      
    return listings;
  }

  async getBusinessListing(id: string): Promise<BusinessListing | undefined> {
    const [listing] = await db.select().from(businessListings).where(eq(businessListings.id, id));
    return listing || undefined;
  }

  async updateBusinessListing(id: string, updates: Partial<BusinessListing>): Promise<BusinessListing> {
    const [listing] = await db
      .update(businessListings)
      .set(updates)
      .where(eq(businessListings.id, id))
      .returning();
    return listing;
  }

  async deleteBusinessListing(id: string): Promise<void> {
    await db.update(businessListings)
      .set({ isActive: false })
      .where(eq(businessListings.id, id));
  }

  async getUserListings(userId: string): Promise<BusinessListing[]> {
    return await db
      .select()
      .from(businessListings)
      .where(and(eq(businessListings.entrepreneurId, userId), eq(businessListings.isActive, true)))
      .orderBy(desc(businessListings.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getConversation(senderId: string, receiverId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId)),
          and(eq(messages.senderId, receiverId), eq(messages.receiverId, senderId))
        )!
      )
      .orderBy(messages.createdAt);
  }

  async getUserConversations(userId: string): Promise<{ user: User; lastMessage: Message; unreadCount: number }[]> {
    // This is a simplified implementation - in production you'd want a more efficient query
    const userMessages = await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId))!)
      .orderBy(desc(messages.createdAt));

    const conversationMap = new Map();
    
    for (const message of userMessages) {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      
      if (!conversationMap.has(otherUserId)) {
        const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId));
        const unreadCount = await db
          .select({ count: count() })
          .from(messages)
          .where(
            and(
              eq(messages.senderId, otherUserId),
              eq(messages.receiverId, userId),
              eq(messages.isRead, false)
            )
          );
          
        conversationMap.set(otherUserId, {
          user: otherUser,
          lastMessage: message,
          unreadCount: unreadCount[0]?.count || 0
        });
      }
    }
    
    return Array.from(conversationMap.values());
  }

  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.senderId, senderId),
          eq(messages.receiverId, receiverId),
          eq(messages.isRead, false)
        )
      );
  }

  async createRating(rating: InsertRating): Promise<Rating> {
    const [newRating] = await db.insert(ratings).values(rating).returning();
    return newRating;
  }

  async getUserRatings(userId: string): Promise<Rating[]> {
    return await db
      .select()
      .from(ratings)
      .where(eq(ratings.ratedUserId, userId))
      .orderBy(desc(ratings.createdAt));
  }

  async getListingRatings(listingId: string): Promise<Rating[]> {
    return await db
      .select()
      .from(ratings)
      .where(eq(ratings.listingId, listingId))
      .orderBy(desc(ratings.createdAt));
  }

  async createInterest(interest: InsertInterest): Promise<Interest> {
    const [newInterest] = await db.insert(interests).values(interest).returning();
    return newInterest;
  }

  async getListingInterests(listingId: string): Promise<Interest[]> {
    return await db
      .select()
      .from(interests)
      .where(eq(interests.listingId, listingId))
      .orderBy(desc(interests.createdAt));
  }

  async getUserInterests(userId: string): Promise<Interest[]> {
    return await db
      .select()
      .from(interests)
      .where(eq(interests.investorId, userId))
      .orderBy(desc(interests.createdAt));
  }

  async updateInterestStatus(id: string, status: string): Promise<Interest> {
    const [interest] = await db
      .update(interests)
      .set({ status })
      .where(eq(interests.id, id))
      .returning();
    return interest;
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async getReports(status?: string): Promise<Report[]> {
    const conditions = status ? [eq(reports.status, status)] : [];
    
    return await db
      .select()
      .from(reports)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reports.createdAt));
  }

  async updateReportStatus(id: string, status: string): Promise<Report> {
    const [report] = await db
      .update(reports)
      .set({ status })
      .where(eq(reports.id, id))
      .returning();
    return report;
  }

  async getPendingListings(): Promise<BusinessListing[]> {
    return await db
      .select()
      .from(businessListings)
      .where(eq(businessListings.status, "pending"))
      .orderBy(desc(businessListings.createdAt));
  }

  async getPendingUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isVerified, false))
      .orderBy(desc(users.createdAt));
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    totalListings: number;
    pendingReviews: number;
    totalInterests: number;
  }> {
    const [totalUsersResult] = await db.select({ count: count() }).from(users);
    const [totalListingsResult] = await db.select({ count: count() }).from(businessListings);
    const [pendingListingsResult] = await db
      .select({ count: count() })
      .from(businessListings)
      .where(eq(businessListings.status, "pending"));
    const [pendingUsersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isVerified, false));
    const [totalInterestsResult] = await db.select({ count: count() }).from(interests);

    return {
      totalUsers: totalUsersResult.count,
      totalListings: totalListingsResult.count,
      pendingReviews: (pendingListingsResult.count || 0) + (pendingUsersResult.count || 0),
      totalInterests: totalInterestsResult.count,
    };
  }
}

export const storage = new DatabaseStorage();
