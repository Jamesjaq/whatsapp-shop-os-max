import { logger } from '../utils/logger.js';

/**
 * Handle incoming WhatsApp message
 */
export async function handleWhatsAppMessage(message, context) {
  try {
    const from = message.from;
    const messageType = message.type;
    const messageId = message.id;

    logger.info('WhatsApp message received', {
      from,
      type: messageType,
      id: messageId,
    });

    // Route based on message type
    switch (messageType) {
      case 'text':
        await handleTextMessage(message, context);
        break;
      case 'image':
        await handleImageMessage(message, context);
        break;
      case 'document':
        await handleDocumentMessage(message, context);
        break;
      case 'location':
        await handleLocationMessage(message, context);
        break;
      default:
        logger.warn('Unknown message type:', messageType);
    }
  } catch (error) {
    logger.error('Error handling WhatsApp message:', error);
  }
}

/**
 * Handle text message
 */
async function handleTextMessage(message, context) {
  const text = message.text.body;
  const from = message.from;

  logger.info('Text message:', { from, text });

  // TODO: Implement message parser and intent routing
  // - Seller onboarding
  // - Product management
  // - Buyer search
  // - Order management
  // - Dispute handling
}

/**
 * Handle image message
 */
async function handleImageMessage(message, context) {
  const imageId = message.image.id;
  const from = message.from;

  logger.info('Image message received', { from, imageId });

  // TODO: Implement image handling
  // - Product image upload
  // - Photo proof for delivery
}

/**
 * Handle document message
 */
async function handleDocumentMessage(message, context) {
  const documentId = message.document.id;
  const from = message.from;

  logger.info('Document message received', { from, documentId });

  // TODO: Implement document handling
  // - CSV import for products
}

/**
 * Handle location message
 */
async function handleLocationMessage(message, context) {
  const latitude = message.location.latitude;
  const longitude = message.location.longitude;
  const from = message.from;

  logger.info('Location message received', { from, latitude, longitude });

  // TODO: Implement location handling
  // - Store delivery location
  // - Update rider GPS
}

export default {
  handleWhatsAppMessage,
};
