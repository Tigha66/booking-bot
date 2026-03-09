// Booking & Reservation Bot API
// Deployable to Vercel

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors());

// In-memory storage (use database in production)
const bookings = new Map();
const users = new Map();
const payments = new Map();

// Service fee configuration
const SERVICE_FEE = {
  flight: 15.00,
  hotel: 10.00,
  restaurant: 5.00,
  subscription: 49.99 // monthly
};

// Booking confirmation
function generateConfirmationId() {
  return 'BK-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Send confirmation notification (stub)
async function sendConfirmation(booking, user) {
  // Integrate with email/SMS in production
  console.log(`Confirmation sent for ${booking.confirmationId}`);
  return { sent: true, method: 'email' };
}

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    service: 'Booking & Reservation Bot',
    version: '1.0.0'
  });
});

// Get available flights
app.get('/api/flights', (req, res) => {
  const { from, to, date, budget } = req.query;
  
  // Mock flight data (integrate with travel API in production)
  const flights = [
    { id: 'FL001', airline: 'SkyAir', from: 'NYC', to: 'LAX', date: date || '2026-04-01', time: '08:00', price: 299, duration: '5h' },
    { id: 'FL002', airline: 'JetSet', from: 'NYC', to: 'LAX', date: date || '2026-04-01', time: '14:30', price: 349, duration: '5h' },
    { id: 'FL003', airline: 'QuickFly', from: 'NYC', to: 'LAX', date: date || '2026-04-01', time: '21:00', price: 199, duration: '5h' },
  ].filter(f => !budget || f.price <= parseInt(budget));

  res.json({ flights });
});

// Get available hotels
app.get('/api/hotels', (req, res) => {
  const { location, checkIn, checkOut, budget } = req.query;

  // Mock hotel data (integrate with hotel API in production)
  const hotels = [
    { id: 'HT001', name: 'Grand Plaza', location: location || 'LAX', rating: 4.5, pricePerNight: 150, amenities: ['WiFi', 'Pool', 'Gym'] },
    { id: 'HT002', name: 'Comfort Inn', location: location || 'LAX', rating: 4.0, pricePerNight: 89, amenities: ['WiFi', 'Breakfast'] },
    { id: 'HT003', name: 'Luxury Suites', location: location || 'LAX', rating: 5.0, pricePerNight: 350, amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant'] },
  ].filter(h => !budget || h.pricePerNight <= parseInt(budget));

  res.json({ hotels });
});

// Get available restaurants
app.get('/api/restaurants', (req, res) => {
  const { location, cuisine, date, time, partySize } = req.query;

  // Mock restaurant data (integrate with restaurant API in production)
  const restaurants = [
    { id: 'RE001', name: 'Bella Italia', cuisine: 'Italian', location: location || 'LAX', rating: 4.7, availableTimes: ['18:00', '19:00', '20:00'] },
    { id: 'RE002', name: 'Tokyo Garden', cuisine: 'Japanese', location: location || 'LAX', rating: 4.8, availableTimes: ['12:00', '18:30', '19:30'] },
    { id: 'RE003', name: 'The Steakhouse', cuisine: 'American', location: location || 'LAX', rating: 4.6, availableTimes: ['17:00', '18:00', '19:00', '20:00'] },
  ].filter(r => !cuisine || r.cuisine.toLowerCase() === cuisine.toLowerCase());

  res.json({ restaurants });
});

// Create a booking
app.post('/api/bookings', async (req, res) => {
  const { type, userId, details, paymentMethod } = req.body;

  if (!type || !details) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const confirmationId = generateConfirmationId();
  const serviceFee = SERVICE_FEE[type] || 0;
  
  const booking = {
    confirmationId,
    type,
    userId,
    details,
    serviceFee,
    totalAmount: (details.price || 0) + serviceFee,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  bookings.set(confirmationId, booking);

  // Process payment (stub - integrate with Stripe/PayPal)
  const payment = {
    bookingId: confirmationId,
    amount: booking.totalAmount,
    method: paymentMethod || 'card',
    status: 'pending'
  };
  payments.set(confirmationId, payment);

  // Send confirmation
  const user = users.get(userId);
  await sendConfirmation(booking, user);

  res.json({ 
    success: true, 
    booking,
    payment
  });
});

// Get booking status
app.get('/api/bookings/:id', (req, res) => {
  const booking = bookings.get(req.params.id);
  
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  res.json({ booking });
});

// Cancel booking
app.delete('/api/bookings/:id', (req, res) => {
  const booking = bookings.get(req.params.id);
  
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date().toISOString();
  
  res.json({ 
    success: true, 
    message: 'Booking cancelled',
    refund: booking.serviceFee // Refund service fee
  });
});

// Modify booking
app.patch('/api/bookings/:id', (req, res) => {
  const booking = bookings.get(req.params.id);
  
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  booking.details = { ...booking.details, ...req.body.updates };
  booking.modifiedAt = new Date().toISOString();

  res.json({ 
    success: true, 
    booking 
  });
});

// Subscription endpoint
app.post('/api/subscribe', (req, res) => {
  const { userId, plan } = req.body;
  
  const subscription = {
    userId,
    plan: plan || 'monthly',
    fee: SERVICE_FEE.subscription,
    status: 'active',
    startedAt: new Date().toISOString()
  };

  res.json({ 
    success: true, 
    subscription 
  });
});

// Service fee info
app.get('/api/fees', (req, res) => {
  res.json({ 
    perBooking: {
      flight: SERVICE_FEE.flight,
      hotel: SERVICE_FEE.hotel,
      restaurant: SERVICE_FEE.restaurant
    },
    subscription: {
      monthly: SERVICE_FEE.subscription
    }
  });
});

module.exports = app;
