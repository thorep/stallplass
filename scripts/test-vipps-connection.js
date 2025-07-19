#!/usr/bin/env node

/**
 * Test script to verify Vipps API connection and credentials
 */

const VIPPS_API_URL = process.env.VIPPS_API_URL || 'https://apitest.vipps.no';
const VIPPS_CLIENT_ID = process.env.VIPPS_CLIENT_ID;
const VIPPS_CLIENT_SECRET = process.env.VIPPS_CLIENT_SECRET;
const VIPPS_SUBSCRIPTION_KEY = process.env.VIPPS_SUBSCRIPTION_KEY;
const VIPPS_MERCHANT_SERIAL_NUMBER = process.env.VIPPS_MERCHANT_SERIAL_NUMBER;

console.log('🔍 Testing Vipps API connection...\n');
console.log('Configuration:');
console.log('API URL:', VIPPS_API_URL);
console.log('MSN:', VIPPS_MERCHANT_SERIAL_NUMBER);
console.log('Client ID:', VIPPS_CLIENT_ID);
console.log('Has Client Secret:', !!VIPPS_CLIENT_SECRET);
console.log('Has Subscription Key:', !!VIPPS_SUBSCRIPTION_KEY);
console.log('');

async function testAccessToken() {
  const tokenUrl = `${VIPPS_API_URL}/accesstoken/get`;
  
  console.log('📡 Attempting to get access token from:', tokenUrl);
  
  try {
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

    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to get access token:', error);
      return null;
    }

    const data = await response.json();
    console.log('✅ Successfully got access token!');
    console.log('Token type:', data.token_type);
    console.log('Expires in:', data.expires_in, 'seconds');
    return data.access_token;
  } catch (error) {
    console.error('❌ Network error:', error.message);
    return null;
  }
}

async function testPaymentCreation(accessToken) {
  if (!accessToken) {
    console.log('\n⚠️  Skipping payment test - no access token');
    return;
  }

  console.log('\n📡 Testing payment creation endpoint...');
  
  const paymentUrl = `${VIPPS_API_URL}/epayment/v1/payments`;
  const testPayment = {
    amount: {
      currency: 'NOK',
      value: 100, // 1 kr in øre
    },
    paymentMethod: {
      type: 'WALLET',
    },
    reference: `test-${Date.now()}`,
    userFlow: 'WEB_REDIRECT',
    returnUrl: 'https://www.stallplass.no/test-callback',
    paymentDescription: 'Test payment',
  };

  try {
    const response = await fetch(paymentUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Ocp-Apim-Subscription-Key': VIPPS_SUBSCRIPTION_KEY,
        'Merchant-Serial-Number': VIPPS_MERCHANT_SERIAL_NUMBER,
        'Content-Type': 'application/json',
        'Idempotency-Key': `test-${Date.now()}`,
        'Vipps-System-Name': 'stallplass',
        'Vipps-System-Version': '1.0.0',
      },
      body: JSON.stringify(testPayment),
    });

    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to create test payment:', error);
      return;
    }

    const data = await response.json();
    console.log('✅ Successfully created test payment!');
    console.log('Reference:', data.reference);
    console.log('Redirect URL:', data.redirectUrl);
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

async function main() {
  if (!VIPPS_CLIENT_ID || !VIPPS_CLIENT_SECRET || !VIPPS_SUBSCRIPTION_KEY || !VIPPS_MERCHANT_SERIAL_NUMBER) {
    console.error('❌ Missing required environment variables. Please set:');
    console.error('VIPPS_CLIENT_ID, VIPPS_CLIENT_SECRET, VIPPS_SUBSCRIPTION_KEY, VIPPS_MERCHANT_SERIAL_NUMBER');
    process.exit(1);
  }

  const accessToken = await testAccessToken();
  await testPaymentCreation(accessToken);
  
  console.log('\n📋 Summary:');
  if (accessToken) {
    console.log('✅ API credentials are working correctly');
    console.log('\n🔧 Make sure your production environment has:');
    console.log('1. All the same environment variables');
    console.log('2. VIPPS_CALLBACK_PREFIX set to your production URL');
    console.log('3. VIPPS_WEBHOOK_SECRET from the webhook registration');
  } else {
    console.log('❌ API credentials are not working');
    console.log('\n🔧 Check that:');
    console.log('1. Your credentials are correct');
    console.log('2. You\'re using the right API URL (test vs production)');
    console.log('3. Your MSN is activated');
  }
}

main();