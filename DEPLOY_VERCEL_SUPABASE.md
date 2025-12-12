# Deploying to Vercel with Supabase

This guide walks you through deploying your full-stack Angular + Node.js application to Vercel and setting up a free PostgreSQL database with Supabase.

## Part 1: Supabase Database Setup

1.  **Create Account/Project**:
    - Go to [Supabase.com](https://supabase.com/).
    - Sign up/Login and click **"New Project"**.
    - Choose an organization, a name (e.g., `IncomeTracker`), and a region near you.
    - **Important**: Generate a secure password and **save it**. You will need this.
    - Click **"Create new project"**.

2.  **Get Connection Details**:
    - There are two ways to find this:
        - **Option A (Easy)**: On the main Project Dashboard, look for a **"Connect"** button near the top right. Click it, select **"Node.js"**, and it will show you the connection string. You can extract the Host, User, and Databasename from there.
        - **Option B (Settings)**: 
            1. Click the **"Settings"** (Cog icon) at the bottom of the left sidebar.
            2. Click **"Database"** in the "Configuration" or "Project Settings" menu.
            3. Look for the **"Connection parameters"** section.
            4. **Note:** You might need to uncheck "Use connection pooling" to see port 5432, or use the Transaction Pooler (port 6543) if recommended.
            
    - Note down these values:
        - **Host** (e.g., `db.xyz.supabase.co`)
        - **Database Name** (Default is usually `postgres`).
        - **User** (Default is `postgres`).
        - **Port** (Default is `5432` or `6543`).
        - **Password** (The password you created in step 1. You cannot view this again, so you must have saved it).

## Part 2: Vercel Deployment

1.  **Import to Vercel**:
    - Go to [Vercel.com](https://vercel.com/).
    - Login with GitHub.
    - Click **"Add New..."** -> **"Project"**.
    - Find the `expense-income-tracker` repository and click **"Import"**.

2.  **Configure Project**:
    - **Framework Preset**: Vercel should auto-detect `Angular`. If not, select it.
    - **Build Command**: `ng build` (Default is usually correct).
    - **Output Directory**: `dist/income-expense-tracker/browser`.

3.  **Environment Variables**:
    - Expand the **"Environment Variables"** section.
    - Add the following variables using your Supabase details:

    | Name | Value Example |
    |------|---------------|
    | `NODE_ENV` | `production` |
    | `JWT_SECRET` | `add-a-long-random-string-here` |
    | `DB_HOST` | `aws-0-us-east-1.pooler.supabase.com` (Your Supabase Host) |
    | `DB_PORT` | `5432` (or 6543) |
    | `DB_USERNAME` | `postgres` |
    | `DB_PASSWORD` | `your-supabase-db-password` |
    | `DB_NAME` | `postgres` (Or whatever Supabase lists as the default DB name) |

    **Note**: You do *not* need to run a "Create Database" script. Since `DB_NAME` is set to an existing database (like `postgres`), the application will automatically create the necessary tables when it starts (because `synchronize: true` is enabled in the code).

4.  **Deploy**:
    - Click **"Deploy"**.

## Part 3: Verify

- Once verified, Vercel will give you a URL (e.g., `https://expense-income-tracker.vercel.app`).
- Open it. The frontend should load.
- If you can register/login, the database connection is working perfectly.
