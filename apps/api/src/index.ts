import './lib/env';

import express from "express";
import authRoutes from "./modules/auth/auth.routes";
import jobRoutes from "./modules/jobs/jobs.routes";
import aiRoutes from './modules/ai/ai.routes';
import resumeRoutes from './modules/resume/resume.routes';

console.log("JWT_SECRET loaded:", !!process.env.JWT_SECRET);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "hirex-api",
    version: "0.0.1",
  });
});

app.use("/api/auth", authRoutes);
console.log("Auth routes registered");

app.use("/api/jobs", jobRoutes);        
console.log("Job routes registered");

app.use('/api/ai', aiRoutes);
console.log("AI routes registered");

app.use('/api/resume', resumeRoutes);
console.log("Resume routes registered");

app.listen(PORT, () => {
  console.log(`HireX API running on port ${PORT}`);
});