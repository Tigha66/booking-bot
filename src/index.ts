import { FlightBooking } from './flights';
import { HotelBooking } from './hotels';
import { RestaurantBooking } from './restaurants';
import { PaymentProcessor } from './payments';
import { NotificationService } from './notifications';
import { loadConfig, AppConfig } from './config';

export interface Booking {
  id: string;
  type: 'flight' | 'hotel' | 'restaurant';
  userId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  details: any;
  totalPrice: number;
  serviceFee: number;
  createdAt: Date;
  confirmedAt?: Date;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  subscription?: {
    active: boolean;
    plan: 'free' | 'pro';
    bookingsRemaining: number;
  };
}

export class BookingBot {
  private flights: FlightBooking;
  private hotels: HotelBooking;
  private restaurants: RestaurantBooking;
  private payments: PaymentProcessor;
  private notifications: NotificationService;
  private config: AppConfig;
  private bookings: Map<string, Booking> = new Map();

  constructor(config: AppConfig) {
    this.config = config;
    this.flights = new FlightBooking(config.flights);
    this.hotels = new HotelBooking(config.hotels);
    this.restaurants = new RestaurantBooking(config.restaurants);
    this.payments = new PaymentProcessor(config.payments);
    this.notifications = new NotificationService(config.notifications);
  }

  async start(): Promise<void> {
    console.log('🎫 Starting Booking Bot...');
    console.log('✅ Booking Bot ready!');
  }

  // Flight Methods
  async searchFlights(from: string, to: string, date: string, passengers: number = 1): Promise<any[]> {
    return this.flights.search(from, to, date, passengers);
  }

  async bookFlight(flightId: string, userId: string, paymentMethodId: string): Promise<Booking> {
    const flight = await this.flights.getFlight(flightId);
    if (!flight) throw new Error('Flight not found');

    const serviceFee = this.calculateServiceFee(userId);
    const total = flight.price + serviceFee;

    // Process payment
    await this.payments.charge(userId, total, paymentMethodId);

    // Create booking
    const booking: Booking = {
      id: `BK-${Date.now()}`,
      type: 'flight',
      userId,
      status: 'confirmed',
      details: flight,
      totalPrice: total,
      serviceFee,
      createdAt: new Date(),
      confirmedAt: new Date(),
    };

    this.bookings.set(booking.id, booking);

    // Send confirmation
    await this.notifications.sendConfirmation(userId, booking);

    return booking;
  }

  // Hotel Methods
  async searchHotels(location: string, checkIn: string, checkOut: string, guests: number = 1): Promise<any[]> {
    return this.hotels.search(location, checkIn, checkOut, guests);
  }

  async bookHotel(hotelId: string, userId: string, roomType: string, paymentMethodId: string): Promise<Booking> {
    const hotel = await this.hotels.getHotel(hotelId);
    if (!hotel) throw new Error('Hotel not found');

    const room = hotel.rooms.find(r => r.type === roomType);
    if (!room) throw new Error('Room type not found');

    const nights = this.calculateNights(hotel.checkIn, hotel.checkOut);
    const total = (room.price * nights) + this.config.serviceFee;
    const serviceFee = this.config.serviceFee;

    await this.payments.charge(userId, total, paymentMethodId);

    const booking: Booking = {
      id: `BK-${Date.now()}`,
      type: 'hotel',
      userId,
      status: 'confirmed',
      details: { hotel, roomType, nights },
      totalPrice: total,
      serviceFee,
      createdAt: new Date(),
      confirmedAt: new Date(),
    };

    this.bookings.set(booking.id, booking);
    await this.notifications.sendConfirmation(userId, booking);

    return booking;
  }

  // Restaurant Methods
  async searchRestaurants(location: string, cuisine?: string, partySize: number = 2): Promise<any[]> {
    return this.restaurants.search(location, cuisine, partySize);
  }

  async bookRestaurant(restaurantId: string, userId: string, date: string, time: string, partySize: number): Promise<Booking> {
    const restaurant = await this.restaurants.getRestaurant(restaurantId);
    if (!restaurant) throw new Error('Restaurant not found');

    const booking: Booking = {
      id: `BK-${Date.now()}`,
      type: 'restaurant',
      userId,
      status: 'confirmed',
      details: { restaurant, date, time, partySize },
      totalPrice: 0,
      serviceFee: 0,
      createdAt: new Date(),
      confirmedAt: new Date(),
    };

    this.bookings.set(booking.id, booking);
    await this.notifications.sendConfirmation(userId, booking);

    return booking;
  }

  // Booking Management
  async getBooking(bookingId: string): Promise<Booking | null> {
    return this.bookings.get(bookingId) || null;
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(b => b.userId === userId);
  }

  async cancelBooking(bookingId: string, userId: string): Promise<void> {
    const booking = this.bookings.get(bookingId);
    if (!booking || booking.userId !== userId) {
      throw new Error('Booking not found');
    }

    booking.status = 'cancelled';
    
    // Process refund if applicable
    if (booking.totalPrice > 0) {
      await this.payments.refund(userId, booking.totalPrice);
    }

    await this.notifications.sendCancellation(userId, booking);
  }

  private calculateServiceFee(userId: string): number {
    // Check if user has subscription
    // For now, return default fee
    return this.config.serviceFee;
  }

  private calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }
}

export default BookingBot;
