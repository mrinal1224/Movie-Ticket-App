const express = require("express");
const Booking = require("../models/booking.model.js");
const Show = require("../models/show.model.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const isAuth = require('../middlewares/authMiddleware.js');
// const { requireUser } = require('../middlewares/roleMiddleware.js');

const bookingRouter = express.Router();

// Create Stripe checkout session (User only)
bookingRouter.post("/create-checkout-session", isAuth,  async (req, res) => {
  try {
    const { amount, userId, showId, seats, showName, customerName, customerEmail, customerAddress } = req.body;

    // Security: Users can only create bookings for themselves
    if (userId !== req.userId) {
      return res.send({
        success: false,
        message: "Access denied. You can only create bookings for yourself.",
      });
    }

    if (!amount || amount <= 0) {
      return res.send({
        success: false,
        message: "Invalid amount",
      });
    }

    // Create a pending booking record
    const booking = new Booking({
      show: showId,
      user: userId,
      seats: seats,
      totalAmount: amount,
      status: "pending",
    });
    await booking.save();

    // Prepare customer information for Indian regulations
    const customerInfo = {};
    if (customerName) {
      customerInfo.customer_email = customerEmail;
    }

    // Create Stripe checkout session with customer information
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `Movie Ticket - ${showName || "Booking"}`,
              description: `Seats: ${seats.sort((a, b) => a - b).join(", ")}`,
            },
            unit_amount: amount * 100, // Stripe expects amount in paise
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: customerEmail,
      billing_address_collection: "required", // Required for Indian regulations
      shipping_address_collection: {
        allowed_countries: ["IN"], // India only
      },
      success_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/bookshow/${showId}`,
      metadata: {
        bookingId: booking._id.toString(),
        showId: showId,
        userId: userId,
        seats: JSON.stringify(seats),
        customerName: customerName || "",
      },
    });

   
    console.log(session.url)
    // Update booking with session ID
    booking.stripeSessionId = session.id;
    await booking.save();

 

    res.send({
      success: true,
      message: "Checkout session created",
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    console.error("Error creating Stripe session:", error);
    res.send({
      success: false,
      message: error.message || "Failed to create checkout session",
    });
  }
});

// Verify payment and confirm booking (User only)
bookingRouter.post("/verify-payment", isAuth, async (req, res) => {
  try {
    const { sessionId } = req.body;

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.send({
        success: false,
        message: "Payment not completed",
      });
    }

    // Find the booking
    const booking = await Booking.findById(session.metadata.bookingId);

    if (!booking) {
      return res.send({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if already completed
    if (booking.status === "completed") {
      return res.send({
        success: true,
        message: "Booking already confirmed",
        data: booking,
      });
    }

    // Check if seats are still available
    const show = await Show.findById(booking.show);
    if (!show) {
      return res.send({
        success: false,
        message: "Show not found",
      });
    }

    // Check if any of the selected seats are already booked
    const conflictingSeats = booking.seats.filter((seat) =>
      show.bookedSeats.includes(seat)
    );

    if (conflictingSeats.length > 0) {
      booking.status = "failed";
      await booking.save();
      return res.send({
        success: false,
        message: `Seats ${conflictingSeats.join(", ")} are already booked`,
      });
    }

    // Update booking
    booking.stripePaymentIntentId = session.payment_intent;
    booking.status = "completed";
    await booking.save();

    // Update show's bookedSeats array
    show.bookedSeats = [...show.bookedSeats, ...booking.seats];
    await show.save();

    // Populate booking data before sending response
    const populatedBooking = await Booking.findById(booking._id)
      .populate("show")
      .populate({
        path: "show",
        populate: [{ path: "movie" }, { path: "theatre" }],
      });

    res.send({
      success: true,
      message: "Payment verified and booking confirmed!",
      data: populatedBooking,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.send({
      success: false,
      message: error.message || "Failed to verify payment",
    });
  }
});

// Get user bookings (Authenticated - users can see their own)
bookingRouter.post("/get-user-bookings", isAuth, async (req, res) => {
  try {
    const { userId } = req.body;
    const authenticatedUserId = req.userId;
    
    // Security: Users can only see their own bookings, Admins can see any
    if (req.userRole === 'user' && userId !== authenticatedUserId) {
      return res.send({
        success: false,
        message: "Access denied. You can only view your own bookings.",
      });
    }
    
    const bookings = await Booking.find({ user: userId })
      .populate("show")
      .populate({
        path: "show",
        populate: [{ path: "movie" }, { path: "theatre" }],
      })
      .sort({ createdAt: -1 });

    res.send({
      success: true,
      message: "Bookings fetched successfully",
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.send({
      success: false,
      message: error.message || "Failed to fetch bookings",
    });
  }
});

module.exports = bookingRouter;

