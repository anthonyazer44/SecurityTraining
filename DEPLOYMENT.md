# Starcomm Training System - Render Deployment Guide

## Prerequisites
- GitHub account
- Render account (free tier available)

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it: `starcomm-training-system`
3. Make it public (required for Render free tier)
4. Don't initialize with README (we already have one)

## Step 2: Push Code to GitHub

```bash
# Add the GitHub repository as remote origin
git remote add origin https://github.com/YOUR_USERNAME/starcomm-training-system.git

# Push the code
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository: `starcomm-training-system`
4. Configure the service:
   - **Name**: `starcomm-training-system`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT src.main:app`
   - **Instance Type**: `Free`

## Step 4: Add PostgreSQL Database

1. In Render Dashboard, click "New +" and select "PostgreSQL"
2. Configure the database:
   - **Name**: `starcomm-db`
   - **Database Name**: `starcomm_training`
   - **User**: `starcomm_user`
   - **Instance Type**: `Free`

## Step 5: Connect Database to Web Service

1. Go to your web service settings
2. Add Environment Variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Select your PostgreSQL database from the dropdown

## Step 6: Deploy and Test

1. Click "Deploy Latest Commit"
2. Wait for deployment to complete
3. Access your application at the provided Render URL
4. Test login with the credentials shown in the deployment logs

## Default Credentials

The application will automatically create default companies on first startup:

- **Company 1**: TechCorp Solutions
- **Company 2**: Healthcare Plus

The passwords will be displayed in the deployment logs. Look for lines like:
```
Created company: ID=1, Name=TechCorp Solutions, Password=ABC123DEF456
```

## Master Admin Access

- **Username**: `admin`
- **Password**: `admin123`

## Features

- ✅ Three-tier portal system (Master Admin, Company Admin, Employee)
- ✅ PostgreSQL database with persistent storage
- ✅ Security features (rate limiting, password hashing, audit logging)
- ✅ Training modules with interactive quizzes
- ✅ Progress tracking and reporting
- ✅ Responsive design for mobile and desktop

## Support

If you encounter any issues during deployment, check the Render logs for error messages and ensure all environment variables are properly configured.

