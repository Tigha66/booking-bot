// Configuration Module

export interface AppConfig {
  flights: { apiKey: string; apiSecret: string };
  hotels: { apiKey: string; apiSecret: string };
  restaurants: { apiKey: string };
  payments: { stripeSecretKey: string; serviceFee: number };
  notifications: {
    email: { host: string; port: number; user: string; pass: string };
    telegram?: { botToken: string };
    whatsapp?: { sessionPath: string };
  };
  serviceFee: number;
}

export function loadConfig(): AppConfig {
  return {
    flights: {
      apiKey: process.env.FLIGHTS_API_KEY || '',
      apiSecret: process.env.FLIGHTS_API_SECRET || '',
    },
    hotels: {
      apiKey: process.env.HOTELS_API_KEY || '',
      apiSecret: process.env.HOTELS_API_SECRET || '',
    },
    restaurants: {
      apiKey: process.env.RESTAURANTS_API_KEY || '',
    },
    payments: {
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
      serviceFee: parseFloat(process.env.SERVICE_FEE || '2.99'),
    },
    notifications: {
      email: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '465'),
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
      telegram: process.env.TELEGRAM_BOT_TOKEN ? { botToken: process.env.TELEGRAM_BOT_TOKEN } : undefined,
      whatsapp: process.env.WHATSAPP_SESSION ? { sessionPath: process.env.WHATSAPP_SESSION } : undefined,
    },
    serviceFee: parseFloat(process.env.SERVICE_FEE || '2.99'),
  };
}

export default loadConfig;
