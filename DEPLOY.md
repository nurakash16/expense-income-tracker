# Deployment Guide

This application is set up for a full-stack deployment where the Node.js backend serves the Angular frontend.

## Prerequisites

- Node.js (v18+)
- PostgreSQL Database

## Environment Variables

Ensure you have a `.env` file in the `backend` directory or set these environment variables in your production environment:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=income_tracker
JWT_SECRET=your_jwt_secret
```

## Build

To build both the Angular frontend and the backend TypeScript:

```bash
npm run build:all
```

This will:
1. Build the Angular app to `dist/income-expense-tracker/browser`.
2. Build the Backend app to `backend/dist`.

## Database Setup

To ensure the database exists (run this once):

```bash
cd backend
npm run db:create:prod
```

## Run

To start the application in production mode:

```bash
npm run start:prod
```

The application will be available at `http://localhost:3000` (or your specified PORT).
Top-level routes (like `/`) will serve the Angular app.
API routes are at `/api/...`.
