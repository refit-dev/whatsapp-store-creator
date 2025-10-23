import { buildWhatsAppUrl } from '../utils/wa';

const url = buildWhatsAppUrl({
  phoneE164: '+919999999999',
  currency: 'INR',
  paymentLink: 'https://pay.test/link',
  buyer: { name: 'Test', phone: '+91 99999 99999', address: 'Addr', notes: 'No onions' },
  items: [
    { title: 'Bread', qty: 1, priceCents: 4999 },
    { title: 'Cake', qty: 2, priceCents: 1299 },
  ],
});

if (!url.startsWith('https://wa.me/919999999999?text=')) {
  throw new Error('E164 formatting failed');
}

const decoded = decodeURIComponent(url.split('text=')[1]);
if (!decoded.includes('Bread ×1') || !decoded.includes('Cake ×2')) {
  throw new Error('Items missing in message');
}
if (!decoded.includes('Total:')) {
  throw new Error('Total missing');
}
console.log('utils/wa.ts tests passed');
