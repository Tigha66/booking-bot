export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const flights = [
    { id: 'FL001', airline: 'British Airways', from: 'London', to: 'New York', date: '2026-03-15', price: 450, seats: 10 },
    { id: 'FL002', airline: 'Emirates', from: 'London', to: 'Dubai', date: '2026-03-16', price: 380, seats: 15 },
    { id: 'FL003', airline: 'Lufthansa', from: 'London', to: 'Berlin', date: '2026-03-17', price: 120, seats: 20 },
    { id: 'FL004', airline: 'Air France', from: 'London', to: 'Paris', date: '2026-03-18', price: 95, seats: 25 }
  ];
  
  res.status(200).json(flights);
}