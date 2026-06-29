import { logger } from '../utils/logger.js';
import { query } from './database.js';

const metrics = {
  paymentSuccessRate: 0,
  paymentFailureCount: 0,
  orderCreationSuccessRate: 0,
  sellerResponseTime: 0,
  riderAssignmentSuccessRate: 0,
  disputeRate: 0,
  systemUptime: 100,
  apiResponseTime: 0,
  messageDeliverySuccessRate: 0,
};

const alerts = [];

/**
 * Start monitoring system
 */
export function startMonitoring() {
  // Run health checks every 5 minutes
  setInterval(healthCheck, 5 * 60 * 1000);

  // Run metrics collection every 1 minute
  setInterval(collectMetrics, 60 * 1000);

  // Run alert checks every 1 minute
  setInterval(checkAlerts, 60 * 1000);

  logger.info('Monitoring system started');
}

/**
 * Health check
 */
async function healthCheck() {
  try {
    // Check database
    await query('SELECT 1');
    logger.info('Health check passed');
  } catch (error) {
    logger.error('Health check failed:', error);
    createAlert('CRITICAL', 'Database health check failed', error.message);
  }
}

/**
 * Collect metrics
 */
async function collectMetrics() {
  try {
    // Payment success rate
    const paymentMetrics = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed
      FROM payments
      WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);

    if (paymentMetrics[0].total > 0) {
      metrics.paymentSuccessRate = (paymentMetrics[0].confirmed / paymentMetrics[0].total) * 100;
    }

    // Order creation success rate
    const orderMetrics = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status != 'cancelled' THEN 1 ELSE 0 END) as successful
      FROM orders
      WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);

    if (orderMetrics[0].total > 0) {
      metrics.orderCreationSuccessRate = (orderMetrics[0].successful / orderMetrics[0].total) * 100;
    }

    // Dispute rate
    const disputeMetrics = await query(`
      SELECT 
        COUNT(*) as total
      FROM disputes
      WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);

    const orderCount = await query(`
      SELECT COUNT(*) as total FROM orders
      WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);

    if (orderCount[0].total > 0) {
      metrics.disputeRate = (disputeMetrics[0].total / orderCount[0].total) * 100;
    }

    logger.info('Metrics collected', metrics);
  } catch (error) {
    logger.error('Error collecting metrics:', error);
  }
}

/**
 * Check alerts
 */
async function checkAlerts() {
  // Check payment success rate
  if (metrics.paymentSuccessRate < 95) {
    createAlert(
      'CRITICAL',
      'Payment success rate below threshold',
      `Current: ${metrics.paymentSuccessRate.toFixed(2)}%, Threshold: 95%`
    );
  }

  // Check dispute rate
  if (metrics.disputeRate > 5) {
    createAlert(
      'HIGH',
      'Dispute rate above threshold',
      `Current: ${metrics.disputeRate.toFixed(2)}%, Threshold: 5%`
    );
  }

  // Check order creation success rate
  if (metrics.orderCreationSuccessRate < 95) {
    createAlert(
      'HIGH',
      'Order creation success rate below threshold',
      `Current: ${metrics.orderCreationSuccessRate.toFixed(2)}%, Threshold: 95%`
    );
  }
}

/**
 * Create alert
 */
function createAlert(severity, title, message) {
  const alert = {
    id: Date.now(),
    severity,
    title,
    message,
    timestamp: new Date().toISOString(),
    acknowledged: false,
  };

  alerts.push(alert);

  // Log alert
  logger.warn({
    alert: {
      severity,
      title,
      message,
    },
  });

  // Send notification (implement based on your notification system)
  sendAlertNotification(alert);
}

/**
 * Send alert notification
 */
async function sendAlertNotification(alert) {
  try {
    // TODO: Implement notification (email, SMS, Slack, etc.)
    logger.info('Alert notification sent:', alert);
  } catch (error) {
    logger.error('Failed to send alert notification:', error);
  }
}

/**
 * Get current metrics
 */
export function getMetrics() {
  return { ...metrics };
}

/**
 * Get active alerts
 */
export function getAlerts() {
  return alerts.filter((a) => !a.acknowledged);
}

/**
 * Acknowledge alert
 */
export function acknowledgeAlert(alertId) {
  const alert = alerts.find((a) => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    logger.info('Alert acknowledged:', alertId);
  }
}

/**
 * Record metric
 */
export async function recordMetric(metricType, metricName, value, context = {}) {
  try {
    await query(
      `INSERT INTO metrics (metric_type, metric_name, metric_value, seller_id, buyer_phone, rider_phone, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        metricType,
        metricName,
        value,
        context.seller_id || null,
        context.buyer_phone || null,
        context.rider_phone || null,
      ]
    );
  } catch (error) {
    logger.error('Failed to record metric:', error);
  }
}

export default {
  startMonitoring,
  getMetrics,
  getAlerts,
  acknowledgeAlert,
  recordMetric,
};
