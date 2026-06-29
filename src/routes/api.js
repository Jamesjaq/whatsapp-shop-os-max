import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * API v1 routes (stub)
 */

router.get('/sellers', asyncHandler(async (req, res) => {
  res.json({ success: true, data: [] });
}));

router.get('/products', asyncHandler(async (req, res) => {
  res.json({ success: true, data: [] });
}));

router.get('/orders', asyncHandler(async (req, res) => {
  res.json({ success: true, data: [] });
}));

export default router;
