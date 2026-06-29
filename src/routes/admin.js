import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * Admin routes (stub)
 */

router.get('/disputes', asyncHandler(async (req, res) => {
  res.json({ success: true, data: [] });
}));

router.get('/sellers', asyncHandler(async (req, res) => {
  res.json({ success: true, data: [] });
}));

router.get('/metrics', asyncHandler(async (req, res) => {
  res.json({ success: true, data: {} });
}));

export default router;
