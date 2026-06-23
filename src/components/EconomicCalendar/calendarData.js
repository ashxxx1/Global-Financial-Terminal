// Economic Calendar seed data — realistic macro events for 2026

export const CALENDAR_EVENTS = [
  // June 2026
  { id: "ev1", date: "2026-06-23", time: "08:30", country: "US", countryFlag: "🇺🇸", event: "Initial Jobless Claims", importance: "medium", forecast: "218K", previous: "221K", actual: null, category: "Employment" },
  { id: "ev2", date: "2026-06-23", time: "10:00", country: "US", countryFlag: "🇺🇸", event: "Existing Home Sales (MoM)", importance: "medium", forecast: "3.85M", previous: "3.78M", actual: null, category: "Housing" },
  { id: "ev3", date: "2026-06-24", time: "09:00", country: "DE", countryFlag: "🇩🇪", event: "Germany Ifo Business Climate", importance: "high", forecast: "88.1", previous: "87.5", actual: null, category: "Business Confidence" },
  { id: "ev4", date: "2026-06-24", time: "13:00", country: "UK", countryFlag: "🇬🇧", event: "UK Retail Sales (MoM)", importance: "high", forecast: "0.4%", previous: "-0.5%", actual: null, category: "Consumer" },
  { id: "ev5", date: "2026-06-25", time: "08:30", country: "US", countryFlag: "🇺🇸", event: "Core PCE Price Index (MoM)", importance: "high", forecast: "0.2%", previous: "0.3%", actual: null, category: "Inflation" },
  { id: "ev6", date: "2026-06-25", time: "08:30", country: "US", countryFlag: "🇺🇸", event: "Personal Spending (MoM)", importance: "medium", forecast: "0.3%", previous: "0.2%", actual: null, category: "Consumer" },
  { id: "ev7", date: "2026-06-25", time: "14:00", country: "US", countryFlag: "🇺🇸", event: "University of Michigan Sentiment", importance: "medium", forecast: "68.5", previous: "67.4", actual: null, category: "Consumer Confidence" },
  { id: "ev8", date: "2026-06-26", time: "09:30", country: "EU", countryFlag: "🇪🇺", event: "ECB President Lagarde Speech", importance: "high", forecast: null, previous: null, actual: null, category: "Central Bank" },
  { id: "ev9", date: "2026-06-27", time: "00:30", country: "JP", countryFlag: "🇯🇵", event: "Japan Industrial Production (MoM)", importance: "medium", forecast: "1.2%", previous: "-0.8%", actual: null, category: "Manufacturing" },
  { id: "ev10", date: "2026-06-27", time: "09:30", country: "US", countryFlag: "🇺🇸", event: "Chicago PMI", importance: "medium", forecast: "43.5", previous: "42.7", actual: null, category: "Manufacturing" },
  
  // Already happened (with actuals)
  { id: "ev11", date: "2026-06-18", time: "08:30", country: "US", countryFlag: "🇺🇸", event: "CPI (YoY)", importance: "high", forecast: "3.1%", previous: "3.4%", actual: "2.9%", category: "Inflation" },
  { id: "ev12", date: "2026-06-18", time: "08:30", country: "US", countryFlag: "🇺🇸", event: "Core CPI (YoY)", importance: "high", forecast: "3.5%", previous: "3.8%", actual: "3.3%", category: "Inflation" },
  { id: "ev13", date: "2026-06-19", time: "12:30", country: "US", countryFlag: "🇺🇸", event: "FOMC Rate Decision", importance: "high", forecast: "5.25%", previous: "5.50%", actual: "5.25%", category: "Central Bank" },
  { id: "ev14", date: "2026-06-19", time: "14:30", country: "US", countryFlag: "🇺🇸", event: "Fed Chair Powell Press Conference", importance: "high", forecast: null, previous: null, actual: "Hawkish tone — no cuts implied", category: "Central Bank" },
  { id: "ev15", date: "2026-06-20", time: "09:00", country: "EU", countryFlag: "🇪🇺", event: "Eurozone CPI (YoY)", importance: "high", forecast: "2.4%", previous: "2.6%", actual: "2.2%", category: "Inflation" },
  { id: "ev16", date: "2026-06-20", time: "09:30", country: "UK", countryFlag: "🇬🇧", event: "UK CPI (YoY)", importance: "high", forecast: "2.0%", previous: "2.3%", actual: "2.1%", category: "Inflation" },
  { id: "ev17", date: "2026-06-21", time: "04:00", country: "CN", countryFlag: "🇨🇳", event: "China Industrial Production (YoY)", importance: "high", forecast: "5.8%", previous: "5.5%", actual: "5.4%", category: "Manufacturing" },
  { id: "ev18", date: "2026-06-21", time: "09:00", country: "DE", countryFlag: "🇩🇪", event: "Germany Manufacturing PMI", importance: "high", forecast: "44.5", previous: "43.7", actual: "43.2", category: "Manufacturing" },
  { id: "ev19", date: "2026-06-21", time: "09:30", country: "UK", countryFlag: "🇬🇧", event: "Bank of England Rate Decision", importance: "high", forecast: "4.75%", previous: "5.00%", actual: "4.75%", category: "Central Bank" },
  { id: "ev20", date: "2026-06-17", time: "08:30", country: "US", countryFlag: "🇺🇸", event: "Non-Farm Payrolls", importance: "high", forecast: "175K", previous: "165K", actual: "205K", category: "Employment" },
  { id: "ev21", date: "2026-06-17", time: "08:30", country: "US", countryFlag: "🇺🇸", event: "Unemployment Rate", importance: "high", forecast: "4.0%", previous: "3.9%", actual: "3.9%", category: "Employment" },

  // Upcoming this week
  { id: "ev22", date: "2026-06-30", time: "08:30", country: "US", countryFlag: "🇺🇸", event: "GDP (QoQ, Final)", importance: "high", forecast: "1.4%", previous: "1.6%", actual: null, category: "GDP" },
  { id: "ev23", date: "2026-07-01", time: "09:00", country: "EU", countryFlag: "🇪🇺", event: "Eurozone Manufacturing PMI", importance: "high", forecast: "46.2", previous: "45.8", actual: null, category: "Manufacturing" },
  { id: "ev24", date: "2026-07-01", time: "10:00", country: "US", countryFlag: "🇺🇸", event: "ISM Manufacturing PMI", importance: "high", forecast: "49.5", previous: "48.7", actual: null, category: "Manufacturing" },
  { id: "ev25", date: "2026-07-03", time: "08:30", country: "US", countryFlag: "🇺🇸", event: "Non-Farm Payrolls (Jul)", importance: "high", forecast: "185K", previous: "205K", actual: null, category: "Employment" },
  { id: "ev26", date: "2026-07-03", time: "08:30", country: "US", countryFlag: "🇺🇸", event: "Unemployment Rate (Jul)", importance: "high", forecast: "3.9%", previous: "3.9%", actual: null, category: "Employment" },
  { id: "ev27", date: "2026-07-08", time: "09:30", country: "CN", countryFlag: "🇨🇳", event: "China CPI (YoY)", importance: "high", forecast: "0.1%", previous: "-0.3%", actual: null, category: "Inflation" },
  { id: "ev28", date: "2026-07-09", time: "14:00", country: "US", countryFlag: "🇺🇸", event: "FOMC Meeting Minutes", importance: "high", forecast: null, previous: null, actual: null, category: "Central Bank" },
  { id: "ev29", date: "2026-07-10", time: "08:30", country: "US", countryFlag: "🇺🇸", event: "CPI (YoY)", importance: "high", forecast: "2.8%", previous: "2.9%", actual: null, category: "Inflation" },
  { id: "ev30", date: "2026-07-10", time: "08:30", country: "US", countryFlag: "🇺🇸", event: "Core CPI (YoY)", importance: "high", forecast: "3.1%", previous: "3.3%", actual: null, category: "Inflation" },
  { id: "ev31", date: "2026-07-11", time: "02:00", country: "JP", countryFlag: "🇯🇵", event: "Bank of Japan Rate Decision", importance: "high", forecast: "0.25%", previous: "0.10%", actual: null, category: "Central Bank" },
  { id: "ev32", date: "2026-07-15", time: "08:30", country: "US", countryFlag: "🇺🇸", event: "Retail Sales (MoM)", importance: "high", forecast: "0.4%", previous: "0.1%", actual: null, category: "Consumer" },
];

export function getUpcomingEvents(limit = 5) {
  const now = new Date();
  return CALENDAR_EVENTS
    .filter((e) => new Date(`${e.date}T${e.time}`) > now && !e.actual)
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
    .slice(0, limit);
}

export function getNextHighImpactEvent() {
  const now = new Date();
  return CALENDAR_EVENTS.find(
    (e) => e.importance === "high" && new Date(`${e.date}T${e.time}`) > now && !e.actual
  );
}
