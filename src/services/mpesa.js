import axios from 'axios';
import crypto from 'crypto';
import { logger, logPayment } from '../utils/logger.js';
import { query, queryOne } from './database.js';

const MPESA_API_URL = process.env.MPESA_ENVIRONMENT === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

let accessToken = null;
let tokenExpiry = null;

/**
 * Get M-Pesa access token
 */
async function getAccessToken() {
  try {
    // Return cached token if still valid
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
      return accessToken;
    }

    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const response = await axios.get(
      `${MPESA_API_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
        timeout: 10000,
      }
    );

    accessToken = response.data.access_token;
    // Token expires in 3600 seconds, refresh after 3500 seconds
    tokenExpiry = Date.now() + 3500000;

    logger.info('M-Pesa access token obtained');
    return accessToken;
  } catch (error) {
    logger.error('Failed to get M-Pesa access token:', error);
    throw error;
  }
}

/**
 * Initiate STK push with exponential backoff retry
 */
export async function initiateStkPush(params, retryCount = 0) {
  const maxRetries = 5;
  const backoffDelays = [3000, 10000, 30000, 60000, 120000]; // ms

  try {
    const token = await getAccessToken();

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(params.amount),
      PartyA: params.phoneNumber,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: params.phoneNumber,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: params.accountReference,
      TransactionDesc: params.description,
    };

    const response = await axios.post(
      `${MPESA_API_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    logPayment({
      action: 'stk_push_initiated',
      reference: params.accountReference,
      amount: params.amount,
      phone: params.phoneNumber,
      responseCode: response.data.ResponseCode,
    });

    return response.data;
  } catch (error) {
    // Retry logic with exponential backoff
    if (retryCount < maxRetries) {
      const delay = backoffDelays[retryCount];
      logger.warn({
        action: 'stk_push_retry',
        reference: params.accountReference,
        attempt: retryCount + 1,
        maxRetries,
        delay,
        error: error.message,
      });

      // Wait and retry
      await new Promise((resolve) => setTimeout(resolve, delay));
      return initiateStkPush(params, retryCount + 1);
    }

    // Max retries exceeded
    logger.error({
      action: 'stk_push_failed',
      reference: params.accountReference,
      attempts: retryCount + 1,
      error: error.message,
    });

    throw error;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(body, signature) {
  try {
    const hash = crypto
      .createHmac('sha256', process.env.MPESA_WEBHOOK_TOKEN)
      .update(JSON.stringify(body))
      .digest('base64');

    return hash === signature;
  } catch (error) {
    logger.error('Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Handle M-Pesa callback
 */
export async function handleMpesaCallback(callbackData) {
  try {
    const result = callbackData.Body?.stkCallback;

    if (!result) {
      logger.warn('Invalid callback data structure');
      return false;
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = result;
    const accountReference = CallbackMetadata?.Item?.find(
      (item) => item.Name === 'AccountReference'
    )?.Value;

    logPayment({
      action: 'mpesa_callback_received',
      checkoutRequestId: CheckoutRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      accountReference,
    });

    // Check if payment was successful
    if (ResultCode === 0) {
      // Payment successful
      const mpesaReceiptNumber = CallbackMetadata?.Item?.find(
        (item) => item.Name === 'MpesaReceiptNumber'
      )?.Value;

      const transactionDate = CallbackMetadata?.Item?.find(
        (item) => item.Name === 'TransactionDate'
      )?.Value;

      const transactionAmount = CallbackMetadata?.Item?.find(
        (item) => item.Name === 'Amount'
      )?.Value;

      // Update order status
      await query(
        `UPDATE orders SET status = 'paid', payment_reference = ?, paid_at = NOW()
         WHERE order_id = ?`,
        [mpesaReceiptNumber, accountReference]
      );

      // Record payment
      await query(
        `INSERT INTO payments (reference, method, amount, order_id, status, mpesa_receipt_number, mpesa_transaction_id, confirmed_at)
         VALUES (?, 'mpesa', ?, ?, 'confirmed', ?, ?, NOW())`,
        [CheckoutRequestID, transactionAmount, accountReference, mpesaReceiptNumber, CheckoutRequestID]
      );

      logPayment({
        action: 'payment_confirmed',
        accountReference,
        amount: transactionAmount,
        mpesaReceipt: mpesaReceiptNumber,
      });

      return true;
    } else {
      // Payment failed
      logger.warn({
        action: 'payment_failed',
        accountReference,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
      });

      // Update order status
      await query(
        `UPDATE orders SET status = 'cancelled' WHERE order_id = ?`,
        [accountReference]
      );

      return false;
    }
  } catch (error) {
    logger.error('Error handling M-Pesa callback:', error);
    throw error;
  }
}

/**
 * Send refund
 */
export async function sendRefund(params, retryCount = 0) {
  const maxRetries = 3;
  const backoffDelays = [3000, 10000, 30000];

  try {
    const token = await getAccessToken();

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const payload = {
      Initiator: 'testapi',
      SecurityCredential: password,
      CommandID: 'BusinessPayBill',
      OriginalConversationID: params.originalConversationId,
      ConversationID: params.conversationId,
      OriginalReceipt: params.originalReceipt,
      Amount: Math.round(params.amount),
      PartyA: process.env.MPESA_SHORTCODE,
      PartyB: params.phoneNumber,
      Remarks: params.remarks || 'Refund',
      QueueTimeOutURL: process.env.MPESA_TIMEOUT_URL,
      ResultURL: process.env.MPESA_CALLBACK_URL,
    };

    const response = await axios.post(
      `${MPESA_API_URL}/mpesa/reversal/v1/submit`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    logPayment({
      action: 'refund_initiated',
      reference: params.originalReceipt,
      amount: params.amount,
      phone: params.phoneNumber,
    });

    return response.data;
  } catch (error) {
    if (retryCount < maxRetries) {
      const delay = backoffDelays[retryCount];
      logger.warn({
        action: 'refund_retry',
        reference: params.originalReceipt,
        attempt: retryCount + 1,
        delay,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendRefund(params, retryCount + 1);
    }

    logger.error('Refund failed:', error);
    throw error;
  }
}

export default {
  getAccessToken,
  initiateStkPush,
  verifyWebhookSignature,
  handleMpesaCallback,
  sendRefund,
};
