const axios = require('axios');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Test webhook endpoint
async function testWebhook() {
  const webhookUrl = 'http://localhost:8001/api/booking/webhook';
  
  // First, let's get a pending booking from the database to test with
  const mongoose = require('mongoose');
  const Booking = require('./models/booking.model.js');
  const Show = require('./models/show.model.js');
  const { connectDb } = require('./dbConfig.js');
  const dotenv = require('dotenv');
  
  dotenv.config();
  
  try {
    // Connect to database
    await connectDb();
    console.log('✅ Connected to database');
    
    // Find a pending booking with a Stripe session ID
    const pendingBooking = await Booking.findOne({ 
      status: 'pending',
      stripeSessionId: { $exists: true, $ne: null }
    })
      .populate('show')
      .populate('user');
    
    if (!pendingBooking) {
      console.log('❌ No pending bookings with Stripe session found.');
      console.log('💡 Please create a booking through the app first, then run this test again.');
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log(`\n🔍 Testing webhook with booking ID: ${pendingBooking._id}`);
    console.log(`📋 Current status: ${pendingBooking.status}`);
    console.log(`💳 Stripe Session ID: ${pendingBooking.stripeSessionId}`);
    
    // Retrieve the actual session from Stripe to get real payment status
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(pendingBooking.stripeSessionId);
      console.log(`💳 Payment status from Stripe: ${session.payment_status}`);
      
      if (session.payment_status !== 'paid') {
        console.log('⚠️  Session is not paid. Webhook will not process this booking.');
        console.log('💡 Make sure you complete the payment in Stripe first.');
        await mongoose.disconnect();
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error retrieving session from Stripe:', error.message);
      await mongoose.disconnect();
      process.exit(1);
    }
    
    // Create a test Stripe checkout session completed event with real data
    const testEvent = {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      type: 'checkout.session.completed',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: session.id,
          object: 'checkout.session',
          payment_status: session.payment_status,
          payment_intent: session.payment_intent,
          metadata: session.metadata || {
            bookingId: pendingBooking._id.toString(),
            showId: pendingBooking.show?._id?.toString() || '',
            userId: pendingBooking.user?._id?.toString() || '',
            seats: JSON.stringify(pendingBooking.seats),
            customerName: pendingBooking.user?.name || 'Test User'
          }
        }
      }
    };
    
    console.log('\n🔔 Sending webhook event...');
    
    // For testing without webhook secret, we'll send the event directly
    // In production, Stripe signs the webhook with a secret
    const response = await axios.post(webhookUrl, JSON.stringify(testEvent), {
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature' // This won't be verified if STRIPE_WEBHOOK_SECRET is not set
      }
    });
    
    console.log('📨 Webhook response:', response.status, response.data);
    
    // Check if booking was updated
    console.log('\n⏳ Waiting for webhook processing...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    const updatedBooking = await Booking.findById(pendingBooking._id);
    console.log(`\n📊 Booking status after webhook: ${updatedBooking.status}`);
    
    if (updatedBooking.status === 'completed') {
      console.log('✅ SUCCESS: Webhook updated booking status to completed!');
    } else {
      console.log('❌ FAILED: Booking status is still', updatedBooking.status);
      console.log('💡 The webhook may not have processed correctly. Check server logs.');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
    if (error.response) {
      console.error('📨 Response:', error.response.data);
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

console.log('🧪 Starting webhook test...\n');
testWebhook();

