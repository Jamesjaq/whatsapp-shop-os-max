import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { handleWhatsAppMessage } from '../handlers/messageHandler.js';

const router = express.Router();

/**
 * WhatsApp webhook verification
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_TOKEN) {
    logger.info('WhatsApp webhook verified');
    res.status(200).send(challenge);
  } else {
    logger.warn('WhatsApp webhook verification failed');
    res.status(403).json({ error: 'Forbidden' });
  }
});

/**
 * WhatsApp webhook for incoming messages
 */
router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const body = req.body;

    // Acknowledge receipt immediately
    res.status(200).json({ success: true });

    // Process message asynchronously
    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];

      for (const entry of entries) {
        const changes = entry.changes || [];

        for (const change of changes) {
          if (change.field === 'messages') {
            const messages = change.value.messages || [];

            for (const message of messages) {
              try {
                await handleWhatsAppMessage(message, change.value);
              } catch (error) {
                logger.error('Error processing message:', error);
              }
            }
          }
        }
      }
    }
  })
);

/**
 * Send WhatsApp message
 */
router.post(
  '/send',
  asyncHandler(async (req, res) => {
    const { phone, message, type = 'text' } = req.body;

    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phone, message',
      });
    }

    try {
      const result = await sendWhatsAppMessage(phone, message, type);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to send WhatsApp message:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  })
);

/**
 * Get WhatsApp message status
 */
router.get(
  '/status/:messageId',
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    try {
      const status = await getWhatsAppMessageStatus(messageId);
      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error('Failed to get message status:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  })
);

/**
 * Send WhatsApp message (helper)
 */
async function sendWhatsAppMessage(phone, message, type = 'text') {
  const axios = (await import('axios')).default;

  const payload = {
    messaging_product: 'whatsapp',
    to: phone,
    type,
  };

  if (type === 'text') {
    payload.text = { body: message };
  } else if (type === 'template') {
    payload.template = message;
  } else if (type === 'image') {
    payload.image = message;
  }

  try {
    const response = await axios.post(
      `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info('WhatsApp message sent', {
      phone,
      messageId: response.data.messages[0].id,
    });

    return response.data;
  } catch (error) {
    logger.error('Failed to send WhatsApp message:', error);
    throw error;
  }
}

/**
 * Get WhatsApp message status (helper)
 */
async function getWhatsAppMessageStatus(messageId) {
  const axios = (await import('axios')).default;

  try {
    const response = await axios.get(
      `${process.env.WHATSAPP_API_URL}/${messageId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    logger.error('Failed to get message status:', error);
    throw error;
  }
}

export default router;
