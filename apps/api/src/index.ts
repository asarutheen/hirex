import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'hirex-api', 
    version: '0.0.1' 
  });
});

app.listen(PORT, () => {
  console.log(`HireX API running on port ${PORT}`);
});