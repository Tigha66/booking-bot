# Booking & Reservation Bot 🤖

Automated Booking & Reservation Bot that handles flights, hotels, and restaurant reservations.

## Features

### ✈️ Flight Bookings
- Search flights by destination, dates, and budget
- Book flights with instant confirmation

### 🏨 Hotel Reservations
- Search hotels by location and preferences
- Book rooms with amenities filtering

### 🍽️ Restaurant Reservations
- Find restaurants by cuisine, location, and availability
- Make reservations for specific dates and party sizes

### 💳 Payment Integration
- Service fees per reservation
- Monthly subscription option for frequent users
- Payment gateway integration ready (Stripe/PayPal)

### 📱 Notifications
- Confirmation details sent via email/SMS
- Booking modifications and cancellations

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/api/flights` | Search flights |
| GET | `/api/hotels` | Search hotels |
| GET | `/api/restaurants` | Search restaurants |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/:id` | Get booking status |
| PATCH | `/api/bookings/:id` | Modify booking |
| DELETE | `/api/bookings/:id` | Cancel booking |
| POST | `/api/subscribe` | Monthly subscription |
| GET | `/api/fees` | Service fee info |

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Environment Variables

Create a `.env` file:
```
PORT=3000
STRIPE_API_KEY=your_stripe_key
PAYPAL_CLIENT_ID=your_paypal_id
```

## License

MIT
