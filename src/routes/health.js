import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getMetrics, getAlerts } from '../services/monitoring.js';
import { query } from '../services/database.js';

const router = express.Router();

/**
 * Get system health
 */
router.get(
  '/system',
  asyncHandler(async (req, res) => {
    try {
      // Check database
      await query('SELECT 1');

      const metrics = getMetrics();
      const alerts = getAlerts();

      res.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          metrics,
          alerts: alerts.length,
        },
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: 'System unhealthy',
        details: error.message,
      });
    }
  })
);

/**
 * Get metrics
 */
router.get(
  '/metrics',
  asyncHandler(async (req, res) => {
    const metrics = getMetrics();

    res.json({
      success: true,
      data: metrics,
    });
  })
);

/**
 * Get alerts
 */
router.get(
  '/alerts',
  asyncHandler(async (req, res) => {
    const alerts = getAlerts();

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  })
);

/**
 * Get database stats
 */
router.get(
  '/database',
  asyncHandler(async (req, res) => {
    try {
      const stats = {
        sellers: await query('SELECT COUNT(*) as count FROM sellers'),
        buyers: await query('SELECT COUNT(*) as count FROM buyers'),
        riders: await query('SELECT COUNT(*) as count FROM riders'),
        orders: await query('SELECT COUNT(*) as count FROM orders'),
        products: await query('SELECT COUNT(*) as count FROM products'),
        disputes: await query('SELECT COUNT(*) as count FROM disputes'),
        payments: await query('SELECT COUNT(*) as count FROM payments'),
      };

      res.json({
        success: true,
        data: {
          sellers: stats.sellers[0].count,
          buyers: stats.buyers[0].count,
          riders: stats.riders[0].count,
          orders: stats.orders[0].count,
          products: stats.products[0].count,
          disputes: stats.disputes[0].count,
          payments: stats.payments[0].count,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  })
);

/**
 * Get payment stats
 */
router.get(
  '/payments',
  asyncHandler(async (req, res) => {
    try {
      const stats = await query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(amount) as total_amount
        FROM payments
        WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `);

      const successRate = stats[0].total > 0
        ? ((stats[0].confirmed / stats[0].total) * 100).toFixed(2)
        : 0;

      res.json({
        success: true,
        data: {
          total: stats[0].total,
          confirmed: stats[0].confirmed,
          failed: stats[0].failed,
          pending: stats[0].pending,
          totalAmount: stats[0].total_amount,
          successRate: `${successRate}%`,
          period: 'Last 24 hours',
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  })
);

export default router;
