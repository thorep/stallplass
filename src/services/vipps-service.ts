import { Payment, PaymentStatus } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-server';
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
      'client_id': config.VIPPS_CLIENT_ID!,
      'client_secret': config.VIPPS_CLIENT_SECRET!,
      'Ocp-Apim-Subscription-Key': config.VIPPS_SUBSCRIPTION_KEY!,
      'Merchant-Serial-Number': config.VIPPS_MERCHANT_SERIAL_NUMBER!,
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
// Norwegian function name
export async function opprettVippsBetalinger(
  brukerId: string,
  stallId: string,
  belop: number, // Amount in øre
  maneder: number,
  rabatt: number,
  beskrivelse: string
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
    const vippsOrderId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const totalAmount = Math.round(belop * (1 - rabatt));
    
    const { data: payment, error: paymentError } = await supabaseServer
      .from('payments')
      .insert([{
        user_id: brukerId,
        firebase_id: brukerId, // Store Firebase ID for backup/debugging
        stable_id: stallId,
        amount: belop,
        months: maneder,
        discount: rabatt,
        total_amount: totalAmount,
        vipps_order_id: vippsOrderId,
        status: 'PENDING',
        payment_method: 'VIPPS',
      }])
      .select()
      .single();

    if (paymentError || !payment) {
      throw new Error(`Failed to create payment record: ${paymentError?.message}`);
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Create Vipps payment request
    const vippsRequest: VippsPaymentRequest = {
      amount: {
        currency: 'NOK',
        value: payment.total_amount,
      },
      paymentMethod: {
        type: 'WALLET',
      },
      reference: payment.vipps_order_id,
      userFlow: 'WEB_REDIRECT',
      returnUrl: `${config.VIPPS_CALLBACK_PREFIX}/api/payments/vipps/callback?orderId=${payment.vipps_order_id}`,
      paymentDescription: beskrivelse,
    };

    // Send payment request to Vipps
    const paymentUrl = `${config.VIPPS_API_URL}/epayment/v1/payments`;
    const idempotencyKey = `payment-${payment.vipps_order_id}-${Date.now()}`;
    
    const response = await fetch(paymentUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Ocp-Apim-Subscription-Key': config.VIPPS_SUBSCRIPTION_KEY!,
        'Merchant-Serial-Number': config.VIPPS_MERCHANT_SERIAL_NUMBER!,
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
    const { data: updatedPayment, error: updateError } = await supabaseServer
      .from('payments')
      .update({
        vipps_referanse: vippsResponse.pspReference || vippsResponse.reference,
        metadata: JSON.parse(JSON.stringify(vippsResponse)),
      })
      .eq('id', payment.id)
      .select()
      .single();

    if (updateError || !updatedPayment) {
      throw new Error(`Failed to update payment: ${updateError?.message}`);
    }

    return updatedPayment;
  } catch (error) {
    console.error('Error creating Vipps payment:', error);
    throw error;
  }
}

// Check Vipps payment status
// Norwegian function name
export async function sjekkVippsBetalingsStatus(vippsOrderId: string): Promise<VippsPaymentStatus> {
  try {
    const config = getVippsConfig();
    const accessToken = await getAccessToken();
    const statusUrl = `${config.VIPPS_API_URL}/epayment/v1/payments/${vippsOrderId}`;

    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Ocp-Apim-Subscription-Key': config.VIPPS_SUBSCRIPTION_KEY!,
        'Merchant-Serial-Number': config.VIPPS_MERCHANT_SERIAL_NUMBER!,
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
// Norwegian function name
export async function oppdaterBetalingsStatus(
  vippsOrderId: string,
  status: VippsPaymentStatus
): Promise<Payment> {
  try {
    let paymentStatus: PaymentStatus = 'PENDING';
    const paidAt: string | null = null;
    let failedAt: string | null = null;
    let failureReason: string | null = null;

    // Map Vipps status to our payment status
    switch (status.state) {
      case 'AUTHORIZED':
        paymentStatus = 'PROCESSING';
        break;
      case 'ABORTED':
      case 'EXPIRED':
        paymentStatus = 'FAILED';
        failedAt = new Date().toISOString();
        failureReason = `Payment ${status.state.toLowerCase()}`;
        break;
      case 'TERMINATED':
        paymentStatus = 'CANCELLED';
        failedAt = new Date().toISOString();
        failureReason = 'Payment cancelled by user';
        break;
    }

    // Update payment in database
    const { data: payment, error } = await supabaseServer
      .from('payments')
      .update({
        status: paymentStatus,
        betalt_dato: paidAt,
        feilet_dato: failedAt,
        feil_arsak: failureReason,
        metadata: JSON.parse(JSON.stringify(status)),
      })
      .eq('vipps_ordre_id', vippsOrderId)
      .select(`
        *,
        stable:staller(*)
      `)
      .single();

    if (error || !payment) {
      throw new Error(`Failed to update payment status: ${error?.message}`);
    }

    return payment;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
}

// Capture authorized payment
// Norwegian function name
export async function fangVippsBetalinger(vippsOrderId: string): Promise<Payment> {
  try {
    const config = getVippsConfig();
    const accessToken = await getAccessToken();
    
    // Get payment from database
    const { data: payment, error: findError } = await supabaseServer
      .from('payments')
      .select('*')
      .eq('vipps_ordre_id', vippsOrderId)
      .single();

    if (findError || !payment) {
      throw new Error('Payment not found');
    }

    // Capture payment in Vipps
    const captureUrl = `${config.VIPPS_API_URL}/epayment/v1/payments/${vippsOrderId}/capture`;
    const idempotencyKey = `capture-${vippsOrderId}-${Date.now()}`;
    
    const response = await fetch(captureUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Ocp-Apim-Subscription-Key': config.VIPPS_SUBSCRIPTION_KEY!,
        'Merchant-Serial-Number': config.VIPPS_MERCHANT_SERIAL_NUMBER!,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        modificationAmount: {
          currency: 'NOK',
          value: payment.total_amount,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to capture Vipps payment: ${error}`);
    }

    // Update payment status
    const { data: updatedPayment, error: updateError } = await supabaseServer
      .from('payments')
      .update({
        status: 'COMPLETED',
        paid_at: new Date().toISOString(),
      })
      .eq('id', payment.id)
      .select(`
        *,
        stable:stables(*)
      `)
      .single();

    if (updateError || !updatedPayment) {
      throw new Error(`Failed to update payment: ${updateError?.message}`);
    }

    // Update stable advertising period
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + updatedPayment.months);
    
    const { error: stableError } = await supabaseServer
      .from('stables')
      .update({
        advertising_start_date: now.toISOString(),
        advertising_end_date: endDate.toISOString(),
        advertising_active: true,
      })
      .eq('id', updatedPayment.stable_id);

    if (stableError) {
      throw new Error(`Failed to update stable: ${stableError.message}`);
    }

    // Activate all boxes in the stable
    const { error: boxError } = await supabaseServer
      .from('boxes')
      .update({ is_active: true })
      .eq('stable_id', updatedPayment.stable_id);

    if (boxError) {
      throw new Error(`Failed to activate boxes: ${boxError.message}`);
    }

    return updatedPayment;
  } catch (error) {
    console.error('Error capturing Vipps payment:', error);
    throw error;
  }
}

// Get payment history for a user
// Norwegian function name
export async function hentBrukerBetalinger(brukerId: string): Promise<Payment[]> {
  const { data, error } = await supabaseServer
    .from('payments')
    .select(`
      *,
      stable:staller(*)
    `)
    .eq('bruker_id', brukerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get user payments: ${error.message}`);
  }

  return data || [];
}

// Get payment by ID
// Norwegian function name
export async function hentBetalingerEtterId(betalingId: string): Promise<Payment | null> {
  const { data, error } = await supabaseServer
    .from('payments')
    .select(`
      *,
      stable:staller(*),
      user:brukere(*)
    `)
    .eq('id', betalingId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

// Get payment by Vipps order ID
// Norwegian function name
export async function hentBetalingerEtterVippsOrdreId(vippsOrderId: string): Promise<Payment | null> {
  const { data, error } = await supabaseServer
    .from('payments')
    .select(`
      *,
      stable:staller(*),
      user:brukere(*)
    `)
    .eq('vipps_ordre_id', vippsOrderId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

// Verify webhook signature according to Vipps documentation
export function verifyWebhookSignature(
  body: string,
  signature: string,
  timestamp: string,
  contentSha256: string
): boolean {
  const config = getVippsConfig();
  
  if (!config.VIPPS_WEBHOOK_SECRET) {
    console.warn('VIPPS_WEBHOOK_SECRET not configured, skipping signature verification');
    return true; // Allow in development/test environments
  }

  try {
    // Vipps webhook signature format: "HMAC-SHA256=<signature>"
    const expectedSignature = signature.replace('HMAC-SHA256=', '');
    
    // Create the string to sign according to Vipps documentation
    const stringToSign = `${timestamp}\n${contentSha256}\n${body}`;
    
    // Generate HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', config.VIPPS_WEBHOOK_SECRET);
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
      const status = await sjekkVippsBetalingsStatus(vippsOrderId);
      
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

// English aliases for backward compatibility
export const createVippsPayment = opprettVippsBetalinger;
export const checkVippsPaymentStatus = sjekkVippsBetalingsStatus;
export const updatePaymentStatus = oppdaterBetalingsStatus;
export const captureVippsPayment = fangVippsBetalinger;
export const getUserPayments = hentBrukerBetalinger;
export const getPaymentById = hentBetalingerEtterId;
export const getPaymentByVippsOrderId = hentBetalingerEtterVippsOrdreId;