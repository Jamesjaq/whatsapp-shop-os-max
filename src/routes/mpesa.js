import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger, logPayment } from '../utils/logger.js';
import { handleMpesaCallback, verifyWebhookSignature } from '../services/mpesa.js';

const router = express.Router();

/**
 * M-Pesa payment callback
 */
router.post(
  '/callback',
  asyncHandler(async (req, res) => {
    const body = req.body;
    const signature = req.headers['x-mpesa-signature'];

    // Acknowledge receipt immediately
    res.status(200).json({ success: true });

    try {
      // Verify webhook signature
      if (!verifyWebhookSignature(body, signature)) {
        logger.warn('Invalid M-Pesa webhook signature');
        return;
      }

      // Process callback
      await handleMpesaCallback(body);
    } catch (error) {
      logger.error('Error processing M-Pesa callback:', error);
    }
  })
);

/**
 * M-Pesa timeout callback
 */
router.post(
  '/timeout',
  asyncHandler(async (req, res) => {
    const body = req.body;

    logger.warn('M-Pesa timeout callback received', body);

    // Acknowledge receipt
    res.status(200).json({ success: true });

    // Handle timeout (payment may still be processing)
    // TODO: Implement timeout handling logic
  })
);

/**
 * M-Pesa confirmation callback
 */
router.post(
  '/confirmation',
  asyncHandler(async (req, res) => {
    const body = req.body;

    logger.info('M-Pesa confirmation callback received', body);

    // Acknowledge receipt
    res.status(200).json({ success: true });

    // Handle confirmation
    // TODO: Implement confirmation handling logic
  })
);

/**
 * Check payment status
 */
router.get(
  '/status/:reference',
  asyncHandler(async (req, res) => {
    const { reference } = req.params;

    try {
      // Query payment from database
      const { query } = await import('../services/database.js');
      const payment = await query(
        'SELECT * FROM payments WHERE reference = ?',
        [reference]
      );

      if (!payment.length) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found',
        });
      }

      res.json({
        success: true,
        data: payment[0],
      });
    } catch (error) {
      logger.error('Failed to get payment status:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  })
);

export default router;
