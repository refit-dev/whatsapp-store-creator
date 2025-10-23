export const toCents = (amount: number | string) => {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Math.round(n * 100);
};

export const formatMoney = (amountCents: number, currency: string) =>
  (amountCents / 100).toLocaleString(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });
