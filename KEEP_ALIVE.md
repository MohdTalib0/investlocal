# 🚀 Keep-Alive Solutions for Render Free Tier

Render's free tier automatically stops your service after 15 minutes of inactivity. Here are multiple solutions to keep your service running:

## 🎯 **Solution 1: Built-in Self-Ping (Recommended)**

Your server now includes a built-in keep-alive mechanism that automatically pings itself every 14 minutes.

### ✅ **What's Already Implemented:**
- **Health Check Endpoint**: `/health` - Returns service status
- **Ping Endpoint**: `/ping` - Simple pong response  
- **Root Endpoint**: `/` - Basic service info
- **Auto-Ping**: Self-pings every 14 minutes in production

### 🔧 **How It Works:**
```javascript
// Automatically starts in production
if (process.env.NODE_ENV === "production") {
  setInterval(keepAlive, 14 * 60 * 1000); // Every 14 minutes
}
```

## 🎯 **Solution 2: External Keep-Alive Script**

Run the included keep-alive script on your local machine or another service.

### 📝 **Usage:**
```bash
# Set your Render service URL
export RENDER_URL="https://your-app-name.onrender.com"

# Run the keep-alive script
npm run keep-alive
# or
node keep-alive.js
```

### 🖥️ **Run Locally:**
```bash
# In a separate terminal window
RENDER_URL=https://your-app-name.onrender.com node keep-alive.js
```

## 🎯 **Solution 3: GitHub Actions (Free & Reliable)**

GitHub Actions will automatically ping your service every 14 minutes.

### ⚙️ **Setup:**
1. **Add Repository Secret:**
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Add new secret: `RENDER_SERVICE_URL`
   - Value: `https://your-app-name.onrender.com`

2. **Enable Workflow:**
   - The workflow is already created at `.github/workflows/keep-alive.yml`
   - It will automatically start running

### 📊 **GitHub Actions Benefits:**
- ✅ **Completely Free** (2000 minutes/month)
- ✅ **Reliable** - Runs on GitHub's infrastructure
- ✅ **Automatic** - No manual intervention needed
- ✅ **Monitoring** - See ping history in Actions tab

## 🎯 **Solution 4: External Ping Services**

Use free external services to ping your endpoint:

### 🌐 **Free Ping Services:**
- **UptimeRobot**: https://uptimerobot.com (50 monitors free)
- **Pingdom**: https://pingdom.com (1 monitor free)
- **StatusCake**: https://statuscake.com (10 monitors free)

### 🔗 **Ping URLs to Use:**
```
https://your-app-name.onrender.com/health
https://your-app-name.onrender.com/ping
https://your-app-name.onrender.com/
```

## 🎯 **Solution 5: Multiple Render Services**

Create a second free Render service that pings your main service.

### 📁 **Create `ping-service` folder:**
```javascript
// ping-service/index.js
const RENDER_URL = process.env.RENDER_URL || 'https://your-main-app.onrender.com';

setInterval(async () => {
  try {
    await fetch(`${RENDER_URL}/health`);
    console.log('Ping successful:', new Date().toISOString());
  } catch (error) {
    console.log('Ping failed:', error.message);
  }
}, 14 * 60 * 1000);
```

## 📊 **Monitoring Your Service**

### 🔍 **Check Service Status:**
```bash
# Health check
curl https://your-app-name.onrender.com/health

# Simple ping
curl https://your-app-name.onrender.com/ping

# Service info
curl https://your-app-name.onrender.com/
```

### 📈 **Expected Responses:**

**Health Check:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

**Ping:**
```
pong
```

**Root:**
```json
{
  "message": "CityFund API is running",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🚨 **Troubleshooting**

### ❌ **Service Still Stopping?**
1. **Check Logs**: View Render dashboard logs
2. **Verify Endpoints**: Test health endpoints manually
3. **Check Environment**: Ensure `NODE_ENV=production`
4. **Monitor GitHub Actions**: Check if pings are successful

### 🔧 **Common Issues:**
- **Wrong URL**: Double-check your Render service URL
- **Environment Variable**: Ensure `RENDER_EXTERNAL_URL` is set
- **GitHub Secret**: Verify `RENDER_SERVICE_URL` secret is set
- **CORS Issues**: Health endpoints don't require CORS

## 🎯 **Recommended Setup**

For maximum reliability, use **multiple solutions**:

1. ✅ **Built-in self-ping** (automatic)
2. ✅ **GitHub Actions** (free & reliable)
3. ✅ **External ping service** (backup)

This ensures your service stays alive even if one method fails!

## 📝 **Environment Variables**

Add these to your Render service:

```bash
NODE_ENV=production
RENDER_EXTERNAL_URL=https://your-app-name.onrender.com
```

## 🎉 **Result**

With these solutions in place, your Render free tier service will:
- ✅ **Stay alive 24/7**
- ✅ **Respond quickly** to requests
- ✅ **Maintain uptime** without manual intervention
- ✅ **Save money** by staying on free tier

---

**💡 Pro Tip**: The built-in self-ping + GitHub Actions combination provides excellent reliability for free! 