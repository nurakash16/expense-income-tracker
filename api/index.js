require('reflect-metadata');

const app = require('../backend/dist/app').default;
const { connectDB } = require('../backend/dist/config/db');

// Reuse connection across warm invocations
let dbReady;

module.exports = async (req, res) => {
  try {
    if (!dbReady) dbReady = connectDB();
    await dbReady;
    return app(req, res);
  } catch (e) {
    console.error('SERVER ERROR:', e);
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
};
