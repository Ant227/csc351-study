# Deployment Guide

## Security Fix
The API key has been removed from the HTML files and moved to a secure serverless backend. This prevents the key from being exposed in the browser's developer tools.

## Local Development
1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Add your Anthropic API key to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```

3. To test locally, you'll need to run a local server since the API calls require HTTPS and a backend.

## Deployment to Vercel

### Step 1: Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import this repository

### Step 2: Add Environment Variable
1. In the Vercel dashboard, go to project Settings
2. Navigate to Environment Variables
3. Add a new variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** Your Anthropic API key (e.g., `sk-ant-api03-...`)
4. Make sure it's set for Production and Preview environments

### Step 3: Deploy
1. Vercel will automatically deploy when you push to the repository
2. Or manually trigger deployment from the Vercel dashboard

## How It Works
- The frontend at `/` is a static site with HTML/CSS/JS
- The `/api/feedback` endpoint is a serverless function that:
  - Receives the quiz feedback prompt from the browser
  - Securely calls the Anthropic API using the server-side API key
  - Returns the feedback to the browser
- The API key never leaves the server, so it's never exposed in the browser

## Testing the Setup
Once deployed to Vercel:
1. Visit your site
2. Take a quiz
3. Submit answers
4. The AI feedback should appear (calls `/api/feedback` securely)
