# Environment Setup Guide

## Problem: API Connection Refused

If you're seeing `ERR_CONNECTION_REFUSED` errors, it means the frontend cannot connect to the backend API.

## Solution

### Option 1: Start Backend Server (For Local Development)

1. Open a new terminal
2. Navigate to backend directory:
   ```bash
   cd kas_backend
   ```
3. Install dependencies (if not done):
   ```bash
   npm install
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```
5. Backend should be running on `http://localhost:5000`

### Option 2: Set Environment Variable (For Production or Custom Backend)

1. Create a `.env.local` file in the `kas_crm` folder:
   ```bash
   cd kas_crm
   ```

2. Add the following content:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```
   
   Or for production:
   ```env
   NEXT_PUBLIC_API_URL=https://kas-backend-n247.onrender.com/api
   ```

3. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```

### Option 3: Check Backend Status

1. Test if backend is running:
   ```bash
   curl http://localhost:5000/api/health
   ```
   
   Or open in browser: `http://localhost:5000/api/health`
   
   Should return: `{"status":"ok","message":"Damsole CRM Backend API is running"}`

## Quick Fix Checklist

- [ ] Backend server is running (`cd kas_backend && npm run dev`)
- [ ] Backend is accessible at `http://localhost:5000`
- [ ] `.env.local` file exists with `NEXT_PUBLIC_API_URL`
- [ ] Next.js dev server restarted after adding `.env.local`
- [ ] No firewall blocking port 5000

## Common Issues

### Issue: "Cannot connect to backend"
**Fix:** Start the backend server first

### Issue: "Backend running but still getting errors"
**Fix:** 
1. Check backend is on port 5000
2. Check CORS is configured in backend
3. Verify `.env.local` has correct URL

### Issue: "Works locally but not in production"
**Fix:** Set `NEXT_PUBLIC_API_URL` in your hosting platform's environment variables (Netlify, Vercel, etc.)

