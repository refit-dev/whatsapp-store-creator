export function toLocaleString(amountCents: number, currency: string) {
  // Use specific locale for consistency between server and client
  // For INR, use 'en-IN' locale for proper formatting
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: currency === 'INR' ? 0 : 2, // INR typically shown without decimals
    maximumFractionDigits: currency === 'INR' ? 0 : 2,
  }).format(amountCents / 100);
}