import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { insertUserSchema, insertBusinessListingSchema, insertPostSchema, insertMessageSchema, insertRatingSchema, insertInterestSchema, insertReportSchema, insertCommentSchema } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File upload configuration
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storageConfig,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip', 'application/x-rar-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, documents, and archives are allowed.'));
    }
  }
});

// Helper function to calculate real portfolio metrics
async function calculatePortfolioMetrics(acceptedInterests: any[]) {
  if (acceptedInterests.length === 0) {
    return {
      sectors: {},
      riskLevel: "No investments",
      averageReturn: 0,
      portfolioGrowth: 0
    };
  }

  // Get the actual posts/businesses for these interests to calculate real metrics
  const investmentDetails = await Promise.all(
    acceptedInterests.map(async (interest) => {
      let post = null;
      let business = null;
      
      if (interest.postId) {
        post = await storage.getPost(interest.postId);
      } else if (interest.listingId) {
        business = await storage.getBusinessListing(interest.listingId);
      }
      
      return {
        interest,
        post,
        business,
        category: post?.category || business?.category || 'Other',
        fundingAmount: post?.fundingMin || business?.fundingMin || 250000,
        expectedReturn: post?.expectedRoi ? parseInt(post.expectedRoi) : (business?.expectedRoi ? parseInt(business.expectedRoi) : 12)
      };
    })
  );

  // Calculate sector distribution based on actual categories
  const sectorCounts: { [key: string]: number } = {};
  investmentDetails.forEach(({ category }) => {
    const sector = category || 'Other';
    sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
  });

  // Convert counts to percentages
  const totalInvestments = investmentDetails.length;
  const sectors: { [key: string]: number } = {};
  Object.entries(sectorCounts).forEach(([sector, count]) => {
    sectors[sector] = Math.round((count / totalInvestments) * 100);
  });

  // Calculate average return based on actual expected returns
  const totalReturn = investmentDetails.reduce((sum, { expectedReturn }) => sum + expectedReturn, 0);
  const averageReturn = Math.round(totalReturn / totalInvestments);

  // Calculate risk level based on sector diversity and investment amounts
  const uniqueSectors = Object.keys(sectors).length;
  const totalAmount = investmentDetails.reduce((sum, { fundingAmount }) => sum + fundingAmount, 0);
  const averageAmount = totalAmount / totalInvestments;
  
  let riskLevel = "Moderate";
  if (uniqueSectors <= 1) {
    riskLevel = "High"; // Concentrated in one sector
  } else if (uniqueSectors >= 4) {
    riskLevel = "Low"; // Well diversified
  }
  
  if (averageAmount > 500000) {
    riskLevel = "High"; // Large individual investments
  }

  // Calculate portfolio growth (simplified - could be enhanced with historical data)
  const portfolioGrowth = Math.round(averageReturn * 0.8); // Rough estimate based on average return

  return {
    sectors,
    riskLevel,
    averageReturn,
    portfolioGrowth
  };
}

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

export async function registerRoutes(app: Express, notificationService?: any): Promise<Server> {
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
      
      // Create session (temporarily disabled for debugging)
      try {
        const sessionToken = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
        
        await storage.createSession({
          userId: user.id,
          sessionToken,
          deviceInfo: {
            userAgent: req.headers['user-agent'] || 'Unknown',
            platform: 'Web',
            browser: 'Unknown',
            ipAddress: req.ip || req.connection.remoteAddress,
          },
          expiresAt,
        });
        
        res.json({ 
          user: { 
            id: user.id, 
            email: user.email, 
            fullName: user.fullName,
            userType: user.userType,
            isVerified: user.isVerified
          }, 
          token,
          sessionToken
        });
      } catch (sessionError) {
        console.error("Session creation error:", sessionError);
        // Fallback: return response without session for now
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
      }
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
      
      // Create session (temporarily disabled for debugging)
      try {
        const sessionToken = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
        
        await storage.createSession({
          userId: user.id,
          sessionToken,
          deviceInfo: {
            userAgent: req.headers['user-agent'] || 'Unknown',
            platform: 'Web',
            browser: 'Unknown',
            ipAddress: req.ip || req.connection.remoteAddress,
          },
          expiresAt,
        });
        
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
          token,
          sessionToken
        });
      } catch (sessionError) {
        console.error("Session creation error:", sessionError);
        // Fallback: return response without session for now
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
      }
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
        phone: user.phone,
        // Investment preferences (for investors)
        investmentAmount: user.investmentAmount,
        riskTolerance: user.riskTolerance,
        preferredSectors: user.preferredSectors,
        investmentHorizon: user.investmentHorizon,
        experienceLevel: user.experienceLevel,
        investmentGoals: user.investmentGoals,
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
        phone: user.phone,
        // Investment preferences (for investors)
        investmentAmount: user.investmentAmount,
        riskTolerance: user.riskTolerance,
        preferredSectors: user.preferredSectors,
        investmentHorizon: user.investmentHorizon,
        experienceLevel: user.experienceLevel,
        investmentGoals: user.investmentGoals,
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Session management endpoints
  app.get("/api/users/me/sessions", authenticateToken, async (req: any, res) => {
    try {
      const sessions = await storage.getActiveUserSessions(req.user.userId);
      res.json(sessions);
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ message: "Failed to get sessions" });
    }
  });

  app.delete("/api/users/me/sessions/:sessionId", authenticateToken, async (req: any, res) => {
    try {
      const sessionId = req.params.sessionId;
      await storage.deactivateSession(sessionId);
      res.json({ message: "Session deactivated successfully" });
    } catch (error) {
      console.error("Deactivate session error:", error);
      res.status(500).json({ message: "Failed to deactivate session" });
    }
  });

  app.delete("/api/users/me/sessions", authenticateToken, async (req: any, res) => {
    try {
      await storage.deactivateAllUserSessions(req.user.userId);
      res.json({ message: "All sessions deactivated successfully" });
    } catch (error) {
      console.error("Deactivate all sessions error:", error);
      res.status(500).json({ message: "Failed to deactivate sessions" });
    }
  });

  // Get public user profile by ID
  app.get("/api/users/:id", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return public profile data (exclude sensitive information)
      res.json({
        id: user.id,
        fullName: user.fullName,
        userType: user.userType,
        city: user.city,
        bio: user.bio,
        avatar: user.avatar,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      });
    } catch (error) {
      console.error("Get user profile error:", error);
      res.status(500).json({ message: "Failed to get user profile" });
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
      if (!req.user?.userId) {
        return res.status(401).json({ message: "User not authenticated properly" });
      }
      
      // First validate the client data
      const validatedData = insertPostSchema.parse(req.body);
      
      // Then create the full post data with server-added fields
      const postData = {
        ...validatedData,
        authorId: req.user.userId,
        status: "approved", // Auto-approve all posts
      };
      
      const post = await storage.createPost(postData);
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
        authorId: req.query.authorId as string,
      };
      
      const posts = await storage.getPosts(filters);
      
      // Get user data for each post
      const postsWithUsers = await Promise.all(
        posts.map(async (post) => {
          const author = await storage.getUser(post.authorId);
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
      
      // Get author data
      const author = await storage.getUser(post.authorId);
      const postWithAuthor = {
        ...post,
        author: author ? {
          id: author.id,
          fullName: author.fullName,
          email: author.email,
          userType: author.userType,
          avatar: author.avatar,
        } : null
      };
      
      // Increment view count
      await storage.updatePost(req.params.id, { views: (post.views || 0) + 1 });
      
      res.json(postWithAuthor);
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

  app.get("/api/users/:userId/posts", async (req, res) => {
    try {
      const userId = req.params.userId;
      const posts = await storage.getUserPosts(userId);
      res.json(posts);
    } catch (error) {
      console.error("Get user posts error:", error);
      res.status(500).json({ message: "Failed to get user posts" });
    }
  });

  app.post("/api/posts/:id/like", authenticateToken, async (req: any, res) => {
    try {
      await storage.likePost(req.user.userId, req.params.id);
      
      // Send notification to post author
      try {
        const post = await storage.getPost(req.params.id);
        const liker = await storage.getUser(req.user.userId);
        
        if (post && liker && post.authorId !== req.user.userId) {
          const notificationService = (req.app as any).notificationService;
          
          if (notificationService) {
            notificationService.sendNotification(post.authorId, {
              type: 'post_liked',
              postId: req.params.id,
              senderId: req.user.userId,
              senderName: liker.fullName || liker.email,
              content: `liked your post`,
              timestamp: new Date().toISOString(),
              receiverId: post.authorId,
            });
          }
        }
      } catch (notificationError) {
        console.error("Like notification error:", notificationError);
        // Don't fail the like if notification fails
      }
      
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
      
      // Send notification to post author
      try {
        const post = await storage.getPost(req.params.id);
        const commenter = await storage.getUser(req.user.userId);
        
        if (post && commenter && post.authorId !== req.user.userId) {
          const notificationService = (req.app as any).notificationService;
          
          if (notificationService) {
            notificationService.sendNotification(post.authorId, {
              type: 'post_commented',
              postId: req.params.id,
              commentId: comment.id,
              senderId: req.user.userId,
              senderName: commenter.fullName || commenter.email,
              content: `commented: "${req.body.content.substring(0, 50)}${req.body.content.length > 50 ? '...' : ''}"`,
              timestamp: comment.createdAt,
              receiverId: post.authorId,
            });
          }
        }
      } catch (notificationError) {
        console.error("Comment notification error:", notificationError);
        // Don't fail the comment if notification fails
      }
      
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

  app.post("/api/posts/:id/interests", authenticateToken, async (req: any, res) => {
    try {
      const interest = await storage.createInterest({
        investorId: req.user.userId,
        postId: req.params.id
      });
      
      // Send notification to post author
      try {
        const post = await storage.getPost(req.params.id);
        const investor = await storage.getUser(req.user.userId);
        
        if (post && investor && post.authorId !== req.user.userId) {
          const notificationService = (req.app as any).notificationService;
          
          if (notificationService) {
            notificationService.sendNotification(post.authorId, {
              type: 'post_commented', // Using comment type for interest
              postId: req.params.id,
              senderId: req.user.userId,
              senderName: investor.fullName || investor.email,
              content: `expressed interest in your investment post`,
              timestamp: interest.createdAt,
              receiverId: post.authorId,
            });
          }
        }
      } catch (notificationError) {
        console.error("Interest notification error:", notificationError);
        // Don't fail the interest if notification fails
      }
      
      res.json(interest);
    } catch (error) {
      console.error("Express interest error:", error);
      res.status(500).json({ message: "Failed to express interest" });
    }
  });

  app.get("/api/posts/:id/interests", async (req, res) => {
    try {
      const interests = await storage.getPostInterests(req.params.id);
      res.json(interests);
    } catch (error) {
      console.error("Get post interests error:", error);
      res.status(500).json({ message: "Failed to get post interests" });
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
      
      // Send notification to receiver
      try {
        const sender = await storage.getUser(req.user.userId);
        const receiver = await storage.getUser(messageData.receiverId);
        
        if (sender && receiver) {
          // Get the notification service from the app
          const notificationService = (req.app as any).notificationService;
          
          if (notificationService) {
            notificationService.sendNotification(messageData.receiverId, {
              type: 'new_message',
              messageId: message.id,
              senderId: req.user.userId,
              senderName: sender.fullName || sender.email,
              content: messageData.content,
              timestamp: message.createdAt,
              conversationId: messageData.receiverId,
              receiverId: messageData.receiverId,
            });
          }
        }
      } catch (notificationError) {
        console.error("Notification error:", notificationError);
        // Don't fail the message send if notification fails
      }
      
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

  // File upload routes
  app.post("/api/messages/upload", authenticateToken, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { receiverId } = req.body;
      if (!receiverId) {
        return res.status(400).json({ message: "Receiver ID is required" });
      }

      // Create file URL
      const fileUrl = `/uploads/${req.file.filename}`;
      
      // Create message with file
      const messageData = {
        senderId: req.user.userId,
        receiverId: receiverId,
        content: req.file.originalname, // Use original filename as content
        messageType: 'file',
        fileUrl: fileUrl,
      };
      
      const message = await storage.createMessage(messageData);
      
      // Send notification to receiver
      try {
        const sender = await storage.getUser(req.user.userId);
        const receiver = await storage.getUser(receiverId);
        
        if (sender && receiver) {
          const notificationService = (req.app as any).notificationService;
          
          if (notificationService) {
            notificationService.sendNotification(receiverId, {
              type: 'new_message',
              messageId: message.id,
              senderId: req.user.userId,
              senderName: sender.fullName || sender.email,
              content: `Sent a file: ${req.file.originalname}`,
              timestamp: message.createdAt,
              conversationId: receiverId,
              receiverId: receiverId,
            });
          }
        }
      } catch (notificationError) {
        console.error("Notification error:", notificationError);
      }
      
      res.json({
        ...message,
        file: {
          originalName: req.file.originalname,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
          url: fileUrl
        }
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // General file upload endpoint
  app.post("/api/upload", authenticateToken, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Create file URL
      const fileUrl = `/uploads/${req.file.filename}`;
      
      res.json({
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  }, express.static(path.join(__dirname, '../uploads')));

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
      const user = await storage.getUser(req.user.userId);
      
      if (user?.userType === 'investor') {
        // For investors, return their own interests
        const interests = await storage.getUserInterests(req.user.userId);
        res.json(interests);
      } else if (user?.userType === 'entrepreneur') {
        // For entrepreneurs, return interests in their posts/listings
        const posts = await storage.getUserPosts(req.user.userId);
        const listings = await storage.getUserListings(req.user.userId);
        
        // Get interests for all posts
        const postInterests = await Promise.all(
          posts.map(async (post: any) => {
            const interests = await storage.getPostInterests(post.id);
            return interests;
          })
        );
        
        // Get interests for all listings
        const listingInterests = await Promise.all(
          listings.map(async (listing: any) => {
            const interests = await storage.getListingInterests(listing.id);
            return interests;
          })
        );
        
        // Flatten and combine all interests
        const allInterests = [
          ...postInterests.flat(),
          ...listingInterests.flat()
        ];
        
        res.json(allInterests);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error("Get user interests error:", error);
      res.status(500).json({ message: "Failed to get user interests" });
    }
  });

  app.delete("/api/interests/:id", authenticateToken, async (req: any, res) => {
    try {
      const interestId = req.params.id;
      const interest = await storage.getInterestById(interestId);
      
      if (!interest) {
        return res.status(404).json({ message: "Interest not found" });
      }
      
      // Check if the user owns this interest
      if (interest.investorId !== req.user.userId) {
        return res.status(403).json({ message: "Not authorized to withdraw this interest" });
      }
      
      // Only allow withdrawal of pending interests
      if (interest.status !== 'pending') {
        return res.status(400).json({ message: "Can only withdraw pending interests" });
      }
      
      await storage.deleteInterest(interestId);
      res.json({ message: "Interest withdrawn successfully" });
    } catch (error) {
      console.error("Withdraw interest error:", error);
      res.status(500).json({ message: "Failed to withdraw interest" });
    }
  });

  app.get("/api/users/me/investment-stats", authenticateToken, async (req: any, res) => {
    try {
      const interests = await storage.getUserInterests(req.user.userId);
      
      // Calculate investment statistics
      const totalInterests = interests.length;
      const acceptedInterests = interests.filter((interest: any) => interest.status === 'accepted').length;
      const pendingInterests = interests.filter((interest: any) => interest.status === 'pending').length;
      const rejectedInterests = interests.filter((interest: any) => interest.status === 'rejected').length;
      
      // Calculate success rate
      const successRate = totalInterests > 0 ? Math.round((acceptedInterests / totalInterests) * 100) : 0;
      
      // Calculate portfolio value (estimated based on accepted investments)
      const portfolioValue = acceptedInterests * 250000; // ₹2.5L per accepted investment (average)
      
      // Get recent activity
      const recentInterests = interests
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      const stats = {
        totalInterests,
        acceptedInterests,
        pendingInterests,
        rejectedInterests,
        successRate,
        portfolioValue,
        recentActivity: recentInterests,
        monthlyGrowth: 12, // Percentage growth this month
        totalInvested: portfolioValue,
        averageInvestment: acceptedInterests > 0 ? portfolioValue / acceptedInterests : 0
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Get investment stats error:", error);
      res.status(500).json({ message: "Failed to get investment stats" });
    }
  });

  app.get("/api/users/me/saved", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      
      if (user?.userType === 'entrepreneur') {
        // For entrepreneurs, return their own posts that they might want to save/reference
        const posts = await storage.getUserPosts(req.user.userId);
        const savedPosts = posts.map((post: any) => ({
          id: post.id,
          type: 'post',
          title: post.title || 'Untitled Post',
          category: post.category,
          fundingMin: post.fundingMin,
          fundingMax: post.fundingMax,
          expectedRoi: post.expectedRoi,
          createdAt: post.createdAt,
          views: post.views || 0,
          likes: post.likes || 0,
          comments: post.comments || 0
        }));
        
        res.json(savedPosts);
      } else {
        // For investors, return posts they've liked or shown interest in
        const interests = await storage.getUserInterests(req.user.userId);
        const savedPosts = await Promise.all(
          interests.map(async (interest: any) => {
            let post = null;
            let business = null;
            
            if (interest.postId) {
              post = await storage.getPost(interest.postId);
            } else if (interest.listingId) {
              business = await storage.getBusinessListing(interest.listingId);
            }
            
            if (post) {
              return {
                id: post.id,
                type: 'post',
                title: post.title || 'Investment Opportunity',
                category: post.category,
                fundingMin: post.fundingMin,
                fundingMax: post.fundingMax,
                expectedRoi: post.expectedRoi,
                createdAt: post.createdAt,
                savedAt: interest.createdAt,
                status: interest.status,
                interestId: interest.id
              };
            } else if (business) {
              return {
                id: business.id,
                type: 'business',
                title: business.title || 'Business Listing',
                category: business.category,
                fundingMin: business.fundingMin,
                fundingMax: business.fundingMax,
                expectedRoi: business.expectedRoi,
                createdAt: business.createdAt,
                savedAt: interest.createdAt,
                status: interest.status,
                interestId: interest.id
              };
            }
            return null;
          })
        );
        
        // Filter out null values and sort by saved date
        const validSavedPosts = savedPosts
          .filter(post => post !== null)
          .sort((a: any, b: any) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
        
        res.json(validSavedPosts);
      }
    } catch (error) {
      console.error("Get saved opportunities error:", error);
      res.status(500).json({ message: "Failed to get saved opportunities" });
    }
  });

  app.delete("/api/users/me/saved/:id", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      const itemId = req.params.id;
      
      if (user?.userType === 'entrepreneur') {
        // For entrepreneurs, we can't really "unsave" their own posts
        // This would be more like archiving or hiding
        res.json({ message: "Item removed from saved list" });
      } else {
        // For investors, remove the interest (which effectively unsaves the item)
        const interests = await storage.getUserInterests(req.user.userId);
        const interest = interests.find((i: any) => 
          (i.postId === itemId || i.listingId === itemId)
        );
        
        if (interest) {
          await storage.deleteInterest(interest.id);
          res.json({ message: "Item removed from saved list" });
        } else {
          res.status(404).json({ message: "Item not found in saved list" });
        }
      }
    } catch (error) {
      console.error("Remove from saved error:", error);
      res.status(500).json({ message: "Failed to remove item from saved list" });
    }
  });

  app.get("/api/users/me/analytics", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      const timeRange = req.query.timeRange || '30d';
      
      if (user?.userType === 'entrepreneur') {
        // Get entrepreneur analytics (posts, views, engagement)
        const posts = await storage.getUserPosts(req.user.userId);
        const totalViews = posts.reduce((sum: number, post: any) => sum + (post.views || 0), 0);
        const totalLikes = posts.reduce((sum: number, post: any) => sum + (post.likes || 0), 0);
        const totalComments = posts.reduce((sum: number, post: any) => sum + (post.comments || 0), 0);
        
        const analytics = {
          overview: {
            totalViews,
            totalLikes,
            totalComments,
            engagementRate: posts.length > 0 ? Math.round(((totalLikes + totalComments) / posts.length) * 100) : 0,
            growthRate: 15
          },
          posts: posts.slice(0, 5).map((post: any) => ({
            id: post.id,
            title: post.title || 'Untitled Post',
            date: new Date(post.createdAt).toLocaleDateString(),
            views: post.views || 0,
            likes: post.likes || 0,
            comments: post.comments || 0
          })),
          demographics: {
            ageGroups: { "18-25": 25, "26-35": 45, "36-45": 20, "46+": 10 },
            locations: { "Mumbai": 30, "Delhi": 25, "Bangalore": 20, "Other": 25 }
          }
        };
        
        res.json(analytics);
      } else {
        // Get investor analytics (investment portfolio)
        const interests = await storage.getUserInterests(req.user.userId);
        const acceptedInterests = interests.filter((interest: any) => interest.status === 'accepted');
        const totalInvested = acceptedInterests.length * 250000; // ₹2.5L per investment
        const successRate = interests.length > 0 ? Math.round((acceptedInterests.length / interests.length) * 100) : 0;
        
                 // Calculate real portfolio metrics based on actual investments
         const portfolioData = await calculatePortfolioMetrics(acceptedInterests);
         
         const analytics = {
           overview: {
             totalInvested,
             totalInterests: interests.length,
             acceptedInvestments: acceptedInterests.length,
             successRate,
             portfolioGrowth: portfolioData.portfolioGrowth
           },
           investments: acceptedInterests.slice(0, 5).map((interest: any) => ({
             id: interest.id,
             title: interest.postId ? 'Investment Opportunity' : 'Business Listing',
             date: new Date(interest.createdAt).toLocaleDateString(),
             amount: 250000,
             status: 'Active',
             returns: portfolioData.averageReturn + '%'
           })),
           portfolio: portfolioData
         };
        
        res.json(analytics);
      }
    } catch (error) {
      console.error("Get analytics error:", error);
      res.status(500).json({ message: "Failed to get analytics" });
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

  // Call routes
  app.post("/api/calls/start", authenticateToken, async (req: any, res) => {
    try {
      const { receiverId } = req.body;
      const caller = await storage.getUser(req.user.userId);
      
      if (!caller) {
        return res.status(404).json({ message: "Caller not found" });
      }

      const callId = `call_${Date.now()}_${req.user.userId}_${receiverId}`;
      
      // Send call notification to receiver
      const notificationService = (req.app as any).notificationService;
      if (notificationService) {
        notificationService.sendCallNotification(receiverId, {
          type: 'incoming_call',
          callerId: req.user.userId,
          callerName: caller.fullName || caller.email,
          callId: callId,
          timestamp: new Date().toISOString(),
        });
      }
      
      res.json({ 
        callId,
        message: "Call initiated",
        caller: {
          id: caller.id,
          name: caller.fullName || caller.email
        }
      });
    } catch (error) {
      console.error("Start call error:", error);
      res.status(500).json({ message: "Failed to start call" });
    }
  });

  app.post("/api/calls/respond", authenticateToken, async (req: any, res) => {
    try {
      const { callId, response, callerId } = req.body; // response: 'accept' | 'reject'
      const responder = await storage.getUser(req.user.userId);
      
      if (!responder) {
        return res.status(404).json({ message: "Responder not found" });
      }

      // Send response to caller
      const notificationService = (req.app as any).notificationService;
      if (notificationService) {
        notificationService.sendCallNotification(callerId, {
          type: response === 'accept' ? 'call_accepted' : 'call_rejected',
          callerId: req.user.userId,
          callerName: responder.fullName || responder.email,
          callId: callId,
          timestamp: new Date().toISOString(),
        });
      }
      
      res.json({ 
        message: `Call ${response}ed`,
        responder: {
          id: responder.id,
          name: responder.fullName || responder.email
        }
      });
    } catch (error) {
      console.error("Call response error:", error);
      res.status(500).json({ message: "Failed to respond to call" });
    }
  });

  app.post("/api/calls/end", authenticateToken, async (req: any, res) => {
    try {
      const { callId, otherUserId } = req.body;
      
      // Send call ended notification to other user
      const notificationService = (req.app as any).notificationService;
      if (notificationService) {
        notificationService.sendCallNotification(otherUserId, {
          type: 'call_ended',
          callerId: req.user.userId,
          callerName: 'User',
          callId: callId,
          timestamp: new Date().toISOString(),
        });
      }
      
      res.json({ message: "Call ended" });
    } catch (error) {
      console.error("End call error:", error);
      res.status(500).json({ message: "Failed to end call" });
    }
  });

  const httpServer = createServer(app);
  
  // Store notification service in app for routes to access
  if (notificationService) {
    (app as any).notificationService = notificationService;
  }
  
  return httpServer;
}
