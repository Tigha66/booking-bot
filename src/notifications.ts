// Notification Module

import { Booking } from './index';

export interface NotificationConfig {
  email: { host: string; port: number; user: string; pass: string };
  sms?: { provider: string; apiKey: string };
  telegram?: { botToken: string };
  whatsapp?: { sessionPath: string };
}

export class NotificationService {
  private config: NotificationConfig;

  constructor(config: NotificationConfig) {
    this.config = config;
  }

  async sendConfirmation(userId: string, booking: Booking): Promise<void> {
    console.log(`Sending confirmation for booking ${booking.id} to user ${userId}`);

    const message = this.formatConfirmation(booking);

    // Send via all channels
    await this.sendEmail(userId, 'Booking Confirmation', message);
    
    if (this.config.telegram) {
      await this.sendTelegram(userId, message);
    }
    
    if (this.config.whatsapp) {
      await this.sendWhatsApp(userId, message);
    }
  }

  async sendCancellation(userId: string, booking: Booking): Promise<void> {
    console.log(`Sending cancellation for booking ${booking.id} to user ${userId}`);

    const message = this.formatCancellation(booking);

    await this.sendEmail(userId, 'Booking Cancelled', message);
    
    if (this.config.telegram) {
      await this.sendTelegram(userId, message);
    }
  }

  async sendReminder(userId: string, booking: Booking, daysBefore: number): Promise<void> {
    console.log(`Sending reminder for booking ${booking.id} to user ${userId} (${daysBefore} days before)`);

    const message = this.formatReminder(booking, daysBefore);

    await this.sendEmail(userId, 'Upcoming Booking Reminder', message);
  }

  async sendPaymentReceipt(userId: string, amount: number, transactionId: string): Promise<void> {
    const message = `Payment Receipt\n\nAmount: $${amount.toFixed(2)}\nTransaction ID: ${transactionId}\n\nThank you for your booking!`;

    await this.sendEmail(userId, 'Payment Receipt', message);
  }

  // Channel-specific methods
  private async sendEmail(to: string, subject: string, message: string): Promise<void> {
    console.log(`📧 Email to ${to}: ${subject}`);
    console.log(message);
    
    // In production, use nodemailer
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({...});
  }

  private async sendTelegram(chatId: string, message: string): Promise<void> {
    console.log(`📱 Telegram to ${chatId}: ${message}`);
    
    // In production, use node-telegram-bot-api
  }

  private async sendSMS(phoneNumber: string, message: string): Promise<void> {
    console.log(`📱 SMS to ${phoneNumber}: ${message}`);
    
    // In production, use Twilio
  }

  private async sendWhatsApp(phoneNumber: string, message: string): Promise<void> {
    console.log(`📱 WhatsApp to ${phoneNumber}: ${message}`);
    
    // In production, use Twilio WhatsApp or Baileys
  }

  // Message Formatters
  private formatConfirmation(booking: Booking): string {
    let details = '';

    switch (booking.type) {
      case 'flight':
        details = `
Flight Details:
- From: ${booking.details.from}
- To: ${booking.details.to}
- Date: ${booking.details.departureTime}
- Airline: ${booking.details.airline}
- Flight #: ${booking.details.flightNumber}
`;
        break;
      case 'hotel':
        details = `
Hotel Details:
- Hotel: ${booking.details.hotel.name}
- Location: ${booking.details.hotel.location}
- Room Type: ${booking.details.roomType}
- Nights: ${booking.details.nights}
`;
        break;
      case 'restaurant':
        details = `
Restaurant Details:
- Restaurant: ${booking.details.restaurant.name}
- Date: ${booking.details.date}
- Time: ${booking.details.time}
- Party Size: ${booking.details.partySize}
`;
        break;
    }

    return `
🎫 Booking Confirmed!

Booking ID: ${booking.id}
Type: ${booking.type.toUpperCase()}
${details}
Total: $${booking.totalPrice.toFixed(2)}
Service Fee: $${booking.serviceFee.toFixed(2)}

Confirmation Code: ${booking.id}

Thank you for your booking!
    `.trim();
  }

  private formatCancellation(booking: Booking): string {
    return `
❌ Booking Cancelled

Booking ID: ${booking.id}
Type: ${booking.type.toUpperCase()}

Your booking has been cancelled.
${booking.totalPrice > 0 ? `Refund of $${booking.totalPrice.toFixed(2)} will be processed within 5-7 business days.` : ''}

If you have any questions, please contact support.
    `.trim();
  }

  private formatReminder(booking: Booking, daysBefore: number): string {
    return `
⏰ Reminder: Your booking is in ${daysBefore} day(s)!

Booking ID: ${booking.id}
Type: ${booking.type.toUpperCase()}

Don't forget:
${this.getReminderTips(booking.type)}

Need to make changes? Visit your booking management page.
    `.trim();
  }

  private getReminderTips(type: string): string {
    switch (type) {
      case 'flight':
        return '- Arrive at the airport 2 hours early\n- Check baggage allowance\n- Bring ID/passport';
      case 'hotel':
        return '- Check-in time is usually 3 PM\n- Bring ID and confirmation\n- Review hotel amenities';
      case 'restaurant':
        return '- Arrive 5 minutes early\n- Mention any dietary restrictions\n- Confirmation code ready';
      default:
        return '';
    }
  }
}
