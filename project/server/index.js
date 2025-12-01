// Import the Express framework, which is used to create a web server and handle HTTP requests
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')

// Import the database configuration file that contains connection logic for the database
const dbConfig = require('./dbConfig.js')
// Import the dotenv package to load environment variables from a .env file
const dotEnv = require('dotenv')

// Load the environment variables from the .env file into process.env
dotEnv.config()

// Create an instance of an Express application
const app = express()

// Call the connectDb() function from dbConfig.js to establish a connection to the database
dbConfig.connectDb()

// Import user-related routes from the user.route.js file
const userRoutes = require('./routes/user.route.js')
const movieRoutes = require('./routes/movie.route.js')
const theatreRoutes = require('./routes/theatre.route.js')
const showRoutes = require('./routes/show.routes.js')
const bookingRoutes = require('./routes/booking.route.js')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Booking = require('./models/booking.model.js')
const Show = require('./models/show.model.js')
const { sendBookingConfirmationEmail } = require('./services/emailService.js')

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	message: 'Too many Requests from this IP , Try Again in  15 minutes',
	skip: (req) => {
		// Skip rate limiting for Stripe webhook
		return req.path === '/api/booking/webhook';
	}
})


app.use(cors({
    origin:"http://localhost:5173",
    credentials : true
}))

app.use(cookieParser())

// Helper function to confirm booking (used by webhook)
const confirmBooking = async (session) => {
  try {
    const booking = await Booking.findById(session.metadata.bookingId);
    if (!booking) {
      console.error("Booking not found for session:", session.id);
      return { success: false, message: "Booking not found" };
    }
    if (booking.status === "completed") {
      console.log("Booking already confirmed:", booking._id);
      return { success: true, message: "Booking already confirmed", booking };
    }
    const show = await Show.findById(booking.show);
    if (!show) {
      booking.status = "failed";
      await booking.save();
      return { success: false, message: "Show not found" };
    }
    const conflictingSeats = booking.seats.filter((seat) =>
      show.bookedSeats.includes(seat)
    );
    if (conflictingSeats.length > 0) {
      booking.status = "failed";
      await booking.save();
      return { 
        success: false, 
        message: `Seats ${conflictingSeats.join(", ")} are already booked` 
      };
    }
    booking.stripePaymentIntentId = session.payment_intent;
    booking.status = "completed";
    await booking.save();
    show.bookedSeats = [...show.bookedSeats, ...booking.seats];
    await show.save();
    const populatedBooking = await Booking.findById(booking._id)
      .populate("user")
      .populate("show")
      .populate({
        path: "show",
        populate: [{ path: "movie" }, { path: "theatre" }],
      });
    sendBookingConfirmationEmail(populatedBooking)
      .then(result => {
        if (result.success) {
          console.log('Booking confirmation email sent successfully');
        } else {
          console.error('Failed to send booking confirmation email:', result.message);
        }
      })
      .catch(error => {
        console.error('Error sending booking confirmation email:', error);
      });
    return { success: true, booking: populatedBooking };
  } catch (error) {
    console.error("Error confirming booking:", error);
    return { success: false, message: error.message || "Failed to confirm booking" };
  }
};

// Stripe webhook route needs raw body, so mount it before JSON middleware
// This route must be mounted before express.json() to receive raw body for signature verification
app.post('/api/booking/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      console.warn("STRIPE_WEBHOOK_SECRET not set - webhook signature verification skipped");
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.payment_status === 'paid') {
      console.log('Processing successful payment for session:', session.id);
      const result = await confirmBooking(session);
      if (result.success) {
        console.log('Booking confirmed via webhook:', result.booking._id);
      } else {
        console.error('Failed to confirm booking via webhook:', result.message);
      }
    }
  }
  res.json({ received: true });
})

// Enable the app to automatically parse incoming JSON request bodies
app.use(express.json())

app.use(limiter)

// Custom MongoDB sanitization middleware compatible with Express 5
// Express 5 has read-only query property, so we sanitize body and params only
const sanitizeMongo = (obj, replaceWith = '_') => {
	if (obj === null || obj === undefined) return obj;
	if (typeof obj !== 'object') return obj;
	if (Array.isArray(obj)) {
		return obj.map(item => sanitizeMongo(item, replaceWith));
	}
	const sanitized = {};
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			// Replace MongoDB operators
			const sanitizedKey = key.replace(/^\$/, replaceWith);
			sanitized[sanitizedKey] = sanitizeMongo(obj[key], replaceWith);
		}
	}
	return sanitized;
};

app.use((req, res, next) => {
	if (req.body) {
		req.body = sanitizeMongo(req.body);
	}
	if (req.params) {
		req.params = sanitizeMongo(req.params);
	}
	next();
});

// Mount all routes defined in userRoutes under the '/api/auth' path
// Example: a route defined as '/login' in user.route.js will become '/api/auth/login'
app.use('/api/auth', userRoutes)
app.use('/api/movie', movieRoutes)
app.use('/api/theatre',theatreRoutes)
app.use('/api/shows' , showRoutes)
app.use('/api/booking', bookingRoutes)

// Start the server on port 8001 and run the callback function once the server starts successfully
app.listen(8001, () => {
    // Print a message to the console indicating that the server is running
    console.log('Server Started')
})
