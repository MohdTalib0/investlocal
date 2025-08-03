-- =====================================================
-- InvestLocal Investment Posts Database
-- =====================================================
-- This file contains sample investment posts for InvestLocal platform
-- Created for demonstration and testing purposes
-- =====================================================

-- Clear existing data (if any)
DELETE FROM post_likes WHERE post_id IN (SELECT id FROM posts WHERE post_type = 'investment');
DELETE FROM comments WHERE post_id IN (SELECT id FROM posts WHERE post_type = 'investment');
DELETE FROM interests WHERE post_id IN (SELECT id FROM posts WHERE post_type = 'investment');
DELETE FROM posts WHERE post_type = 'investment';
DELETE FROM business_listings;

-- =====================================================
-- SAMPLE USERS (Entrepreneurs and Investors)
-- =====================================================

-- Insert sample entrepreneurs
INSERT INTO users (id, email, password, full_name, phone, city, user_type, is_verified, bio) VALUES
('ent-001', 'rahul.sharma@techstartup.com', '$2b$10$hashedpassword', 'Rahul Sharma', '+91-9876543210', 'Mumbai', 'entrepreneur', true, 'Tech entrepreneur with 8+ years experience in fintech'),
('ent-002', 'priya.patel@foodtech.com', '$2b$10$hashedpassword', 'Priya Patel', '+91-9876543211', 'Delhi', 'entrepreneur', true, 'Food tech innovator passionate about sustainable agriculture'),
('ent-003', 'amit.kumar@healthtech.com', '$2b$10$hashedpassword', 'Amit Kumar', '+91-9876543212', 'Bangalore', 'entrepreneur', true, 'Healthcare technology expert with focus on telemedicine'),
('ent-004', 'neha.gupta@edutech.com', '$2b$10$hashedpassword', 'Neha Gupta', '+91-9876543213', 'Pune', 'entrepreneur', true, 'Education technology specialist with 5+ years in EdTech'),
('ent-005', 'vikram.singh@retailtech.com', '$2b$10$hashedpassword', 'Vikram Singh', '+91-9876543214', 'Chennai', 'entrepreneur', true, 'Retail technology innovator with expertise in e-commerce');

-- Insert sample investors
INSERT INTO users (id, email, password, full_name, phone, city, user_type, is_verified, bio, investment_amount, risk_tolerance, preferred_sectors, investment_horizon, experience_level) VALUES
('inv-001', 'rajesh.khanna@angelinvestor.com', '$2b$10$hashedpassword', 'Rajesh Khanna', '+91-9876543220', 'Mumbai', 'investor', true, 'Angel investor with 15+ years experience', '1000000-5000000', 'moderate', '["Tech Startups", "Fintech", "Healthtech"]', '3-5 years', 'expert'),
('inv-002', 'sunita.reddy@venturecapital.com', '$2b$10$hashedpassword', 'Sunita Reddy', '+91-9876543221', 'Delhi', 'investor', true, 'Venture capitalist specializing in early-stage startups', '5000000-20000000', 'high', '["Tech Startups", "EdTech", "Food & Beverage"]', '5-7 years', 'expert'),
('inv-003', 'arun.malhotra@seedfund.com', '$2b$10$hashedpassword', 'Arun Malhotra', '+91-9876543222', 'Bangalore', 'investor', true, 'Seed fund manager with focus on sustainable businesses', '500000-2000000', 'low', '["Agriculture", "Manufacturing", "Services"]', '2-4 years', 'intermediate');

-- =====================================================
-- INVESTMENT POSTS (New Posts Table Structure)
-- =====================================================

-- 1. FinTech Innovation Platform
INSERT INTO posts (id, author_id, post_type, title, content, category, images, funding_min, funding_max, use_of_funds, timeline, expected_roi, team_size, business_plan, status, views, likes, created_at) VALUES
('post-001', 'ent-001', 'investment', 'PaySmart - Digital Payment Solutions for SMEs', 
'We are developing an innovative digital payment platform specifically designed for small and medium enterprises (SMEs) in India. Our solution addresses the unique challenges faced by SMEs in adopting digital payments, including high transaction fees, complex integration processes, and limited access to financial services.

Key Features:
• Low-cost payment processing (0.5% vs industry average 2.5%)
• Simple API integration for existing business systems
• Multi-channel payment acceptance (UPI, cards, wallets)
• Real-time analytics and reporting dashboard
• Automated reconciliation and accounting integration

Market Opportunity:
• 63 million SMEs in India
• Only 15% currently use digital payments
• $2.3 trillion market opportunity by 2025

Our team has 8+ years of experience in fintech and has already secured partnerships with 3 major banks. We are looking for strategic investors who can help us scale rapidly and expand our market presence.',
'Tech Startups', 
'[]',
5000000, 15000000, 
'Product development (40%), Marketing and sales (30%), Team expansion (20%), Operations (10%)',
'18 months',
'25-35%',
8,
'https://investlocal.com/business-plans/paysmart-plan.pdf',
'approved', 1250, 89, '2024-01-15 10:30:00');

-- 2. Sustainable Agriculture Technology
INSERT INTO posts (id, author_id, post_type, title, content, category, images, funding_min, funding_max, use_of_funds, timeline, expected_roi, team_size, business_plan, status, views, likes, created_at) VALUES
('post-002', 'ent-002', 'investment', 'AgriTech Solutions - Smart Farming for Modern India', 
'AgriTech Solutions is revolutionizing traditional farming practices through IoT-based smart farming technology. Our platform helps farmers optimize crop yields, reduce water consumption, and increase profitability through data-driven insights.

Our Technology Stack:
• IoT sensors for soil monitoring and weather tracking
• AI-powered crop recommendation engine
• Mobile app for real-time farm management
• Integration with government subsidy programs
• Predictive analytics for market prices

Impact Metrics:
• 40% increase in crop yields for pilot farmers
• 60% reduction in water consumption
• 25% increase in farmer income
• 500+ farmers already using our platform

We have received recognition from the Ministry of Agriculture and have partnerships with 5 major agricultural universities. Our solution is particularly relevant given India''s focus on doubling farmer income by 2025.',
'Agriculture', 
'[]',
3000000, 8000000, 
'Technology development (35%), Field trials and validation (25%), Marketing and farmer outreach (25%), Team expansion (15%)',
'24 months',
'20-30%',
12,
'https://investlocal.com/business-plans/agritech-plan.pdf',
'approved', 890, 67, '2024-01-20 14:15:00');

-- 3. Healthcare Technology Platform
INSERT INTO posts (id, author_id, post_type, title, content, category, images, funding_min, funding_max, use_of_funds, timeline, expected_roi, team_size, business_plan, status, views, likes, created_at) VALUES
('post-003', 'ent-003', 'investment', 'MediConnect - Telemedicine Platform for Rural Healthcare', 
'MediConnect is addressing the critical healthcare gap in rural India through our comprehensive telemedicine platform. We connect rural patients with qualified doctors, provide remote diagnostics, and ensure timely medical care delivery.

Platform Features:
• Video consultations with certified doctors
• Remote diagnostic tools integration
• Electronic health records management
• Medicine delivery to remote locations
• Health awareness and preventive care programs

Market Analysis:
• 70% of India''s population lives in rural areas
• Only 25% have access to quality healthcare
• Telemedicine market expected to reach $5.4 billion by 2025
• Government support through Ayushman Bharat Digital Mission

We have already partnered with 50+ doctors and 10 rural healthcare centers. Our platform has served 2,000+ patients with 95% satisfaction rate.',
'Healthcare', 
'[]',
2000000, 6000000, 
'Platform development (40%), Doctor network expansion (30%), Rural outreach programs (20%), Regulatory compliance (10%)',
'18 months',
'30-40%',
10,
'https://investlocal.com/business-plans/mediconnect-plan.pdf',
'approved', 1100, 78, '2024-01-25 09:45:00');

-- 4. Education Technology Platform
INSERT INTO posts (id, author_id, post_type, title, content, category, images, funding_min, funding_max, use_of_funds, timeline, expected_roi, team_size, business_plan, status, views, likes, created_at) VALUES
('post-004', 'ent-004', 'investment', 'EduTech Pro - Personalized Learning Platform', 
'EduTech Pro is transforming education through AI-powered personalized learning experiences. Our platform adapts to each student''s learning style, pace, and preferences, making education more effective and engaging.

Key Innovations:
• AI-driven adaptive learning algorithms
• Personalized study plans and progress tracking
• Interactive content with gamification elements
• Real-time performance analytics
• Parent and teacher dashboard integration

Target Market:
• K-12 students across India
• 250+ million students in target demographic
• Growing demand for personalized education
• Government focus on digital education (NEP 2020)

We have successfully piloted our platform with 5 schools and 1,000+ students, showing 35% improvement in learning outcomes. Our team includes education experts and AI specialists.',
'Education', 
'[]',
1500000, 4000000, 
'Product development (45%), Content creation (25%), School partnerships (20%), Marketing (10%)',
'12 months',
'25-35%',
15,
'https://investlocal.com/business-plans/edutech-plan.pdf',
'approved', 750, 45, '2024-02-01 11:20:00');

-- 5. Retail Technology Solution
INSERT INTO posts (id, author_id, post_type, title, content, category, images, funding_min, funding_max, use_of_funds, timeline, expected_roi, team_size, business_plan, status, views, likes, created_at) VALUES
('post-005', 'ent-005', 'investment', 'RetailTech Solutions - Omnichannel Retail Platform', 
'RetailTech Solutions is helping traditional retailers compete with e-commerce giants through our comprehensive omnichannel platform. We provide inventory management, customer analytics, and seamless online-offline integration.

Platform Capabilities:
• Unified inventory management across all channels
• Customer behavior analytics and personalized marketing
• Mobile app for customers with loyalty programs
• Integration with major e-commerce platforms
• Real-time sales and performance dashboards

Market Opportunity:
• 15 million+ retail stores in India
• 90% still operate offline only
• $1.2 trillion retail market
• Rapid digital transformation post-COVID

We have successfully onboarded 200+ retail stores with average 40% increase in sales. Our solution is particularly valuable for small and medium retailers looking to digitize.',
'Retail', 
'[]',
1000000, 3000000, 
'Platform enhancement (40%), Sales and marketing (35%), Customer support (15%), Operations (10%)',
'15 months',
'20-30%',
8,
'https://investlocal.com/business-plans/retailtech-plan.pdf',
'approved', 620, 38, '2024-02-05 16:30:00');

-- =====================================================
-- LEGACY BUSINESS LISTINGS (Backward Compatibility)
-- =====================================================

-- 1. Food & Beverage Innovation
INSERT INTO business_listings (id, entrepreneur_id, title, description, category, funding_min, funding_max, use_of_funds, timeline, expected_roi, team_size, images, business_plan, status, views, created_at) VALUES
('listing-001', 'ent-002', 'Organic Food Delivery Network', 
'Building a network of organic food producers and delivery services to provide fresh, healthy food to urban consumers. Our platform connects local farmers with consumers, ensuring fair prices and sustainable practices.',
'Food & Beverage', 2000000, 5000000, 
'Farmer partnerships (40%), Technology platform (30%), Marketing (20%), Operations (10%)',
'18 months', '22-28%', 6,
'[]',
'https://investlocal.com/business-plans/organic-food-plan.pdf',
'approved', 450, '2024-01-10 13:20:00');

-- 2. Manufacturing Innovation
INSERT INTO business_listings (id, entrepreneur_id, title, description, category, funding_min, funding_max, use_of_funds, timeline, expected_roi, team_size, images, business_plan, status, views, created_at) VALUES
('listing-002', 'ent-001', 'Smart Manufacturing Solutions', 
'Developing IoT-based solutions for manufacturing efficiency and quality control. Our sensors and analytics platform help manufacturers reduce waste, improve quality, and increase productivity.',
'Manufacturing', 5000000, 12000000, 
'R&D and product development (50%), Pilot programs (25%), Sales and marketing (15%), Operations (10%)',
'24 months', '30-40%', 10,
'[]',
'https://investlocal.com/business-plans/smart-manufacturing-plan.pdf',
'approved', 380, '2024-01-12 10:15:00');

-- =====================================================
-- SAMPLE ENGAGEMENT DATA
-- =====================================================

-- Post Likes
INSERT INTO post_likes (id, user_id, post_id, created_at) VALUES
('like-001', 'inv-001', 'post-001', '2024-01-16 14:30:00'),
('like-002', 'inv-002', 'post-001', '2024-01-16 15:45:00'),
('like-003', 'inv-003', 'post-001', '2024-01-17 09:20:00'),
('like-004', 'inv-001', 'post-002', '2024-01-21 11:15:00'),
('like-005', 'inv-002', 'post-002', '2024-01-21 16:30:00'),
('like-006', 'inv-001', 'post-003', '2024-01-26 13:45:00'),
('like-007', 'inv-003', 'post-003', '2024-01-27 10:20:00'),
('like-008', 'inv-002', 'post-004', '2024-02-02 14:10:00'),
('like-009', 'inv-001', 'post-005', '2024-02-06 11:30:00');

-- Comments
INSERT INTO comments (id, user_id, post_id, content, created_at) VALUES
('comment-001', 'inv-001', 'post-001', 'Excellent business model! The fintech space is booming and your approach to SME payments is unique. Would love to discuss potential partnership opportunities.', '2024-01-16 15:00:00'),
('comment-002', 'inv-002', 'post-001', 'Impressive traction and market opportunity. The 0.5% transaction fee is very competitive. What''s your customer acquisition strategy?', '2024-01-16 16:30:00'),
('comment-003', 'ent-002', 'post-002', 'Thank you for the interest! We''re particularly excited about the government support for agritech. Our pilot results have been very promising.', '2024-01-21 12:00:00'),
('comment-004', 'inv-003', 'post-003', 'Healthcare accessibility in rural areas is a critical need. Your telemedicine approach is innovative. What''s your regulatory compliance strategy?', '2024-01-26 14:15:00'),
('comment-005', 'inv-001', 'post-004', 'Personalized learning is the future of education. Your AI-driven approach is impressive. How do you plan to scale across different educational boards?', '2024-02-02 15:20:00');

-- Investment Interests
INSERT INTO interests (id, investor_id, post_id, message, status, created_at) VALUES
('interest-001', 'inv-001', 'post-001', 'Interested in discussing investment opportunities. Your fintech solution addresses a real market need. Would like to schedule a call to discuss details.', 'pending', '2024-01-16 16:00:00'),
('interest-002', 'inv-002', 'post-001', 'Very impressed with your business model and team. Looking to invest in the range of 5-8 crores. Let''s discuss partnership terms.', 'pending', '2024-01-17 10:30:00'),
('interest-003', 'inv-003', 'post-002', 'Sustainable agriculture is a priority area for our fund. Your IoT-based approach is innovative. Interested in potential collaboration.', 'pending', '2024-01-22 14:45:00'),
('interest-004', 'inv-001', 'post-003', 'Healthcare technology is a growing sector. Your rural focus is commendable. Would like to explore investment opportunities.', 'pending', '2024-01-27 11:20:00'),
('interest-005', 'inv-002', 'post-004', 'EdTech is one of our focus areas. Your personalized learning platform shows great potential. Let''s discuss investment terms.', 'pending', '2024-02-03 09:15:00');

-- =====================================================
-- QUERIES FOR INVESTMENT POSTS ANALYSIS
-- =====================================================

-- Query 1: All Investment Posts with Author Information
/*
SELECT 
    p.id,
    p.title,
    p.content,
    p.category,
    p.funding_min,
    p.funding_max,
    p.expected_roi,
    p.team_size,
    p.views,
    p.likes,
    p.created_at,
    u.full_name as author_name,
    u.user_type as author_type,
    u.city as author_city
FROM posts p
JOIN users u ON p.author_id = u.id
WHERE p.post_type = 'investment'
ORDER BY p.created_at DESC;
*/

-- Query 2: Investment Posts by Category
/*
SELECT 
    category,
    COUNT(*) as total_posts,
    AVG(funding_min) as avg_min_funding,
    AVG(funding_max) as avg_max_funding,
    AVG(expected_roi::numeric) as avg_roi
FROM posts 
WHERE post_type = 'investment'
GROUP BY category
ORDER BY total_posts DESC;
*/

-- Query 3: Most Popular Investment Posts
/*
SELECT 
    p.title,
    p.category,
    p.views,
    p.likes,
    COUNT(c.id) as comment_count,
    COUNT(i.id) as interest_count,
    u.full_name as author_name
FROM posts p
JOIN users u ON p.author_id = u.id
LEFT JOIN comments c ON p.id = c.post_id
LEFT JOIN interests i ON p.id = i.post_id
WHERE p.post_type = 'investment'
GROUP BY p.id, p.title, p.category, p.views, p.likes, u.full_name
ORDER BY p.views DESC, p.likes DESC;
*/

-- Query 4: Investment Posts with Engagement Metrics
/*
SELECT 
    p.title,
    p.category,
    p.funding_min,
    p.funding_max,
    p.expected_roi,
    p.views,
    p.likes,
    COUNT(DISTINCT pl.user_id) as unique_likers,
    COUNT(DISTINCT c.user_id) as unique_commenters,
    COUNT(DISTINCT i.investor_id) as interested_investors
FROM posts p
LEFT JOIN post_likes pl ON p.id = pl.post_id
LEFT JOIN comments c ON p.id = c.post_id
LEFT JOIN interests i ON p.id = i.post_id
WHERE p.post_type = 'investment'
GROUP BY p.id, p.title, p.category, p.funding_min, p.funding_max, p.expected_roi, p.views, p.likes
ORDER BY p.views DESC;
*/

-- =====================================================
-- SUMMARY STATISTICS
-- =====================================================

/*
-- Total Investment Posts: 5
-- Total Funding Range: ₹1,000,000 - ₹15,000,000
-- Average Expected ROI: 25-35%
-- Categories Covered: Tech Startups, Agriculture, Healthcare, Education, Retail
-- Total Views: 4,610
-- Total Likes: 317
-- Total Comments: 5
-- Total Investment Interests: 5
-- Active Investors: 3
-- Active Entrepreneurs: 5
*/

-- =====================================================
-- END OF INVESTLOCAL INVESTMENT POSTS DATA
-- ===================================================== 