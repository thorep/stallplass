import { Payment, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Vipps API configuration - using function to ensure runtime evaluation
const getVippsConfig = () => ({
  VIPPS_API_URL: process.env.VIPPS_API_URL || 'https://apitest.vipps.no',
  VIPPS_CLIENT_ID: process.env.VIPPS_CLIENT_ID,
  VIPPS_CLIENT_SECRET: process.env.VIPPS_CLIENT_SECRET,
  VIPPS_SUBSCRIPTION_KEY: process.env.VIPPS_SUBSCRIPTION_KEY,
  VIPPS_MERCHANT_SERIAL_NUMBER: process.env.VIPPS_MERCHANT_SERIAL_NUMBER,
  VIPPS_CALLBACK_PREFIX: process.env.VIPPS_CALLBACK_PREFIX || 'http://localhost:3000',
  VIPPS_WEBHOOK_SECRET: process.env.VIPPS_WEBHOOK_SECRET
});

// For backward compatibility
const VIPPS_API_URL = process.env.VIPPS_API_URL || 'https://apitest.vipps.no';
const VIPPS_CLIENT_ID = process.env.VIPPS_CLIENT_ID!;
const VIPPS_CLIENT_SECRET = process.env.VIPPS_CLIENT_SECRET!;
const VIPPS_SUBSCRIPTION_KEY = process.env.VIPPS_SUBSCRIPTION_KEY!;
const VIPPS_MERCHANT_SERIAL_NUMBER = process.env.VIPPS_MERCHANT_SERIAL_NUMBER!;
const VIPPS_CALLBACK_PREFIX = process.env.VIPPS_CALLBACK_PREFIX || 'http://localhost:3000';
const VIPPS_WEBHOOK_SECRET = process.env.VIPPS_WEBHOOK_SECRET;

interface VippsAccessToken {
  token_type: string;
  expires_in: string;
  ext_expires_in: string;
  expires_on: string;
  not_before: string;
  resource: string;
  access_token: string;
}

interface VippsPaymentRequest {
  amount: {
    currency: string;
    value: number; // Amount in øre
  };
  paymentMethod: {
    type: 'WALLET';
  };
  reference: string;
  userFlow: 'WEB_REDIRECT';
  returnUrl: string;
  paymentDescription: string;
}

interface VippsPaymentResponse {
  reference: string;
  redirectUrl: string;
  pspReference?: string;
}

interface VippsPaymentStatus {
  reference: string;
  state: 'CREATED' | 'AUTHORIZED' | 'ABORTED' | 'EXPIRED' | 'TERMINATED';
  aggregate: {
    authorizedAmount: {
      currency: string;
      value: number;
    };
    capturedAmount: {
      currency: string;
      value: number;
    };
    refundedAmount: {
      currency: string;
      value: number;
    };
    cancelledAmount: {
      currency: string;
      value: number;
    };
  };
}

// Get Vipps access token
async function getAccessToken(): Promise<string> {
  const config = getVippsConfig();
  
  if (!config.VIPPS_CLIENT_ID || !config.VIPPS_CLIENT_SECRET || !config.VIPPS_SUBSCRIPTION_KEY || !config.VIPPS_MERCHANT_SERIAL_NUMBER) {
    throw new Error('Missing required Vipps configuration. Please check environment variables.');
  }
  
  const tokenUrl = `${config.VIPPS_API_URL}/accesstoken/get`;
  
  console.log('Getting Vipps access token from:', tokenUrl);
  console.log('Using MSN:', config.VIPPS_MERCHANT_SERIAL_NUMBER);
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'client_id': config.VIPPS_CLIENT_ID,
      'client_secret': config.VIPPS_CLIENT_SECRET,
      'Ocp-Apim-Subscription-Key': config.VIPPS_SUBSCRIPTION_KEY,
      'Merchant-Serial-Number': config.VIPPS_MERCHANT_SERIAL_NUMBER,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Access token error:', {
      status: response.status,
      error,
      url: tokenUrl
    });
    throw new Error(`Failed to get Vipps access token: ${error}`);
  }

  const data: VippsAccessToken = await response.json();
  return data.access_token;
}

// Create a Vipps payment for stable advertising
export async function createVippsPayment(
  userId: string,
  stableId: string,
  amount: number, // Amount in øre
  months: number,
  discount: number,
  description: string
): Promise<Payment> {
  try {
    // Get runtime config
    const config = getVippsConfig();
    
    // Log environment check
    console.log('Vipps environment check:', {
      hasApiUrl: !!config.VIPPS_API_URL,
      hasClientId: !!config.VIPPS_CLIENT_ID,
      hasClientSecret: !!config.VIPPS_CLIENT_SECRET,
      hasSubscriptionKey: !!config.VIPPS_SUBSCRIPTION_KEY,
      hasMSN: !!config.VIPPS_MERCHANT_SERIAL_NUMBER,
      apiUrl: config.VIPPS_API_URL,
      msn: config.VIPPS_MERCHANT_SERIAL_NUMBER,
      callbackPrefix: config.VIPPS_CALLBACK_PREFIX
    });
    
    // Validate required config
    if (!config.VIPPS_CLIENT_ID || !config.VIPPS_CLIENT_SECRET || !config.VIPPS_SUBSCRIPTION_KEY || !config.VIPPS_MERCHANT_SERIAL_NUMBER) {
      throw new Error('Missing required Vipps configuration');
    }
    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        userId,
        firebaseId: userId, // Store Firebase ID for backup/debugging
        stableId,
        amount,
        months,
        discount,
        totalAmount: Math.round(amount * (1 - discount)),
        vippsOrderId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'PENDING',
        paymentMethod: 'VIPPS',
      },
    });

    // Get access token
    const accessToken = await getAccessToken();

    // Create Vipps payment request
    const vippsRequest: VippsPaymentRequest = {
      amount: {
        currency: 'NOK',
        value: payment.totalAmount,
      },
      paymentMethod: {
        type: 'WALLET',
      },
      reference: payment.vippsOrderId,
      userFlow: 'WEB_REDIRECT',
      returnUrl: `${config.VIPPS_CALLBACK_PREFIX}/api/payments/vipps/callback?orderId=${payment.vippsOrderId}`,
      paymentDescription: description,
    };

    // Send payment request to Vipps
    const paymentUrl = `${config.VIPPS_API_URL}/epayment/v1/payments`;
    const idempotencyKey = `payment-${payment.vippsOrderId}-${Date.now()}`;
    
    const response = await fetch(paymentUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Ocp-Apim-Subscription-Key': config.VIPPS_SUBSCRIPTION_KEY,
        'Merchant-Serial-Number': config.VIPPS_MERCHANT_SERIAL_NUMBER,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
        'Vipps-System-Name': 'stallplass',
        'Vipps-System-Version': '1.0.0',
        'Vipps-System-Plugin-Name': 'stallplass-web',
        'Vipps-System-Plugin-Version': '1.0.0',
      },
      body: JSON.stringify(vippsRequest),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Vipps payment API error:', {
        status: response.status,
        statusText: response.statusText,
        error,
        request: {
          amount: vippsRequest.amount,
          reference: vippsRequest.reference,
          returnUrl: vippsRequest.returnUrl
        }
      });
      throw new Error(`Failed to create Vipps payment: ${error}`);
    }

    const vippsResponse: VippsPaymentResponse = await response.json();

    // Update payment with Vipps reference
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        vippsReference: vippsResponse.pspReference || vippsResponse.reference,
        metadata: JSON.parse(JSON.stringify(vippsResponse)),
      },
    });

    return updatedPayment;
  } catch (error) {
    console.error('Error creating Vipps payment:', error);
    throw error;
  }
}

// Check Vipps payment status
export async function checkVippsPaymentStatus(vippsOrderId: string): Promise<VippsPaymentStatus> {
  try {
    const accessToken = await getAccessToken();
    const statusUrl = `${VIPPS_API_URL}/epayment/v1/payments/${vippsOrderId}`;

    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Ocp-Apim-Subscription-Key': VIPPS_SUBSCRIPTION_KEY,
        'Merchant-Serial-Number': VIPPS_MERCHANT_SERIAL_NUMBER,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get Vipps payment status: ${error}`);
    }

    const status: VippsPaymentStatus = await response.json();
    return status;
  } catch (error) {
    console.error('Error checking Vipps payment status:', error);
    throw error;
  }
}

// Update payment status based on Vipps callback
export async function updatePaymentStatus(
  vippsOrderId: string,
  status: VippsPaymentStatus
): Promise<Payment> {
  try {
    let paymentStatus: PaymentStatus = 'PENDING';
    const paidAt: Date | null = null;
    let failedAt: Date | null = null;
    let failureReason: string | null = null;

    // Map Vipps status to our payment status
    switch (status.state) {
      case 'AUTHORIZED':
        paymentStatus = 'PROCESSING';
        break;
      case 'ABORTED':
      case 'EXPIRED':
        paymentStatus = 'FAILED';
        failedAt = new Date();
        failureReason = `Payment ${status.state.toLowerCase()}`;
        break;
      case 'TERMINATED':
        paymentStatus = 'CANCELLED';
        failedAt = new Date();
        failureReason = 'Payment cancelled by user';
        break;
    }

    // Update payment in database
    const payment = await prisma.payment.update({
      where: { vippsOrderId },
      data: {
        status: paymentStatus,
        paidAt,
        failedAt,
        failureReason,
        metadata: JSON.parse(JSON.stringify(status)),
      },
      include: {
        stable: true,
      },
    });

    return payment;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
}

// Capture authorized payment
export async function captureVippsPayment(vippsOrderId: string): Promise<Payment> {
  try {
    const accessToken = await getAccessToken();
    
    // Get payment from database
    const payment = await prisma.payment.findUnique({
      where: { vippsOrderId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Capture payment in Vipps
    const captureUrl = `${VIPPS_API_URL}/epayment/v1/payments/${vippsOrderId}/capture`;
    const idempotencyKey = `capture-${vippsOrderId}-${Date.now()}`;
    
    const response = await fetch(captureUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Ocp-Apim-Subscription-Key': VIPPS_SUBSCRIPTION_KEY,
        'Merchant-Serial-Number': VIPPS_MERCHANT_SERIAL_NUMBER,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        modificationAmount: {
          currency: 'NOK',
          value: payment.totalAmount,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to capture Vipps payment: ${error}`);
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
      },
      include: {
        stable: true,
      },
    });

    // Update stable advertising period
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + updatedPayment.months);
    
    await prisma.stable.update({
      where: { id: updatedPayment.stableId },
      data: {
        advertisingStartDate: now,
        advertisingEndDate: endDate,
        advertisingActive: true,
      },
    });

    return updatedPayment;
  } catch (error) {
    console.error('Error capturing Vipps payment:', error);
    throw error;
  }
}

// Get payment history for a user
export async function getUserPayments(userId: string): Promise<Payment[]> {
  return prisma.payment.findMany({
    where: { userId },
    include: {
      stable: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Get payment by ID
export async function getPaymentById(paymentId: string): Promise<Payment | null> {
  return prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      stable: true,
      user: true,
    },
  });
}

// Get payment by Vipps order ID
export async function getPaymentByVippsOrderId(vippsOrderId: string): Promise<Payment | null> {
  return prisma.payment.findUnique({
    where: { vippsOrderId },
    include: {
      stable: true,
      user: true,
    },
  });
}

// Verify webhook signature according to Vipps documentation
export function verifyWebhookSignature(
  body: string,
  signature: string,
  timestamp: string,
  contentSha256: string
): boolean {
  if (!VIPPS_WEBHOOK_SECRET) {
    console.warn('VIPPS_WEBHOOK_SECRET not configured, skipping signature verification');
    return true; // Allow in development/test environments
  }

  try {
    // Vipps webhook signature format: "HMAC-SHA256=<signature>"
    const expectedSignature = signature.replace('HMAC-SHA256=', '');
    
    // Create the string to sign according to Vipps documentation
    const stringToSign = `${timestamp}\n${contentSha256}\n${body}`;
    
    // Generate HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', VIPPS_WEBHOOK_SECRET);
    hmac.update(stringToSign);
    const calculatedSignature = hmac.digest('base64');
    
    // Compare signatures using constant-time comparison
    return crypto.timingSafeEqual(
      Buffer.from(calculatedSignature, 'base64'),
      Buffer.from(expectedSignature, 'base64')
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Polling fallback for payment status checking
export async function pollPaymentStatus(
  vippsOrderId: string,
  maxAttempts: number = 10,
  intervalMs: number = 5000
): Promise<VippsPaymentStatus | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const status = await checkVippsPaymentStatus(vippsOrderId);
      
      // If payment is in a final state, return it
      if (['AUTHORIZED', 'ABORTED', 'EXPIRED', 'TERMINATED'].includes(status.state)) {
        return status;
      }
      
      // If not final state and not last attempt, wait before retrying
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    } catch (error) {
      console.error(`Polling attempt ${attempt + 1} failed:`, error);
      
      // If last attempt, return null
      if (attempt === maxAttempts - 1) {
        return null;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  
  return null;
}