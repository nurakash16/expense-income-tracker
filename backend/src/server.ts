import 'reflect-metadata';
import path from 'path';
import express from 'express';
import { connectDB } from './config/db';
import { scheduleWeeklyRollupJob } from './jobs/rollup.job';
import app from './app';

// Serve Static Frontend (Only in server.ts, not in app.ts which is used by Vercel)
const frontendPath = path.join(__dirname, '../../dist/income-expense-tracker/browser');
app.use(express.static(frontendPath));

app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    scheduleWeeklyRollupJob();
    app.listen(PORT, () =>
      console.log(`Backend running at http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('Failed to connect to database', err);
    process.exit(1);
  });
