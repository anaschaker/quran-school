export type SchoolHourEntry = {
  days: string;
  time: string;
};

export type SchoolSettings = {
  name: string;
  phone: string;
  address: string;
  hours: SchoolHourEntry[];
  aboutIntro: string;
  currency: string;
  /** سعر صرف الدولار مقابل الليرة اللبنانية. */
  exchangeRate: number;
};

const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const rateFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const lbpFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

/** صياغة المبلغ بالعملة الأساسية فقط (مثال: 200.00 $). */
export function formatBaseAmount(amount: number, currency: string): string {
  return `${amountFormatter.format(amount)} ${currency}`;
}

/** صياغة المبلغ بالليرة اللبنانية وفق سعر الصرف. */
export function formatLbpAmount(amount: number, exchangeRate: number): string {
  if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) return "";
  return `${lbpFormatter.format(amount * exchangeRate)} ل.ل`;
}

/** صياغة سعر الصرف (مثال: 90,000). */
export function formatExchangeRate(rate: number): string {
  return rateFormatter.format(rate);
}

/**
 * صياغة مبلغ بالعملة الأساسية مع ما يعادله بالليرة (إن وُجد سعر صرف).
 * مثال: 200.00 $ (18,000,000 ل.ل).
 */
export function formatMoney(
  amount: number,
  settings: Pick<SchoolSettings, "currency" | "exchangeRate">,
): string {
  const base = formatBaseAmount(amount, settings.currency);
  const lbp = formatLbpAmount(amount, settings.exchangeRate);

  return lbp ? `${base} (${lbp})` : base;
}
