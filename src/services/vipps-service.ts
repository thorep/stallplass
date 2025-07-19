import { Payment, PaymentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';

// Vipps API configuration
const VIPPS_API_URL = process.env.VIPPS_API_URL || 'https://apitest.vipps.no';
const VIPPS_CLIENT_ID = process.env.VIPPS_CLIENT_ID!;
const VIPPS_CLIENT_SECRET = process.env.VIPPS_CLIENT_SECRET!;
const VIPPS_SUBSCRIPTION_KEY = process.env.VIPPS_SUBSCRIPTION_KEY!;
const VIPPS_MERCHANT_SERIAL_NUMBER = process.env.VIPPS_MERCHANT_SERIAL_NUMBER!;
const VIPPS_CALLBACK_PREFIX = process.env.VIPPS_CALLBACK_PREFIX || 'http://localhost:3000';

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
  const tokenUrl = `${VIPPS_API_URL}/accesstoken/get`;
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'client_id': VIPPS_CLIENT_ID,
      'client_secret': VIPPS_CLIENT_SECRET,
      'Ocp-Apim-Subscription-Key': VIPPS_SUBSCRIPTION_KEY,
      'Merchant-Serial-Number': VIPPS_MERCHANT_SERIAL_NUMBER,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
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
    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        userId,
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
      returnUrl: `${VIPPS_CALLBACK_PREFIX}/api/payments/vipps/callback?orderId=${payment.vippsOrderId}`,
      paymentDescription: description,
    };

    // Send payment request to Vipps
    const paymentUrl = `${VIPPS_API_URL}/epayment/v1/payments`;
    const response = await fetch(paymentUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Ocp-Apim-Subscription-Key': VIPPS_SUBSCRIPTION_KEY,
        'Merchant-Serial-Number': VIPPS_MERCHANT_SERIAL_NUMBER,
        'Content-Type': 'application/json',
        'Vipps-System-Name': 'stallplass',
        'Vipps-System-Version': '1.0.0',
        'Vipps-System-Plugin-Name': 'stallplass-web',
        'Vipps-System-Plugin-Version': '1.0.0',
      },
      body: JSON.stringify(vippsRequest),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create Vipps payment: ${error}`);
    }

    const vippsResponse: VippsPaymentResponse = await response.json();

    // Update payment with Vipps reference
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        vippsReference: vippsResponse.pspReference || vippsResponse.reference,
        metadata: vippsResponse as any,
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
        metadata: status as any,
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
    const response = await fetch(captureUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Ocp-Apim-Subscription-Key': VIPPS_SUBSCRIPTION_KEY,
        'Merchant-Serial-Number': VIPPS_MERCHANT_SERIAL_NUMBER,
        'Content-Type': 'application/json',
        'Idempotency-Key': `capture-${vippsOrderId}-${Date.now()}`,
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