const SERVICE_PRICE_KEYWORDS: Array<{ keywords: string[]; amountCents: number }> = [
  { keywords: ["emergency", "urgent"], amountCents: 35000 },
  { keywords: ["hvac"], amountCents: 28000 },
  { keywords: ["clean", "cleaning"], amountCents: 22000 },
  { keywords: ["drain", "inspection"], amountCents: 18000 }
];

export function estimateAppointmentAmount(service: string) {
  const normalizedService = service.toLowerCase();

  for (const entry of SERVICE_PRICE_KEYWORDS) {
    if (entry.keywords.some((keyword) => normalizedService.includes(keyword))) {
      return entry.amountCents;
    }
  }

  return Number(process.env.DEFAULT_APPOINTMENT_AMOUNT_CENTS ?? 19000);
}
