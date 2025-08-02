#!/usr/bin/env node

/**
 * Keep-Alive Script for Render Free Tier
 * 
 * This script pings your Render service every 14 minutes to prevent it from going idle.
 * You can run this script on:
 * - Your local machine (while it's running)
 * - Another free service like Railway, Heroku, or even another Render instance
 * - A GitHub Action (see .github/workflows/keep-alive.yml)
 * 
 * Usage:
 * 1. Set your RENDER_URL environment variable
 * 2. Run: node keep-alive.js
 */

const RENDER_URL = process.env.RENDER_URL || 'https://your-app-name.onrender.com';
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes
const INITIAL_DELAY = 60 * 1000; // 1 minute

console.log(`🚀 Keep-Alive Service Started`);
console.log(`📍 Target URL: ${RENDER_URL}`);
console.log(`⏰ Ping Interval: ${PING_INTERVAL / 1000 / 60} minutes`);
console.log(`🕐 Started at: ${new Date().toISOString()}`);

const pingService = async () => {
  try {
    const startTime = Date.now();
    const response = await fetch(`${RENDER_URL}/health`);
    const endTime = Date.now();
    const duration = endTime - startTime;

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Ping successful (${duration}ms) - ${new Date().toISOString()}`);
      console.log(`   Status: ${data.status}, Uptime: ${Math.round(data.uptime / 60)} minutes`);
    } else {
      console.log(`❌ Ping failed with status ${response.status} - ${new Date().toISOString()}`);
    }
  } catch (error) {
    console.log(`💥 Ping error: ${error.message} - ${new Date().toISOString()}`);
  }
};

// Initial ping after delay
setTimeout(() => {
  console.log(`🔄 Starting first ping...`);
  pingService();
}, INITIAL_DELAY);

// Regular pings
setInterval(() => {
  pingService();
}, PING_INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n🛑 Keep-Alive Service Stopped`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n🛑 Keep-Alive Service Stopped`);
  process.exit(0);
}); 