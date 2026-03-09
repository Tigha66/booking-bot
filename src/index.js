require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage
const bookings = new Map();
const users = new Map();
const flights = [
  { id: 'FL001', airline: 'British Airways', from: 'London', to: 'New York', date: '2026-03-15', price: 450, seats: 10 },
  { id: 'FL002', airline: 'Emirates', from: 'London', to: 'Dubai', date: '2026-03-16', price: 380, seats: 15 },
  { id: 'FL003', airline: 'Lufthansa', from: 'London', to: 'Berlin', date: '2026-03-17', price: 120, seats: 20 },
  { id: 'FL004', airline: 'Air France', from: 'London', to: 'Paris', date: '2026-03-18', price: 95, seats: 25 }
];

const hotels = [
  { id: 'HT001', name: 'Grand Hotel', location: 'New York', type: 'Deluxe', price: 250, rating: 4.8, amenities: ['WiFi', 'Pool', 'Spa'] },
  { id: 'HT002', name: 'Burj Al Arab', location: 'Dubai', type: 'Suite', price: 850, rating: 5.0, amenities: ['WiFi', 'Pool', 'Spa', 'Butler'] },
  { id: 'HT003', name: 'Hotel Berlin', location: 'Berlin', type: 'Standard', price: 120, rating: 4.2, amenities: ['WiFi', 'Breakfast'] },
  { id: 'HT004', name: 'Le Marais', location: 'Paris', type: 'Boutique', price: 180, rating: 4.6, amenities: ['WiFi', 'Breakfast', 'Bar'] }
];

const restaurants = [
  { id: 'RS001', name: 'The Ivy', location: 'London', cuisine: 'British', priceRange: '$$$', capacity: 50 },
  { id: 'RS002', name: 'Dishoom', location: 'London', cuisine: 'Indian', priceRange: '$$', capacity: 80 },
  { id: 'RS003', name: 'Nobu', location: 'London', cuisine: 'Japanese', priceRange: '$$$$', capacity: 60 },
  { id: 'RS004', name: 'Pizza Pilgrims', location: 'London', cuisine: 'Italian', priceRange: '$', capacity: 40 }
];

// Service fee structure
const SERVICE_FEES = {
  flight: 15,
  hotel: 10,
  restaurant: 5,
  subscription: 29.99 // Monthly unlimited
};

// === HEALTH CHECK ===
app.get('/', (req, res) => {
  res.json({
    name: 'Automated Booking & Reservation Bot',
    version: '1.0.0',
    services: ['Flights', 'Hotels', 'Restaurants'],
    endpoints: {
      flights: '/api/flights',
      hotels: '/api/hotels',
      restaurants: '/api/restaurants',
      bookings: '/api/bookings',
      payment: '/api/payment'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// === FLIGHTS ===
app.get('/api/flights', (req, res) => {
  const { from, to, date, maxPrice } = req.query;
  let results = [...flights];
  
  if (from) results = results.filter(f => f.from.toLowerCase().includes(from.toLowerCase()));
  if (to) results = results.filter(f => f.to.toLowerCase().includes(to.toLowerCase()));
  if (date) results = results.filter(f => f.date === date);
  if (maxPrice) results = results.filter(f => f.price <= parseFloat(maxPrice));
  
  res.json(results);
});

app.get('/api/flights/:id', (req, res) => {
  const flight = flights.find(f => f.id === req.params.id);
  if (!flight) return res.status(404).json({ error: 'Flight not found' });
  res.json(flight);
});

app.post('/api/flights/book', (req, res) => {
  const { flightId, userId, passengers, class: travelClass } = req.body;
  
  const flight = flights.find(f => f.id === flightId);
  if (!flight) return res.status(404).json({ error: 'Flight not found' });
  if (flight.seats < passengers) return res.status(400).json({ error: 'Not enough seats available' });
  
  const bookingId = 'BK-' + uuidv4().split('-')[0].toUpperCase();
  const serviceFee = SERVICE_FEES.flight;
  const total = (flight.price * passengers) + serviceFee;
  
  const booking = {
    id: bookingId,
    type: 'flight',
    userId,
    details: {
      flight: flight.airline,
      from: flight.from,
      to: flight.to,
      date: flight.date,
      passengers,
      class: travelClass || 'Economy'
    },
    pricing: {
      basePrice: flight.price * passengers,
      serviceFee,
      total
    },
    status: 'confirmed',
    createdAt: new Date()
  };
  
  // Update seats
  flight.seats -= passengers;
  bookings.set(bookingId, booking);
  
  // Send confirmation (simulate)
  console.log(`📧 Flight booking confirmation sent: ${bookingId}`);
  
  res.status(201).json({
    ...booking,
    message: 'Flight booked successfully! Confirmation details have been sent to your email.'
  });
});

// === HOTELS ===
app.get('/api/hotels', (req, res) => {
  const { location, type, maxPrice, minRating } = req.query;
  let results = [...hotels];
  
  if (location) results = results.filter(h => h.location.toLowerCase().includes(location.toLowerCase()));
  if (type) results = results.filter(h => h.type.toLowerCase() === type.toLowerCase());
  if (maxPrice) results = results.filter(h => h.price <= parseFloat(maxPrice));
  if (minRating) results = results.filter(h => h.rating >= parseFloat(minRating));
  
  res.json(results);
});

app.get('/api/hotels/:id', (req, res) => {
  const hotel = hotels.find(h => h.id === req.params.id);
  if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
  res.json(hotel);
});

app.post('/api/hotels/book', (req, res) => {
  const { hotelId, userId, checkIn, checkOut, guests, roomType } = req.body;
  
  const hotel = hotels.find(h => h.id === hotelId);
  if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
  
  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  const bookingId = 'BK-' + uuidv4().split('-')[0].toUpperCase();
  const serviceFee = SERVICE_FEES.hotel;
  const total = (hotel.price * nights) + serviceFee;
  
  const booking = {
    id: bookingId,
    type: 'hotel',
    userId,
    details: {
      hotel: hotel.name,
      location: hotel.location,
      roomType: roomType || hotel.type,
      checkIn,
      checkOut,
      nights,
      guests,
      amenities: hotel.amenities
    },
    pricing: {
      basePrice: hotel.price * nights,
      serviceFee,
      total
    },
    status: 'confirmed',
    createdAt: new Date()
  };
  
  bookings.set(bookingId, booking);
  console.log(`📧 Hotel booking confirmation sent: ${bookingId}`);
  
  res.status(201).json({
    ...booking,
    message: 'Hotel booked successfully! Confirmation details have been sent to your email.'
  });
});

// === RESTAURANTS ===
app.get('/api/restaurants', (req, res) => {
  const { location, cuisine, priceRange } = req.query;
  let results = [...restaurants];
  
  if (location) results = results.filter(r => r.location.toLowerCase().includes(location.toLowerCase()));
  if (cuisine) results = results.filter(r => r.cuisine.toLowerCase() === cuisine.toLowerCase());
  if (priceRange) results = results.filter(r => r.priceRange === priceRange);
  
  res.json(results);
});

app.get('/api/restaurants/:id', (req, res) => {
  const restaurant = restaurants.find(r => r.id === req.params.id);
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
  res.json(restaurant);
});

app.post('/api/restaurants/book', (req, res) => {
  const { restaurantId, userId, date, time, partySize, specialRequests } = req.body;
  
  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
  if (partySize > 20) return res.status(400).json({ error: 'Party size too large. Please call for large groups.' });
  
  const bookingId = 'BK-' + uuidv4().split('-')[0].toUpperCase();
  const serviceFee = SERVICE_FEES.restaurant;
  
  const booking = {
    id: bookingId,
    type: 'restaurant',
    userId,
    details: {
      restaurant: restaurant.name,
      location: restaurant.location,
      cuisine: restaurant.cuisine,
      date,
      time,
      partySize,
      specialRequests
    },
    pricing: {
      serviceFee,
      note: 'Payment settled directly at restaurant'
    },
    status: 'confirmed',
    createdAt: new Date()
  };
  
  bookings.set(bookingId, booking);
  console.log(`📧 Restaurant reservation confirmation sent: ${bookingId}`);
  
  res.status(201).json({
    ...booking,
    message: 'Reservation confirmed! Details have been sent to your email.'
  });
});

// === BOOKING MANAGEMENT ===
app.get('/api/bookings', (req, res) => {
  const { userId, type, status } = req.query;
  let results = [...bookings.values()];
  
  if (userId) results = results.filter(b => b.userId === userId);
  if (type) results = results.filter(b => b.type === type);
  if (status) results = results.filter(b => b.status === status);
  
  res.json(results);
});

app.get('/api/bookings/:id', (req, res) => {
  const booking = bookings.get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  res.json(booking);
});

app.put('/api/bookings/:id/cancel', (req, res) => {
  const booking = bookings.get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.status === 'cancelled') return res.status(400).json({ error: 'Already cancelled' });
  
  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  bookings.set(req.params.id, booking);
  
  res.json({
    ...booking,
    message: 'Booking cancelled successfully. Refund will be processed within 5-7 business days.'
  });
});

app.put('/api/bookings/:id/modify', (req, res) => {
  const booking = bookings.get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  
  const { newDate, newTime, newGuests } = req.body;
  
  if (newDate) booking.details.date = newDate;
  if (newTime) booking.details.time = newTime;
  if (newGuests) booking.details.partySize = newGuests || booking.details.guests;
  
  booking.modifiedAt = new Date();
  bookings.set(req.params.id, booking);
  
  res.json({
    ...booking,
    message: 'Booking modified successfully!'
  });
});

// === PAYMENT ===
app.post('/api/payment/process', (req, res) => {
  const { bookingId, paymentMethod, cardLast4 } = req.body;
  
  const booking = bookings.get(bookingId);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  
  // Simulate payment processing
  const paymentId = 'PAY-' + uuidv4().split('-')[0].toUpperCase();
  
  res.json({
    success: true,
    paymentId,
    bookingId,
    amount: booking.pricing?.total || booking.pricing?.serviceFee,
    message: `Payment of $${booking.pricing?.total || booking.pricing?.serviceFee} processed successfully`,
    cardLast4: cardLast4 || '4242'
  });
});

// === RECOMMENDATIONS ===
app.get('/api/recommendations', (req, res) => {
  const { type, preferences } = req.query;
  
  // Simple recommendation logic
  const recommendations = {
    flights: flights.slice(0, 3).map(f => ({ ...f, reason: 'Popular route' })),
    hotels: hotels.slice(0, 3).map(h => ({ ...h, reason: 'Highly rated' })),
    restaurants: restaurants.slice(0, 3).map(r => ({ ...r, reason: 'Customer favorite' }))
  };
  
  res.json(type ? { [type]: recommendations[type] } : recommendations);
});

// === SUBSCRIPTION ===
app.post('/api/subscription', (req, res) => {
  const { userId, plan } = req.body;
  
  const subscription = {
    userId,
    plan: plan || 'monthly',
    price: SERVICE_FEES.subscription,
    benefits: ['Unlimited bookings', 'No service fees', 'Priority support', 'Exclusive deals'],
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };
  
  res.json({
    ...subscription,
    message: 'Subscription activated! Enjoy unlimited bookings with no service fees.'
  });
});

const PORT = process.env.PORT || 3600;
app.listen(PORT, () => {
  console.log(`✈️ Booking Bot running on port ${PORT}`);
});

module.exports = app;