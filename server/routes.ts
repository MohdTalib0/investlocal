import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { insertUserSchema, insertBusinessListingSchema, insertPostSchema, insertMessageSchema, insertRatingSchema, insertInterestSchema, insertReportSchema, insertCommentSchema } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      // Generate JWT token
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          fullName: user.fullName,
          userType: user.userType,
          isVerified: user.isVerified
        }, 
        token 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          fullName: user.fullName,
          userType: user.userType,
          isVerified: user.isVerified,
          avatar: user.avatar,
          bio: user.bio,
          city: user.city
        }, 
        token 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login failed" });
    }
  });

  // User routes
  app.get("/api/users/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
        isVerified: user.isVerified,
        avatar: user.avatar,
        bio: user.bio,
        city: user.city,
        phone: user.phone
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.put("/api/users/me", authenticateToken, async (req: any, res) => {
    try {
      const updates = req.body;
      delete updates.password; // Don't allow password updates through this route
      
      const user = await storage.updateUser(req.user.userId, updates);
      res.json({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
        isVerified: user.isVerified,
        avatar: user.avatar,
        bio: user.bio,
        city: user.city,
        phone: user.phone
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Business listing routes
  app.post("/api/listings", authenticateToken, async (req: any, res) => {
    try {
      const listingData = insertBusinessListingSchema.parse({
        ...req.body,
        entrepreneurId: req.user.userId,
        status: "approved", // Auto-approve all listings
      });
      
      const listing = await storage.createBusinessListing(listingData);
      res.json(listing);
    } catch (error) {
      console.error("Create listing error:", error);
      res.status(400).json({ message: "Failed to create listing" });
    }
  });

  app.get("/api/listings", async (req, res) => {
    try {
      const filters = {
        category: req.query.category as string,
        city: req.query.city as string,
        fundingMin: req.query.fundingMin ? parseInt(req.query.fundingMin as string) : undefined,
        fundingMax: req.query.fundingMax ? parseInt(req.query.fundingMax as string) : undefined,
        search: req.query.search as string,
        status: req.query.status as string,
      };
      
      const listings = await storage.getBusinessListings(filters);
      res.json(listings);
    } catch (error) {
      console.error("Get listings error:", error);
      res.status(500).json({ message: "Failed to get listings" });
    }
  });

  app.get("/api/listings/:id", async (req, res) => {
    try {
      const listing = await storage.getBusinessListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      // Increment view count
      await storage.updateBusinessListing(req.params.id, { views: (listing.views || 0) + 1 });
      
      res.json(listing);
    } catch (error) {
      console.error("Get listing error:", error);
      res.status(500).json({ message: "Failed to get listing" });
    }
  });

  app.put("/api/listings/:id", authenticateToken, async (req: any, res) => {
    try {
      const listing = await storage.getBusinessListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      // Check if user owns the listing or is admin
      if (listing.entrepreneurId !== req.user.userId) {
        const user = await storage.getUser(req.user.userId);
        if (user?.userType !== 'admin') {
          return res.status(403).json({ message: "Unauthorized" });
        }
      }
      
      const updatedListing = await storage.updateBusinessListing(req.params.id, req.body);
      res.json(updatedListing);
    } catch (error) {
      console.error("Update listing error:", error);
      res.status(500).json({ message: "Failed to update listing" });
    }
  });

  app.delete("/api/listings/:id", authenticateToken, async (req: any, res) => {
    try {
      const listing = await storage.getBusinessListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      // Check if user owns the listing or is admin
      if (listing.entrepreneurId !== req.user.userId) {
        const user = await storage.getUser(req.user.userId);
        if (user?.userType !== 'admin') {
          return res.status(403).json({ message: "Unauthorized" });
        }
      }
      
      await storage.deleteBusinessListing(req.params.id);
      res.json({ message: "Listing deleted successfully" });
    } catch (error) {
      console.error("Delete listing error:", error);
      res.status(500).json({ message: "Failed to delete listing" });
    }
  });

  app.get("/api/users/me/listings", authenticateToken, async (req: any, res) => {
    try {
      const listings = await storage.getUserListings(req.user.userId);
      res.json(listings);
    } catch (error) {
      console.error("Get user listings error:", error);
      res.status(500).json({ message: "Failed to get user listings" });
    }
  });

  // Post routes (unified investment & community posts)
  app.post("/api/posts", authenticateToken, async (req: any, res) => {
    try {
      console.log('API: Creating post with data:', req.body);
      const postData = insertPostSchema.parse({
        ...req.body,
        authorId: req.user.userId,
        status: "approved", // Auto-approve all posts
      });
      
      console.log('API: Parsed post data:', postData);
      const post = await storage.createPost(postData);
      console.log('API: Created post:', post);
      res.json(post);
    } catch (error) {
      console.error("Create post error:", error);
      res.status(400).json({ message: "Failed to create post" });
    }
  });

  // Debug route to check users
  app.get("/api/debug/users", async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      console.log('All users in database:', allUsers);
      res.json(allUsers);
    } catch (error) {
      console.error("Debug users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.get("/api/posts", async (req, res) => {
    try {
      const filters = {
        postType: req.query.postType as 'investment' | 'community' | undefined,
        category: req.query.category as string,
        city: req.query.city as string,
        fundingMin: req.query.fundingMin ? parseInt(req.query.fundingMin as string) : undefined,
        fundingMax: req.query.fundingMax ? parseInt(req.query.fundingMax as string) : undefined,
        search: req.query.search as string,
        status: req.query.status as string,
      };
      
      console.log('API: Getting posts with filters:', filters);
      const posts = await storage.getPosts(filters);
      
      // Get user data for each post
      const postsWithUsers = await Promise.all(
        posts.map(async (post) => {
          const author = await storage.getUser(post.authorId);
          console.log(`Post ${post.id} - Author ID: ${post.authorId}, Author Data:`, author);
          console.log(`Author fullName:`, author?.fullName);
          console.log(`Author keys:`, author ? Object.keys(author) : 'No author');
          return {
            ...post,
            author: author ? {
              id: author.id,
              fullName: author.fullName,
              email: author.email,
              userType: author.userType,
              avatar: author.avatar,
            } : null
          };
        })
      );
      
      console.log('API: Found posts:', postsWithUsers.length);
      res.json(postsWithUsers);
    } catch (error) {
      console.error("Get posts error:", error);
      res.status(500).json({ message: "Failed to get posts" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Increment view count
      await storage.updatePost(req.params.id, { views: (post.views || 0) + 1 });
      
      res.json(post);
    } catch (error) {
      console.error("Get post error:", error);
      res.status(500).json({ message: "Failed to get post" });
    }
  });

  app.put("/api/posts/:id", authenticateToken, async (req: any, res) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if user owns the post or is admin
      if (post.authorId !== req.user.userId) {
        const user = await storage.getUser(req.user.userId);
        if (user?.userType !== 'admin') {
          return res.status(403).json({ message: "Unauthorized" });
        }
      }
      
      const updatedPost = await storage.updatePost(req.params.id, req.body);
      res.json(updatedPost);
    } catch (error) {
      console.error("Update post error:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.delete("/api/posts/:id", authenticateToken, async (req: any, res) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if user owns the post or is admin
      if (post.authorId !== req.user.userId) {
        const user = await storage.getUser(req.user.userId);
        if (user?.userType !== 'admin') {
          return res.status(403).json({ message: "Unauthorized" });
        }
      }
      
      await storage.deletePost(req.params.id);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  app.get("/api/users/me/posts", authenticateToken, async (req: any, res) => {
    try {
      const posts = await storage.getUserPosts(req.user.userId);
      res.json(posts);
    } catch (error) {
      console.error("Get user posts error:", error);
      res.status(500).json({ message: "Failed to get user posts" });
    }
  });

  app.post("/api/posts/:id/like", authenticateToken, async (req: any, res) => {
    try {
      await storage.likePost(req.user.userId, req.params.id);
      res.json({ message: "Post liked successfully" });
    } catch (error) {
      console.error("Like post error:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.delete("/api/posts/:id/like", authenticateToken, async (req: any, res) => {
    try {
      await storage.unlikePost(req.user.userId, req.params.id);
      res.json({ message: "Post unliked successfully" });
    } catch (error) {
      console.error("Unlike post error:", error);
      res.status(500).json({ message: "Failed to unlike post" });
    }
  });

  app.get("/api/posts/:id/likes", async (req, res) => {
    try {
      const likes = await storage.getPostLikesWithUsers(req.params.id);
      res.json(likes);
    } catch (error) {
      console.error("Get post likes error:", error);
      res.status(500).json({ message: "Failed to get post likes" });
    }
  });

  // Comment routes
  app.post("/api/posts/:id/comments", authenticateToken, async (req: any, res) => {
    try {
      const commentData = insertCommentSchema.parse({
        ...req.body,
        userId: req.user.userId,
        postId: req.params.id,
      });
      
      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Create comment error:", error);
      res.status(400).json({ message: "Failed to create comment" });
    }
  });

  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getPostCommentsWithUsers(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Get post comments error:", error);
      res.status(500).json({ message: "Failed to get post comments" });
    }
  });

  app.delete("/api/comments/:id", authenticateToken, async (req: any, res) => {
    try {
      await storage.deleteComment(req.params.id);
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Message routes
  app.post("/api/messages", authenticateToken, async (req: any, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.userId,
      });
      
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Create message error:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/messages/conversations", authenticateToken, async (req: any, res) => {
    try {
      const conversations = await storage.getUserConversations(req.user.userId);
      res.json(conversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });

  app.get("/api/messages/:userId", authenticateToken, async (req: any, res) => {
    try {
      const messages = await storage.getConversation(req.user.userId, req.params.userId);
      res.json(messages);
    } catch (error) {
      console.error("Get conversation error:", error);
      res.status(500).json({ message: "Failed to get conversation" });
    }
  });

  app.put("/api/messages/:userId/read", authenticateToken, async (req: any, res) => {
    try {
      await storage.markMessagesAsRead(req.params.userId, req.user.userId);
      res.json({ message: "Messages marked as read" });
    } catch (error) {
      console.error("Mark messages read error:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // Interest routes
  app.post("/api/interests", authenticateToken, async (req: any, res) => {
    try {
      const interestData = insertInterestSchema.parse({
        ...req.body,
        investorId: req.user.userId,
      });
      
      const interest = await storage.createInterest(interestData);
      res.json(interest);
    } catch (error) {
      console.error("Create interest error:", error);
      res.status(400).json({ message: "Failed to express interest" });
    }
  });

  app.get("/api/listings/:id/interests", authenticateToken, async (req, res) => {
    try {
      const interests = await storage.getListingInterests(req.params.id);
      res.json(interests);
    } catch (error) {
      console.error("Get listing interests error:", error);
      res.status(500).json({ message: "Failed to get interests" });
    }
  });

  app.get("/api/users/me/interests", authenticateToken, async (req: any, res) => {
    try {
      const interests = await storage.getUserInterests(req.user.userId);
      res.json(interests);
    } catch (error) {
      console.error("Get user interests error:", error);
      res.status(500).json({ message: "Failed to get user interests" });
    }
  });

  // Rating routes
  app.post("/api/ratings", authenticateToken, async (req: any, res) => {
    try {
      const ratingData = insertRatingSchema.parse({
        ...req.body,
        raterId: req.user.userId,
      });
      
      const rating = await storage.createRating(ratingData);
      res.json(rating);
    } catch (error) {
      console.error("Create rating error:", error);
      res.status(400).json({ message: "Failed to create rating" });
    }
  });

  app.get("/api/users/:id/ratings", async (req, res) => {
    try {
      const ratings = await storage.getUserRatings(req.params.id);
      res.json(ratings);
    } catch (error) {
      console.error("Get user ratings error:", error);
      res.status(500).json({ message: "Failed to get user ratings" });
    }
  });

  // Report routes
  app.post("/api/reports", authenticateToken, async (req: any, res) => {
    try {
      const reportData = insertReportSchema.parse({
        ...req.body,
        reporterId: req.user.userId,
      });
      
      const report = await storage.createReport(reportData);
      res.json(report);
    } catch (error) {
      console.error("Create report error:", error);
      res.status(400).json({ message: "Failed to create report" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (user?.userType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ message: "Failed to get admin stats" });
    }
  });

  app.get("/api/admin/pending-listings", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (user?.userType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const listings = await storage.getPendingListings();
      res.json(listings);
    } catch (error) {
      console.error("Get pending listings error:", error);
      res.status(500).json({ message: "Failed to get pending listings" });
    }
  });

  app.get("/api/admin/pending-users", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (user?.userType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const users = await storage.getPendingUsers();
      res.json(users);
    } catch (error) {
      console.error("Get pending users error:", error);
      res.status(500).json({ message: "Failed to get pending users" });
    }
  });

  app.get("/api/admin/reports", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (user?.userType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const reports = await storage.getReports(req.query.status as string);
      res.json(reports);
    } catch (error) {
      console.error("Get reports error:", error);
      res.status(500).json({ message: "Failed to get reports" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
