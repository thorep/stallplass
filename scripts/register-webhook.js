#!/usr/bin/env node

/**
 * Script to register a webhook with Vipps and get the webhook secret
 * Run this once to set up your webhook endpoint
 */

const VIPPS_API_URL = process.env.VIPPS_API_URL || 'https://apitest.vipps.no';
const VIPPS_CLIENT_ID = process.env.VIPPS_CLIENT_ID;
const VIPPS_CLIENT_SECRET = process.env.VIPPS_CLIENT_SECRET;
const VIPPS_SUBSCRIPTION_KEY = process.env.VIPPS_SUBSCRIPTION_KEY;
const VIPPS_MERCHANT_SERIAL_NUMBER = process.env.VIPPS_MERCHANT_SERIAL_NUMBER;
const WEBHOOK_URL = process.env.VIPPS_CALLBACK_PREFIX + '/api/payments/vipps/callback';

async function getAccessToken() {
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
    throw new Error(`Failed to get access token: ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function registerWebhook() {
  try {
    console.log('Getting access token...');
    const accessToken = await getAccessToken();
    
    console.log('Registering webhook for URL:', WEBHOOK_URL);
    
    const webhookUrl = `${VIPPS_API_URL}/webhooks/v1/webhooks`;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Ocp-Apim-Subscription-Key': VIPPS_SUBSCRIPTION_KEY,
        'Merchant-Serial-Number': VIPPS_MERCHANT_SERIAL_NUMBER,
        'Content-Type': 'application/json',
        'Vipps-System-Name': 'stallplass',
        'Vipps-System-Version': '1.0.0',
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        events: ['epayments.payment.created.v1', 'epayments.payment.authorized.v1', 'epayments.payment.captured.v1', 'epayments.payment.terminated.v1']
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to register webhook: ${error}`);
    }

    const result = await response.json();
    
    console.log('✅ Webhook registered successfully!');
    console.log('Webhook ID:', result.id);
    console.log('Webhook Secret:', result.secret);
    console.log('');
    console.log('🔧 Add this to your environment variables:');
    console.log(`VIPPS_WEBHOOK_SECRET=${result.secret}`);
    
    return result;
  } catch (error) {
    console.error('❌ Error registering webhook:', error.message);
    process.exit(1);
  }
}

async function listWebhooks() {
  try {
    console.log('Getting existing webhooks...');
    const accessToken = await getAccessToken();
    
    const webhookUrl = `${VIPPS_API_URL}/webhooks/v1/webhooks`;
    const response = await fetch(webhookUrl, {
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
      throw new Error(`Failed to list webhooks: ${error}`);
    }

    const result = await response.json();
    
    console.log('📋 Existing webhooks:');
    if (result.length === 0) {
      console.log('No webhooks registered');
    } else {
      result.forEach((webhook, index) => {
        console.log(`${index + 1}. ID: ${webhook.id}`);
        console.log(`   URL: ${webhook.url}`);
        console.log(`   Events: ${webhook.events.join(', ')}`);
        console.log(`   Secret: ${webhook.secret}`);
        console.log('');
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error listing webhooks:', error.message);
    process.exit(1);
  }
}

// Main script
async function main() {
  if (!VIPPS_CLIENT_ID || !VIPPS_CLIENT_SECRET || !VIPPS_SUBSCRIPTION_KEY || !VIPPS_MERCHANT_SERIAL_NUMBER) {
    console.error('❌ Missing required environment variables. Please set:');
    console.error('VIPPS_CLIENT_ID, VIPPS_CLIENT_SECRET, VIPPS_SUBSCRIPTION_KEY, VIPPS_MERCHANT_SERIAL_NUMBER');
    process.exit(1);
  }

  const command = process.argv[2];
  
  switch (command) {
    case 'register':
      await registerWebhook();
      break;
    case 'list':
      await listWebhooks();
      break;
    default:
      console.log('Usage:');
      console.log('  node scripts/register-webhook.js register  # Register new webhook');
      console.log('  node scripts/register-webhook.js list     # List existing webhooks');
      process.exit(1);
  }
}

main();