/**
 * Simple Server to test basic setup
 */

import express from 'express';
import 'reflect-metadata';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Notice API is running!',
    version: '2.0.0',
    status: 'OK'
  });
});

app.listen(PORT, () => {
  console.log(`✓ Server is running on port ${PORT}`);
  console.log(`✓ Visit http://localhost:${PORT}`);
});