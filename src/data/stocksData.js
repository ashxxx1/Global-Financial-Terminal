/**
 * Comprehensive stock data for all 68 tracked countries.
 * Each entry: { ticker, name, price, changePct, currency, sector }
 * Sectors: Banking & Finance | Energy | Technology | Telecom | Consumer |
 *          Healthcare | Mining & Resources | Real Estate | Industrial |
 *          Utilities | Automotive | Media | Transportation | Defence
 */
export const STOCKS_BY_COUNTRY = {

  /* ─── AMERICAS ─────────────────────────────────────────────────────────── */

  US: [
    { ticker: "AAPL",   name: "Apple Inc.",           price: 212.49,  changePct: +2.34, currency: "$", sector: "Technology" },
    { ticker: "MSFT",   name: "Microsoft Corp.",       price: 431.87,  changePct: +1.12, currency: "$", sector: "Technology" },
    { ticker: "NVDA",   name: "Nvidia Corp.",          price: 134.25,  changePct: +4.67, currency: "$", sector: "Technology" },
    { ticker: "GOOGL",  name: "Alphabet Inc.",         price: 176.34,  changePct: +1.45, currency: "$", sector: "Technology" },
    { ticker: "META",   name: "Meta Platforms",        price: 567.23,  changePct: +2.01, currency: "$", sector: "Technology" },
    { ticker: "AMZN",   name: "Amazon.com Inc.",       price: 198.73,  changePct: +0.89, currency: "$", sector: "Consumer" },
    { ticker: "TSLA",   name: "Tesla Inc.",            price: 245.67,  changePct: -1.23, currency: "$", sector: "Automotive" },
    { ticker: "JPM",    name: "JPMorgan Chase",        price: 234.56,  changePct: +0.78, currency: "$", sector: "Banking & Finance" },
    { ticker: "BAC",    name: "Bank of America",       price: 42.34,   changePct: +0.45, currency: "$", sector: "Banking & Finance" },
    { ticker: "GS",     name: "Goldman Sachs",         price: 512.34,  changePct: +0.92, currency: "$", sector: "Banking & Finance" },
    { ticker: "XOM",    name: "ExxonMobil Corp.",      price: 117.89,  changePct: -0.45, currency: "$", sector: "Energy" },
    { ticker: "CVX",    name: "Chevron Corp.",         price: 156.78,  changePct: -0.34, currency: "$", sector: "Energy" },
    { ticker: "UNH",    name: "UnitedHealth Group",    price: 512.34,  changePct: -0.67, currency: "$", sector: "Healthcare" },
    { ticker: "JNJ",    name: "Johnson & Johnson",     price: 145.67,  changePct: +0.23, currency: "$", sector: "Healthcare" },
    { ticker: "PG",     name: "Procter & Gamble",      price: 167.89,  changePct: +0.34, currency: "$", sector: "Consumer" },
    { ticker: "V",      name: "Visa Inc.",             price: 287.34,  changePct: +0.56, currency: "$", sector: "Banking & Finance" },
    { ticker: "MA",     name: "Mastercard Inc.",       price: 478.90,  changePct: +0.67, currency: "$", sector: "Banking & Finance" },
    { ticker: "LMT",    name: "Lockheed Martin",       price: 456.78,  changePct: +1.23, currency: "$", sector: "Defence" },
    { ticker: "RTX",    name: "RTX Corp.",             price: 123.45,  changePct: +0.89, currency: "$", sector: "Defence" },
    { ticker: "BRK.B",  name: "Berkshire Hathaway",    price: 398.45,  changePct: +0.34, currency: "$", sector: "Banking & Finance" },
  ],

  GB: [
    { ticker: "SHEL",  name: "Shell plc",              price: 28.45,   changePct: -0.34, currency: "£", sector: "Energy" },
    { ticker: "BP",    name: "BP plc",                 price: 5.12,    changePct: -0.78, currency: "£", sector: "Energy" },
    { ticker: "HSBA",  name: "HSBC Holdings",          price: 7.23,    changePct: +0.56, currency: "£", sector: "Banking & Finance" },
    { ticker: "LLOY",  name: "Lloyds Banking Group",   price: 0.56,    changePct: -0.23, currency: "£", sector: "Banking & Finance" },
    { ticker: "BARC",  name: "Barclays plc",           price: 2.34,    changePct: +0.45, currency: "£", sector: "Banking & Finance" },
    { ticker: "AZN",   name: "AstraZeneca",            price: 123.45,  changePct: +1.23, currency: "£", sector: "Healthcare" },
    { ticker: "GSK",   name: "GSK plc",                price: 16.78,   changePct: +0.67, currency: "£", sector: "Healthcare" },
    { ticker: "ULVR",  name: "Unilever",               price: 42.34,   changePct: -0.45, currency: "£", sector: "Consumer" },
    { ticker: "DGE",   name: "Diageo plc",             price: 23.45,   changePct: -0.89, currency: "£", sector: "Consumer" },
    { ticker: "VOD",   name: "Vodafone Group",         price: 0.72,    changePct: -1.23, currency: "£", sector: "Telecom" },
    { ticker: "BT.A",  name: "BT Group",               price: 1.45,    changePct: +0.34, currency: "£", sector: "Telecom" },
    { ticker: "RIO",   name: "Rio Tinto",              price: 45.67,   changePct: +0.78, currency: "£", sector: "Mining & Resources" },
    { ticker: "AAL",   name: "Anglo American",         price: 21.34,   changePct: -1.12, currency: "£", sector: "Mining & Resources" },
    { ticker: "LSEG",  name: "London Stock Exchange",  price: 104.56,  changePct: +0.89, currency: "£", sector: "Banking & Finance" },
    { ticker: "BATS",  name: "BAT Industries",         price: 22.34,   changePct: +0.12, currency: "£", sector: "Consumer" },
  ],

  JP: [
    { ticker: "7203",  name: "Toyota Motor",           price: 2834,    changePct: +1.45, currency: "¥", sector: "Automotive" },
    { ticker: "7267",  name: "Honda Motor",            price: 1423,    changePct: +0.89, currency: "¥", sector: "Automotive" },
    { ticker: "7270",  name: "Subaru Corp.",           price: 2123,    changePct: +0.67, currency: "¥", sector: "Automotive" },
    { ticker: "6758",  name: "Sony Group",             price: 13450,   changePct: +2.34, currency: "¥", sector: "Technology" },
    { ticker: "6861",  name: "Keyence Corp.",          price: 67890,   changePct: +1.67, currency: "¥", sector: "Technology" },
    { ticker: "6501",  name: "Hitachi",                price: 3456,    changePct: +1.12, currency: "¥", sector: "Industrial" },
    { ticker: "9984",  name: "SoftBank Group",         price: 9234,    changePct: +3.12, currency: "¥", sector: "Technology" },
    { ticker: "9432",  name: "NTT Corp.",              price: 167,     changePct: +0.45, currency: "¥", sector: "Telecom" },
    { ticker: "9433",  name: "KDDI Corp.",             price: 4234,    changePct: +0.34, currency: "¥", sector: "Telecom" },
    { ticker: "8306",  name: "Mitsubishi UFJ",         price: 1567,    changePct: +0.78, currency: "¥", sector: "Banking & Finance" },
    { ticker: "8316",  name: "Sumitomo Mitsui",        price: 3456,    changePct: +0.56, currency: "¥", sector: "Banking & Finance" },
    { ticker: "4519",  name: "Chugai Pharma",          price: 4567,    changePct: -0.45, currency: "¥", sector: "Healthcare" },
    { ticker: "4568",  name: "Daiichi Sankyo",         price: 4123,    changePct: +0.89, currency: "¥", sector: "Healthcare" },
    { ticker: "9020",  name: "East Japan Railway",     price: 8234,    changePct: +0.34, currency: "¥", sector: "Transportation" },
  ],

  DE: [
    { ticker: "VOW3",  name: "Volkswagen AG",          price: 112.34,  changePct: -2.34, currency: "€", sector: "Automotive" },
    { ticker: "BMW",   name: "BMW AG",                 price: 87.45,   changePct: -1.56, currency: "€", sector: "Automotive" },
    { ticker: "MBG",   name: "Mercedes-Benz",          price: 67.34,   changePct: -1.23, currency: "€", sector: "Automotive" },
    { ticker: "SIE",   name: "Siemens AG",             price: 198.45,  changePct: +0.67, currency: "€", sector: "Industrial" },
    { ticker: "SAP",   name: "SAP SE",                 price: 198.56,  changePct: +1.23, currency: "€", sector: "Technology" },
    { ticker: "BAYN",  name: "Bayer AG",               price: 28.34,   changePct: -0.89, currency: "€", sector: "Healthcare" },
    { ticker: "ALV",   name: "Allianz SE",             price: 287.34,  changePct: -0.34, currency: "€", sector: "Banking & Finance" },
    { ticker: "DBK",   name: "Deutsche Bank",          price: 16.78,   changePct: -0.67, currency: "€", sector: "Banking & Finance" },
    { ticker: "DTE",   name: "Deutsche Telekom",       price: 23.45,   changePct: +0.45, currency: "€", sector: "Telecom" },
    { ticker: "EOAN",  name: "E.ON SE",                price: 12.34,   changePct: +0.23, currency: "€", sector: "Utilities" },
    { ticker: "RWE",   name: "RWE AG",                 price: 34.56,   changePct: +0.56, currency: "€", sector: "Utilities" },
    { ticker: "BAS",   name: "BASF SE",                price: 45.67,   changePct: -0.78, currency: "€", sector: "Industrial" },
    { ticker: "MRK",   name: "Merck KGaA",             price: 145.67,  changePct: +0.89, currency: "€", sector: "Healthcare" },
    { ticker: "DHER",  name: "Delivery Hero",          price: 23.45,   changePct: -1.34, currency: "€", sector: "Consumer" },
  ],

  CN: [
    { ticker: "600519", name: "Kweichow Moutai",       price: 1567.89, changePct: +2.34, currency: "¥", sector: "Consumer" },
    { ticker: "002594", name: "BYD Co.",               price: 298.45,  changePct: +3.12, currency: "¥", sector: "Automotive" },
    { ticker: "601398", name: "ICBC",                  price: 6.23,    changePct: +0.45, currency: "¥", sector: "Banking & Finance" },
    { ticker: "601288", name: "Agricultural Bank",     price: 4.56,    changePct: +0.34, currency: "¥", sector: "Banking & Finance" },
    { ticker: "600036", name: "China Merchants Bank",  price: 34.56,   changePct: +1.12, currency: "¥", sector: "Banking & Finance" },
    { ticker: "601318", name: "Ping An Insurance",     price: 45.67,   changePct: +0.78, currency: "¥", sector: "Banking & Finance" },
    { ticker: "000333", name: "Midea Group",           price: 67.89,   changePct: +1.56, currency: "¥", sector: "Industrial" },
    { ticker: "600900", name: "Yangtze Power",         price: 23.45,   changePct: +0.56, currency: "¥", sector: "Utilities" },
    { ticker: "601899", name: "Zijin Mining",          price: 14.56,   changePct: +2.34, currency: "¥", sector: "Mining & Resources" },
    { ticker: "601012", name: "LONGi Green Energy",    price: 23.45,   changePct: +1.89, currency: "¥", sector: "Energy" },
    { ticker: "300750", name: "CATL",                  price: 234.56,  changePct: +2.67, currency: "¥", sector: "Technology" },
    { ticker: "600941", name: "China Mobile",          price: 78.90,   changePct: +0.67, currency: "¥", sector: "Telecom" },
    { ticker: "002415", name: "Hikvision",             price: 34.56,   changePct: -0.89, currency: "¥", sector: "Technology" },
    { ticker: "601166", name: "Industrial Bank",       price: 18.34,   changePct: +0.45, currency: "¥", sector: "Banking & Finance" },
  ],

  IN: [
    { ticker: "RELIANCE",  name: "Reliance Industries", price: 2987.45, changePct: +1.56, currency: "₹", sector: "Energy" },
    { ticker: "TCS",       name: "Tata Consultancy",    price: 3876.23, changePct: +0.89, currency: "₹", sector: "Technology" },
    { ticker: "INFY",      name: "Infosys Ltd.",        price: 1567.89, changePct: +0.67, currency: "₹", sector: "Technology" },
    { ticker: "WIPRO",     name: "Wipro Ltd.",          price: 478.90,  changePct: +1.12, currency: "₹", sector: "Technology" },
    { ticker: "HCLTECH",   name: "HCL Technologies",    price: 1678.45, changePct: +0.89, currency: "₹", sector: "Technology" },
    { ticker: "HDFCBANK",  name: "HDFC Bank",           price: 1745.67, changePct: +1.23, currency: "₹", sector: "Banking & Finance" },
    { ticker: "ICICIBANK", name: "ICICI Bank",          price: 1234.56, changePct: +1.45, currency: "₹", sector: "Banking & Finance" },
    { ticker: "AXISBANK",  name: "Axis Bank",           price: 1123.45, changePct: +0.78, currency: "₹", sector: "Banking & Finance" },
    { ticker: "SBIN",      name: "State Bank of India", price: 823.45,  changePct: +0.56, currency: "₹", sector: "Banking & Finance" },
    { ticker: "KOTAKBANK", name: "Kotak Mahindra Bank", price: 1878.90, changePct: +0.34, currency: "₹", sector: "Banking & Finance" },
    { ticker: "BHARTIARTL",name: "Bharti Airtel",       price: 1678.34, changePct: +1.45, currency: "₹", sector: "Telecom" },
    { ticker: "TATAMOTORS",name: "Tata Motors",         price: 1023.45, changePct: +2.34, currency: "₹", sector: "Automotive" },
    { ticker: "MARUTI",    name: "Maruti Suzuki",       price: 12456.78,changePct: +1.12, currency: "₹", sector: "Automotive" },
    { ticker: "ONGC",      name: "ONGC Ltd.",           price: 267.89,  changePct: +0.45, currency: "₹", sector: "Energy" },
    { ticker: "HINDUNILVR",name: "Hindustan Unilever",  price: 2456.78, changePct: -0.34, currency: "₹", sector: "Consumer" },
    { ticker: "ADANIENT",  name: "Adani Enterprises",   price: 2867.34, changePct: +2.34, currency: "₹", sector: "Industrial" },
    { ticker: "BAJFINANCE",name: "Bajaj Finance",       price: 7234.56, changePct: +0.56, currency: "₹", sector: "Banking & Finance" },
    { ticker: "LT",        name: "Larsen & Toubro",     price: 3567.89, changePct: +0.89, currency: "₹", sector: "Industrial" },
    { ticker: "SUNPHARMA", name: "Sun Pharma",          price: 1678.45, changePct: +0.67, currency: "₹", sector: "Healthcare" },
    { ticker: "DRREDDY",   name: "Dr. Reddy's Labs",    price: 6789.45, changePct: +0.45, currency: "₹", sector: "Healthcare" },
  ],

  BR: [
    { ticker: "PETR4",  name: "Petrobras",             price: 38.45,   changePct: -1.23, currency: "R$", sector: "Energy" },
    { ticker: "VALE3",  name: "Vale S.A.",              price: 56.78,   changePct: -0.89, currency: "R$", sector: "Mining & Resources" },
    { ticker: "ITUB4",  name: "Itaú Unibanco",         price: 34.56,   changePct: -0.45, currency: "R$", sector: "Banking & Finance" },
    { ticker: "BBDC4",  name: "Bradesco",              price: 14.23,   changePct: -0.78, currency: "R$", sector: "Banking & Finance" },
    { ticker: "BBAS3",  name: "Banco do Brasil",       price: 23.45,   changePct: -0.56, currency: "R$", sector: "Banking & Finance" },
    { ticker: "ABEV3",  name: "Ambev S.A.",            price: 12.34,   changePct: -1.45, currency: "R$", sector: "Consumer" },
    { ticker: "MGLU3",  name: "Magazine Luiza",        price: 3.45,    changePct: -2.34, currency: "R$", sector: "Consumer" },
    { ticker: "WEGE3",  name: "WEG S.A.",              price: 45.67,   changePct: +0.89, currency: "R$", sector: "Industrial" },
    { ticker: "VIVT3",  name: "Vivo / Telefônica",     price: 56.78,   changePct: +0.34, currency: "R$", sector: "Telecom" },
    { ticker: "RENT3",  name: "Localiza",              price: 67.89,   changePct: +0.56, currency: "R$", sector: "Transportation" },
  ],

  AU: [
    { ticker: "BHP",   name: "BHP Group",              price: 45.23,   changePct: +1.12, currency: "A$", sector: "Mining & Resources" },
    { ticker: "RIO",   name: "Rio Tinto",              price: 123.45,  changePct: +0.78, currency: "A$", sector: "Mining & Resources" },
    { ticker: "FMG",   name: "Fortescue Metals",       price: 23.45,   changePct: +1.67, currency: "A$", sector: "Mining & Resources" },
    { ticker: "CBA",   name: "Commonwealth Bank",      price: 123.45,  changePct: +0.89, currency: "A$", sector: "Banking & Finance" },
    { ticker: "NAB",   name: "National Australia Bank",price: 34.56,   changePct: +0.67, currency: "A$", sector: "Banking & Finance" },
    { ticker: "ANZ",   name: "ANZ Banking Group",      price: 28.34,   changePct: +0.45, currency: "A$", sector: "Banking & Finance" },
    { ticker: "WBC",   name: "Westpac Banking",        price: 24.56,   changePct: +0.34, currency: "A$", sector: "Banking & Finance" },
    { ticker: "WOW",   name: "Woolworths Group",       price: 34.56,   changePct: +0.23, currency: "A$", sector: "Consumer" },
    { ticker: "CSL",   name: "CSL Limited",            price: 287.45,  changePct: +1.23, currency: "A$", sector: "Healthcare" },
    { ticker: "WDS",   name: "Woodside Energy",        price: 28.45,   changePct: -0.67, currency: "A$", sector: "Energy" },
    { ticker: "QAN",   name: "Qantas Airways",         price: 6.78,    changePct: +0.89, currency: "A$", sector: "Transportation" },
    { ticker: "TLS",   name: "Telstra Group",          price: 3.89,    changePct: +0.12, currency: "A$", sector: "Telecom" },
  ],

  CA: [
    { ticker: "RY",    name: "Royal Bank of Canada",   price: 134.56,  changePct: +0.67, currency: "C$", sector: "Banking & Finance" },
    { ticker: "TD",    name: "Toronto-Dominion Bank",  price: 78.45,   changePct: +0.45, currency: "C$", sector: "Banking & Finance" },
    { ticker: "BNS",   name: "Bank of Nova Scotia",    price: 56.78,   changePct: +0.34, currency: "C$", sector: "Banking & Finance" },
    { ticker: "CNQ",   name: "Canadian Natural Resources",price: 45.67,changePct: -0.23, currency: "C$", sector: "Energy" },
    { ticker: "SU",    name: "Suncor Energy",          price: 51.23,   changePct: -0.45, currency: "C$", sector: "Energy" },
    { ticker: "SHOP",  name: "Shopify Inc.",           price: 87.45,   changePct: +2.34, currency: "C$", sector: "Technology" },
    { ticker: "CNR",   name: "Canadian National Railway",price: 156.78,changePct: +0.56, currency: "C$", sector: "Transportation" },
    { ticker: "BCE",   name: "BCE Inc.",               price: 34.56,   changePct: -0.89, currency: "C$", sector: "Telecom" },
    { ticker: "BAM",   name: "Brookfield Asset Mgmt",  price: 45.67,   changePct: +1.23, currency: "C$", sector: "Banking & Finance" },
    { ticker: "ABX",   name: "Barrick Gold",           price: 21.34,   changePct: +0.78, currency: "C$", sector: "Mining & Resources" },
  ],

  FR: [
    { ticker: "MC",    name: "LVMH Moët Hennessy",     price: 623.45,  changePct: +1.23, currency: "€", sector: "Consumer" },
    { ticker: "OR",    name: "L'Oréal",                price: 378.45,  changePct: +0.89, currency: "€", sector: "Consumer" },
    { ticker: "TTE",   name: "TotalEnergies",          price: 56.78,   changePct: -0.56, currency: "€", sector: "Energy" },
    { ticker: "SAN",   name: "Sanofi",                 price: 87.45,   changePct: +0.45, currency: "€", sector: "Healthcare" },
    { ticker: "AIR",   name: "Airbus SE",              price: 156.78,  changePct: +0.89, currency: "€", sector: "Industrial" },
    { ticker: "BNP",   name: "BNP Paribas",            price: 67.89,   changePct: -0.34, currency: "€", sector: "Banking & Finance" },
    { ticker: "ACA",   name: "Crédit Agricole",        price: 13.45,   changePct: -0.23, currency: "€", sector: "Banking & Finance" },
    { ticker: "GLE",   name: "Société Générale",       price: 23.45,   changePct: -0.78, currency: "€", sector: "Banking & Finance" },
    { ticker: "SGO",   name: "Saint-Gobain",           price: 78.45,   changePct: +0.56, currency: "€", sector: "Industrial" },
    { ticker: "KER",   name: "Kering SA",              price: 234.56,  changePct: -1.23, currency: "€", sector: "Consumer" },
    { ticker: "CAP",   name: "Capgemini",              price: 198.45,  changePct: +1.45, currency: "€", sector: "Technology" },
    { ticker: "DG",    name: "Vinci SA",               price: 112.34,  changePct: +0.67, currency: "€", sector: "Industrial" },
  ],

  SA: [
    { ticker: "2222",  name: "Saudi Aramco",           price: 29.45,   changePct: +1.12, currency: "SAR", sector: "Energy" },
    { ticker: "2010",  name: "SABIC",                  price: 87.34,   changePct: +0.67, currency: "SAR", sector: "Industrial" },
    { ticker: "1180",  name: "Al Rajhi Bank",          price: 89.45,   changePct: +1.23, currency: "SAR", sector: "Banking & Finance" },
    { ticker: "1050",  name: "NCB / SNB",              price: 34.56,   changePct: +0.89, currency: "SAR", sector: "Banking & Finance" },
    { ticker: "7010",  name: "STC (Telecom)",          price: 45.67,   changePct: +0.56, currency: "SAR", sector: "Telecom" },
    { ticker: "4001",  name: "Saudi Electricity",      price: 23.45,   changePct: +0.34, currency: "SAR", sector: "Utilities" },
    { ticker: "4030",  name: "Kingdom Holding",        price: 12.34,   changePct: +0.45, currency: "SAR", sector: "Real Estate" },
    { ticker: "2030",  name: "Saudi Cement",           price: 56.78,   changePct: -0.23, currency: "SAR", sector: "Industrial" },
    { ticker: "1211",  name: "Alinma Bank",            price: 23.45,   changePct: +0.78, currency: "SAR", sector: "Banking & Finance" },
    { ticker: "4220",  name: "Saudi Airlines Catering",price: 67.89,   changePct: +0.45, currency: "SAR", sector: "Transportation" },
  ],

  KR: [
    { ticker: "005930", name: "Samsung Electronics",  price: 78900,   changePct: +1.56, currency: "₩", sector: "Technology" },
    { ticker: "000660", name: "SK Hynix",             price: 234560,  changePct: +2.34, currency: "₩", sector: "Technology" },
    { ticker: "035420", name: "Naver Corp.",          price: 187000,  changePct: +1.12, currency: "₩", sector: "Technology" },
    { ticker: "005380", name: "Hyundai Motor",        price: 245000,  changePct: +1.67, currency: "₩", sector: "Automotive" },
    { ticker: "000270", name: "Kia Corp.",            price: 112000,  changePct: +1.34, currency: "₩", sector: "Automotive" },
    { ticker: "051910", name: "LG Chem",              price: 345000,  changePct: +0.89, currency: "₩", sector: "Industrial" },
    { ticker: "055550", name: "Shinhan Financial",    price: 45600,   changePct: +0.67, currency: "₩", sector: "Banking & Finance" },
    { ticker: "105560", name: "KB Financial",         price: 67800,   changePct: +0.78, currency: "₩", sector: "Banking & Finance" },
    { ticker: "017670", name: "SK Telecom",           price: 56700,   changePct: +0.45, currency: "₩", sector: "Telecom" },
    { ticker: "030200", name: "KT Corp.",             price: 34500,   changePct: +0.34, currency: "₩", sector: "Telecom" },
    { ticker: "006400", name: "Samsung SDI",          price: 345000,  changePct: +1.23, currency: "₩", sector: "Technology" },
    { ticker: "207940", name: "Samsung Biologics",    price: 890000,  changePct: +0.89, currency: "₩", sector: "Healthcare" },
  ],

  ZA: [
    { ticker: "NPN",   name: "Naspers Ltd.",           price: 2345.67, changePct: -0.89, currency: "R", sector: "Technology" },
    { ticker: "AGL",   name: "Anglo American",         price: 456.78,  changePct: -1.23, currency: "R", sector: "Mining & Resources" },
    { ticker: "BIL",   name: "BHP Group",              price: 567.89,  changePct: -0.67, currency: "R", sector: "Mining & Resources" },
    { ticker: "GLN",   name: "Glencore plc",           price: 123.45,  changePct: -0.45, currency: "R", sector: "Mining & Resources" },
    { ticker: "FSR",   name: "FirstRand Group",        price: 67.89,   changePct: -0.34, currency: "R", sector: "Banking & Finance" },
    { ticker: "SBK",   name: "Standard Bank",         price: 178.45,  changePct: -0.56, currency: "R", sector: "Banking & Finance" },
    { ticker: "ABG",   name: "Absa Group",            price: 178.90,  changePct: -0.78, currency: "R", sector: "Banking & Finance" },
    { ticker: "MTN",   name: "MTN Group",             price: 123.45,  changePct: -0.89, currency: "R", sector: "Telecom" },
    { ticker: "VOD",   name: "Vodacom Group",         price: 89.45,   changePct: +0.34, currency: "R", sector: "Telecom" },
    { ticker: "SOL",   name: "Sasol Ltd.",            price: 145.67,  changePct: -1.12, currency: "R", sector: "Energy" },
  ],

  NG: [
    { ticker: "DANGCEM", name: "Dangote Cement",      price: 456.78,  changePct: +1.56, currency: "₦", sector: "Industrial" },
    { ticker: "DANGSUGAR",name:"Dangote Sugar",        price: 34.56,   changePct: +0.89, currency: "₦", sector: "Consumer" },
    { ticker: "ZENITHBANK",name:"Zenith Bank",         price: 23.45,   changePct: +1.23, currency: "₦", sector: "Banking & Finance" },
    { ticker: "GTCO",    name: "Guaranty Trust",       price: 45.67,   changePct: +0.78, currency: "₦", sector: "Banking & Finance" },
    { ticker: "ACCESS",  name: "Access Holdings",      price: 18.90,   changePct: +1.45, currency: "₦", sector: "Banking & Finance" },
    { ticker: "MTNN",    name: "MTN Nigeria",          price: 256.78,  changePct: +2.34, currency: "₦", sector: "Telecom" },
    { ticker: "AIRTELAFRI",name:"Airtel Africa",       price: 1234.56, changePct: +1.89, currency: "₦", sector: "Telecom" },
    { ticker: "SEPLAT",  name: "Seplat Energy",        price: 4567.89, changePct: +0.67, currency: "₦", sector: "Energy" },
    { ticker: "NB",      name: "Nigerian Breweries",   price: 23.45,   changePct: -0.45, currency: "₦", sector: "Consumer" },
    { ticker: "NESTLE",  name: "Nestlé Nigeria",       price: 1234.56, changePct: -0.34, currency: "₦", sector: "Consumer" },
  ],

  MX: [
    { ticker: "AMXL",  name: "América Móvil",          price: 14.56,   changePct: +0.89, currency: "MX$", sector: "Telecom" },
    { ticker: "FEMSAUBD",name:"FEMSA",                  price: 156.78,  changePct: +0.67, currency: "MX$", sector: "Consumer" },
    { ticker: "WALMEX", name: "Walmart México",         price: 67.89,   changePct: +0.45, currency: "MX$", sector: "Consumer" },
    { ticker: "GMEXICOB",name:"Grupo México",           price: 123.45,  changePct: +1.23, currency: "MX$", sector: "Mining & Resources" },
    { ticker: "BIMBOA", name: "Grupo Bimbo",            price: 78.90,   changePct: +0.34, currency: "MX$", sector: "Consumer" },
    { ticker: "GFINBURO",name:"Banorte",                price: 145.67,  changePct: +0.56, currency: "MX$", sector: "Banking & Finance" },
    { ticker: "ASURB",  name: "Grupo Aeroportuario",   price: 234.56,  changePct: +0.78, currency: "MX$", sector: "Transportation" },
    { ticker: "KOFUBL", name: "Coca-Cola FEMSA",        price: 89.45,   changePct: +0.23, currency: "MX$", sector: "Consumer" },
    { ticker: "PINFRA", name: "Promotora y Operadora", price: 178.90,  changePct: +0.45, currency: "MX$", sector: "Industrial" },
    { ticker: "PE&OLES",name: "Peñoles",                price: 234.56,  changePct: +0.89, currency: "MX$", sector: "Mining & Resources" },
  ],

  SG: [
    { ticker: "D05",   name: "DBS Group",              price: 34.56,   changePct: +0.89, currency: "S$", sector: "Banking & Finance" },
    { ticker: "O39",   name: "OCBC Bank",              price: 14.23,   changePct: +0.67, currency: "S$", sector: "Banking & Finance" },
    { ticker: "U11",   name: "UOB",                    price: 29.45,   changePct: +0.45, currency: "S$", sector: "Banking & Finance" },
    { ticker: "Z74",   name: "Singtel",                price: 3.12,    changePct: +0.34, currency: "S$", sector: "Telecom" },
    { ticker: "C6L",   name: "Singapore Airlines",     price: 6.78,    changePct: +1.23, currency: "S$", sector: "Transportation" },
    { ticker: "C31",   name: "CapitaLand",             price: 3.45,    changePct: +0.56, currency: "S$", sector: "Real Estate" },
    { ticker: "S68",   name: "Singapore Exchange",     price: 9.78,    changePct: +0.78, currency: "S$", sector: "Banking & Finance" },
    { ticker: "V03",   name: "Venture Corp.",          price: 12.34,   changePct: +0.45, currency: "S$", sector: "Technology" },
    { ticker: "BN4",   name: "Keppel Corp.",           price: 6.78,    changePct: +0.34, currency: "S$", sector: "Industrial" },
    { ticker: "U96",   name: "Sembcorp Industries",    price: 5.23,    changePct: +0.89, currency: "S$", sector: "Utilities" },
  ],

  AE: [
    { ticker: "ENBD",  name: "Emirates NBD",           price: 16.78,   changePct: +1.23, currency: "AED", sector: "Banking & Finance" },
    { ticker: "FAB",   name: "First Abu Dhabi Bank",   price: 14.56,   changePct: +0.89, currency: "AED", sector: "Banking & Finance" },
    { ticker: "EMAAR", name: "Emaar Properties",       price: 8.45,    changePct: +1.56, currency: "AED", sector: "Real Estate" },
    { ticker: "DIB",   name: "Dubai Islamic Bank",     price: 6.78,    changePct: +0.67, currency: "AED", sector: "Banking & Finance" },
    { ticker: "DU",    name: "du Telecom",             price: 7.89,    changePct: +0.45, currency: "AED", sector: "Telecom" },
    { ticker: "ETISALAT",name:"e&",                    price: 23.45,   changePct: +0.34, currency: "AED", sector: "Telecom" },
    { ticker: "ADNOCDIST",name:"ADNOC Distribution",   price: 4.56,    changePct: +0.78, currency: "AED", sector: "Energy" },
    { ticker: "DP",    name: "DP World",               price: 18.90,   changePct: +0.56, currency: "AED", sector: "Transportation" },
    { ticker: "ALDAR", name: "Aldar Properties",       price: 3.45,    changePct: +1.12, currency: "AED", sector: "Real Estate" },
    { ticker: "GFH",   name: "GFH Financial Group",    price: 1.23,    changePct: +0.89, currency: "AED", sector: "Banking & Finance" },
  ],

  RU: [
    { ticker: "GAZP",  name: "Gazprom",                price: 145.67,  changePct: -2.34, currency: "₽", sector: "Energy" },
    { ticker: "LKOH",  name: "Lukoil",                 price: 6789.45, changePct: -1.56, currency: "₽", sector: "Energy" },
    { ticker: "ROSN",  name: "Rosneft",                price: 567.89,  changePct: -1.23, currency: "₽", sector: "Energy" },
    { ticker: "SBER",  name: "Sberbank",               price: 234.56,  changePct: -1.89, currency: "₽", sector: "Banking & Finance" },
    { ticker: "VTBR",  name: "VTB Bank",               price: 0.023,   changePct: -2.45, currency: "₽", sector: "Banking & Finance" },
    { ticker: "GMKN",  name: "Norilsk Nickel",         price: 12345.67,changePct: -0.89, currency: "₽", sector: "Mining & Resources" },
    { ticker: "NLMK",  name: "NLMK Steel",             price: 134.56,  changePct: -1.12, currency: "₽", sector: "Industrial" },
    { ticker: "MTSS",  name: "MTS Telecom",            price: 234.56,  changePct: -0.67, currency: "₽", sector: "Telecom" },
    { ticker: "YNDX",  name: "Yandex",                 price: 3456.78, changePct: -0.45, currency: "₽", sector: "Technology" },
    { ticker: "ALRS",  name: "ALROSA Diamonds",        price: 56.78,   changePct: -1.34, currency: "₽", sector: "Mining & Resources" },
  ],

  /* ─── EUROPE ────────────────────────────────────────────────────────────── */

  ES: [
    { ticker: "SAN",   name: "Santander Bank",         price: 4.56,    changePct: -0.89, currency: "€", sector: "Banking & Finance" },
    { ticker: "BBVA",  name: "BBVA",                   price: 9.78,    changePct: -0.67, currency: "€", sector: "Banking & Finance" },
    { ticker: "CaixaBank",name:"CaixaBank",            price: 5.23,    changePct: -0.45, currency: "€", sector: "Banking & Finance" },
    { ticker: "IBE",   name: "Iberdrola",              price: 12.34,   changePct: +0.34, currency: "€", sector: "Utilities" },
    { ticker: "REP",   name: "Repsol",                 price: 14.56,   changePct: -0.56, currency: "€", sector: "Energy" },
    { ticker: "TEF",   name: "Telefónica",             price: 4.12,    changePct: -0.23, currency: "€", sector: "Telecom" },
    { ticker: "ITX",   name: "Inditex (Zara)",         price: 45.67,   changePct: -1.12, currency: "€", sector: "Consumer" },
    { ticker: "ACS",   name: "ACS Group",              price: 34.56,   changePct: +0.45, currency: "€", sector: "Industrial" },
    { ticker: "FER",   name: "Ferrovial",              price: 34.78,   changePct: +0.67, currency: "€", sector: "Industrial" },
    { ticker: "MAP",   name: "Mapfre SA",              price: 2.34,    changePct: -0.34, currency: "€", sector: "Banking & Finance" },
  ],

  IT: [
    { ticker: "ENI",   name: "Eni SpA",                price: 14.56,   changePct: -0.45, currency: "€", sector: "Energy" },
    { ticker: "ENEL",  name: "Enel SpA",               price: 6.78,    changePct: +0.34, currency: "€", sector: "Utilities" },
    { ticker: "ISP",   name: "Intesa Sanpaolo",        price: 3.45,    changePct: +0.23, currency: "€", sector: "Banking & Finance" },
    { ticker: "UCG",   name: "UniCredit SpA",          price: 34.56,   changePct: +0.56, currency: "€", sector: "Banking & Finance" },
    { ticker: "STLA",  name: "Stellantis NV",          price: 12.34,   changePct: -1.23, currency: "€", sector: "Automotive" },
    { ticker: "ATL",   name: "Atlantia SpA",           price: 23.45,   changePct: +0.45, currency: "€", sector: "Transportation" },
    { ticker: "LUX",   name: "Luxottica / EssilorLuxottica",price:189.45,changePct:+0.78,currency:"€",sector:"Consumer"},
    { ticker: "RACE",  name: "Ferrari NV",             price: 378.45,  changePct: +1.23, currency: "€", sector: "Automotive" },
    { ticker: "PRY",   name: "Prysmian SpA",           price: 45.67,   changePct: +0.89, currency: "€", sector: "Industrial" },
    { ticker: "TIT",   name: "Telecom Italia",         price: 0.23,    changePct: -0.89, currency: "€", sector: "Telecom" },
  ],

  NL: [
    { ticker: "ASML",  name: "ASML Holding",           price: 789.45,  changePct: +2.45, currency: "€", sector: "Technology" },
    { ticker: "PHIA",  name: "Philips NV",             price: 23.45,   changePct: +0.67, currency: "€", sector: "Healthcare" },
    { ticker: "ING",   name: "ING Groep",              price: 14.56,   changePct: +0.45, currency: "€", sector: "Banking & Finance" },
    { ticker: "HEIA",  name: "Heineken NV",            price: 89.45,   changePct: -0.34, currency: "€", sector: "Consumer" },
    { ticker: "AKZA",  name: "Akzo Nobel",             price: 67.89,   changePct: +0.56, currency: "€", sector: "Industrial" },
    { ticker: "WKL",   name: "Wolters Kluwer",         price: 156.78,  changePct: +0.89, currency: "€", sector: "Technology" },
    { ticker: "NN",    name: "NN Group",               price: 34.56,   changePct: +0.34, currency: "€", sector: "Banking & Finance" },
    { ticker: "AD",    name: "Ahold Delhaize",         price: 28.45,   changePct: +0.23, currency: "€", sector: "Consumer" },
    { ticker: "SHEL",  name: "Shell plc",              price: 28.45,   changePct: -0.34, currency: "€", sector: "Energy" },
    { ticker: "RAND",  name: "Randstad",               price: 45.67,   changePct: -0.23, currency: "€", sector: "Industrial" },
  ],

  SE: [
    { ticker: "VOLV-B", name: "Volvo Group",           price: 234.56,  changePct: +0.89, currency: "SEK", sector: "Industrial" },
    { ticker: "ERICB",  name: "Ericsson",              price: 78.45,   changePct: -0.56, currency: "SEK", sector: "Technology" },
    { ticker: "HM-B",   name: "H&M Group",            price: 145.67,  changePct: -0.34, currency: "SEK", sector: "Consumer" },
    { ticker: "SAND",   name: "Sandvik AB",            price: 234.56,  changePct: +0.67, currency: "SEK", sector: "Industrial" },
    { ticker: "SPOT",   name: "Spotify Technology",    price: 287.45,  changePct: +2.34, currency: "SEK", sector: "Technology" },
    { ticker: "NDA-SE", name: "Nordea Bank",          price: 112.34,  changePct: +0.45, currency: "SEK", sector: "Banking & Finance" },
    { ticker: "SEB-A",  name: "SEB AB",               price: 145.67,  changePct: +0.34, currency: "SEK", sector: "Banking & Finance" },
    { ticker: "SWED-A", name: "Swedbank",             price: 234.56,  changePct: +0.56, currency: "SEK", sector: "Banking & Finance" },
    { ticker: "ATCO-A", name: "Atlas Copco",          price: 178.90,  changePct: +0.78, currency: "SEK", sector: "Industrial" },
    { ticker: "EPI-A",  name: "Epiroc AB",            price: 189.45,  changePct: +0.89, currency: "SEK", sector: "Industrial" },
  ],

  NO: [
    { ticker: "EQNR",  name: "Equinor ASA",            price: 267.45,  changePct: +0.56, currency: "NOK", sector: "Energy" },
    { ticker: "TEL",   name: "Telenor ASA",            price: 128.90,  changePct: +0.34, currency: "NOK", sector: "Telecom" },
    { ticker: "DNB",   name: "DNB Bank",               price: 212.34,  changePct: +0.45, currency: "NOK", sector: "Banking & Finance" },
    { ticker: "ORK",   name: "Orkla ASA",              price: 89.45,   changePct: +0.23, currency: "NOK", sector: "Consumer" },
    { ticker: "YAR",   name: "Yara International",     price: 345.67,  changePct: -0.45, currency: "NOK", sector: "Industrial" },
    { ticker: "MOWI",  name: "Mowi ASA",               price: 178.45,  changePct: +0.67, currency: "NOK", sector: "Consumer" },
    { ticker: "SCANA", name: "Scana ASA",              price: 23.45,   changePct: +0.34, currency: "NOK", sector: "Industrial" },
    { ticker: "NEL",   name: "Nel ASA",                price: 4.56,    changePct: +1.23, currency: "NOK", sector: "Energy" },
  ],

  CH: [
    { ticker: "NESN",  name: "Nestlé SA",              price: 87.45,   changePct: +0.56, currency: "CHF", sector: "Consumer" },
    { ticker: "ROG",   name: "Roche Holding",          price: 234.56,  changePct: +0.78, currency: "CHF", sector: "Healthcare" },
    { ticker: "NOVN",  name: "Novartis AG",            price: 89.45,   changePct: +0.45, currency: "CHF", sector: "Healthcare" },
    { ticker: "ABBN",  name: "ABB Ltd.",               price: 45.67,   changePct: +0.67, currency: "CHF", sector: "Industrial" },
    { ticker: "GIVN",  name: "Givaudan SA",            price: 2890.45, changePct: +0.34, currency: "CHF", sector: "Industrial" },
    { ticker: "UBSG",  name: "UBS Group",              price: 23.45,   changePct: +0.89, currency: "CHF", sector: "Banking & Finance" },
    { ticker: "CSGN",  name: "Credit Suisse",          price: 0.89,    changePct: -2.34, currency: "CHF", sector: "Banking & Finance" },
    { ticker: "ZURN",  name: "Zurich Insurance",       price: 456.78,  changePct: +0.45, currency: "CHF", sector: "Banking & Finance" },
    { ticker: "LONN",  name: "Lonza Group",            price: 456.78,  changePct: +0.89, currency: "CHF", sector: "Healthcare" },
    { ticker: "SIKA",  name: "Sika AG",                price: 234.56,  changePct: +0.67, currency: "CHF", sector: "Industrial" },
  ],

  DK: [
    { ticker: "NOVO-B", name: "Novo Nordisk",          price: 789.45,  changePct: +2.34, currency: "DKK", sector: "Healthcare" },
    { ticker: "MAERSK-B",name:"A.P. Møller-Mærsk",    price: 12345.67,changePct: +0.78, currency: "DKK", sector: "Transportation" },
    { ticker: "CARL-B", name: "Carlsberg AS",          price: 789.45,  changePct: -0.34, currency: "DKK", sector: "Consumer" },
    { ticker: "DANSKE", name: "Danske Bank",           price: 145.67,  changePct: +0.56, currency: "DKK", sector: "Banking & Finance" },
    { ticker: "ORSTED", name: "Ørsted AS",             price: 345.67,  changePct: +0.89, currency: "DKK", sector: "Utilities" },
    { ticker: "VWS",    name: "Vestas Wind Systems",   price: 123.45,  changePct: +1.23, currency: "DKK", sector: "Energy" },
    { ticker: "TRYG",   name: "Tryg AS",               price: 134.56,  changePct: +0.23, currency: "DKK", sector: "Banking & Finance" },
    { ticker: "COLO-B", name: "Coloplast",             price: 789.45,  changePct: +0.45, currency: "DKK", sector: "Healthcare" },
  ],

  FI: [
    { ticker: "NOKIA",  name: "Nokia Oyj",             price: 3.89,    changePct: +2.34, currency: "€", sector: "Technology" },
    { ticker: "NESTE",  name: "Neste Oyj",             price: 23.45,   changePct: +0.67, currency: "€", sector: "Energy" },
    { ticker: "KNEBV",  name: "KONE Corp.",            price: 45.67,   changePct: +0.89, currency: "€", sector: "Industrial" },
    { ticker: "NDA-FI", name: "Nordea Bank",           price: 11.23,   changePct: +0.45, currency: "€", sector: "Banking & Finance" },
    { ticker: "FORTUM", name: "Fortum Corp.",          price: 12.34,   changePct: +0.34, currency: "€", sector: "Utilities" },
    { ticker: "METSO",  name: "Metso Corp.",           price: 34.56,   changePct: +0.56, currency: "€", sector: "Industrial" },
    { ticker: "KESKO",  name: "Kesko Oyj",            price: 18.90,   changePct: +0.23, currency: "€", sector: "Consumer" },
    { ticker: "UPM",    name: "UPM-Kymmene",           price: 28.45,   changePct: -0.34, currency: "€", sector: "Industrial" },
  ],

  AT: [
    { ticker: "OMV",    name: "OMV AG",                price: 34.56,   changePct: -1.12, currency: "€", sector: "Energy" },
    { ticker: "EBS",    name: "Erste Group Bank",      price: 45.67,   changePct: -0.89, currency: "€", sector: "Banking & Finance" },
    { ticker: "VER",    name: "Verbund AG",            price: 67.89,   changePct: +0.34, currency: "€", sector: "Utilities" },
    { ticker: "RBI",    name: "Raiffeisen Bank Intl",  price: 14.56,   changePct: -1.45, currency: "€", sector: "Banking & Finance" },
    { ticker: "VIG",    name: "Vienna Insurance Group",price: 23.45,   changePct: -0.23, currency: "€", sector: "Banking & Finance" },
    { ticker: "ANDR",   name: "Andritz AG",            price: 56.78,   changePct: +0.45, currency: "€", sector: "Industrial" },
    { ticker: "HAL",    name: "Lenzing AG",            price: 34.56,   changePct: -0.67, currency: "€", sector: "Industrial" },
  ],

  PT: [
    { ticker: "EDP",    name: "EDP Energias",          price: 3.89,    changePct: +0.34, currency: "€", sector: "Utilities" },
    { ticker: "EDPR",   name: "EDP Renewables",        price: 12.34,   changePct: +0.89, currency: "€", sector: "Energy" },
    { ticker: "GALP",   name: "Galp Energia",          price: 14.56,   changePct: -0.45, currency: "€", sector: "Energy" },
    { ticker: "JMT",    name: "Jerónimo Martins",      price: 18.90,   changePct: +0.56, currency: "€", sector: "Consumer" },
    { ticker: "CTT",    name: "CTT Correios",          price: 4.56,    changePct: -0.23, currency: "€", sector: "Transportation" },
    { ticker: "NOS",    name: "NOS SGPS",              price: 3.78,    changePct: +0.12, currency: "€", sector: "Telecom" },
    { ticker: "BCP",    name: "Banco Comercial",       price: 0.34,    changePct: +0.45, currency: "€", sector: "Banking & Finance" },
  ],

  GR: [
    { ticker: "ETE",    name: "National Bank of Greece",price: 6.78,   changePct: -1.23, currency: "€", sector: "Banking & Finance" },
    { ticker: "EUROB",  name: "Eurobank Ergasias",     price: 1.89,    changePct: -0.89, currency: "€", sector: "Banking & Finance" },
    { ticker: "ALPHA",  name: "Alpha Bank",            price: 1.45,    changePct: -1.12, currency: "€", sector: "Banking & Finance" },
    { ticker: "HTO",    name: "OTE Group Telecom",     price: 14.56,   changePct: -0.34, currency: "€", sector: "Telecom" },
    { ticker: "MOTOR",  name: "Motor Oil Hellas",      price: 23.45,   changePct: -0.56, currency: "€", sector: "Energy" },
    { ticker: "OPAP",   name: "OPAP SA",               price: 14.78,   changePct: -0.45, currency: "€", sector: "Consumer" },
    { ticker: "ELLAKTOR",name:"ELLAKTOR SA",           price: 1.34,    changePct: -0.78, currency: "€", sector: "Industrial" },
  ],

  PL: [
    { ticker: "PKN",    name: "PKN Orlen",             price: 67.89,   changePct: +1.23, currency: "PLN", sector: "Energy" },
    { ticker: "PKO",    name: "PKO Bank Polski",       price: 45.67,   changePct: +0.89, currency: "PLN", sector: "Banking & Finance" },
    { ticker: "PZU",    name: "PZU Group",             price: 34.56,   changePct: +0.67, currency: "PLN", sector: "Banking & Finance" },
    { ticker: "CDR",    name: "CD Projekt",            price: 189.45,  changePct: +2.34, currency: "PLN", sector: "Technology" },
    { ticker: "LPP",    name: "LPP SA",                price: 17890.45,changePct: +0.78, currency: "PLN", sector: "Consumer" },
    { ticker: "CPS",    name: "Cyfrowy Polsat",        price: 12.34,   changePct: +0.45, currency: "PLN", sector: "Telecom" },
    { ticker: "KGH",    name: "KGHM Polska Miedź",     price: 145.67,  changePct: +1.45, currency: "PLN", sector: "Mining & Resources" },
    { ticker: "ALE",    name: "Allegro.eu",            price: 34.56,   changePct: +0.89, currency: "PLN", sector: "Consumer" },
  ],

  BE: [
    { ticker: "ABI",    name: "AB InBev",              price: 56.78,   changePct: -0.89, currency: "€", sector: "Consumer" },
    { ticker: "KBC",    name: "KBC Group",             price: 67.89,   changePct: -0.56, currency: "€", sector: "Banking & Finance" },
    { ticker: "UCB",    name: "UCB SA",                price: 145.67,  changePct: +0.67, currency: "€", sector: "Healthcare" },
    { ticker: "AGEN",   name: "Ageas SA",              price: 34.56,   changePct: -0.34, currency: "€", sector: "Banking & Finance" },
    { ticker: "ARGX",   name: "Argenx SE",             price: 456.78,  changePct: +1.23, currency: "€", sector: "Healthcare" },
    { ticker: "SOF",    name: "Sofina SA",             price: 189.45,  changePct: -0.45, currency: "€", sector: "Banking & Finance" },
    { ticker: "PROX",   name: "Proximus Group",        price: 8.90,    changePct: -0.67, currency: "€", sector: "Telecom" },
  ],

  IE: [
    { ticker: "CRH",    name: "CRH plc",               price: 67.89,   changePct: -0.78, currency: "€", sector: "Industrial" },
    { ticker: "KYGA",   name: "Kerry Group",           price: 89.45,   changePct: -0.45, currency: "€", sector: "Consumer" },
    { ticker: "RYA",    name: "Ryanair Holdings",      price: 17.89,   changePct: +0.56, currency: "€", sector: "Transportation" },
    { ticker: "AIB",    name: "AIB Group",             price: 4.56,    changePct: -0.67, currency: "€", sector: "Banking & Finance" },
    { ticker: "BOI",    name: "Bank of Ireland",       price: 8.90,    changePct: -0.34, currency: "€", sector: "Banking & Finance" },
    { ticker: "DLOG",   name: "DCC plc",               price: 23.45,   changePct: -0.89, currency: "€", sector: "Industrial" },
    { ticker: "IRES",   name: "Irish Residential REIT",price: 1.12,    changePct: -1.23, currency: "€", sector: "Real Estate" },
  ],

  HU: [
    { ticker: "OTP",    name: "OTP Bank",              price: 19456.78,changePct: -1.34, currency: "HUF", sector: "Banking & Finance" },
    { ticker: "MOL",    name: "MOL Group",             price: 2567.89, changePct: -0.89, currency: "HUF", sector: "Energy" },
    { ticker: "MTELEKOM",name:"Magyar Telekom",        price: 567.89,  changePct: -0.45, currency: "HUF", sector: "Telecom" },
    { ticker: "RICHTER", name: "Gedeon Richter",       price: 8901.23, changePct: -0.67, currency: "HUF", sector: "Healthcare" },
    { ticker: "OPUS",   name: "OPUS Global",           price: 456.78,  changePct: -1.12, currency: "HUF", sector: "Industrial" },
  ],

  CZ: [
    { ticker: "CEZ",    name: "ČEZ Group",             price: 678.90,  changePct: +0.34, currency: "CZK", sector: "Utilities" },
    { ticker: "KOMB",   name: "Komerční Banka",        price: 567.89,  changePct: +0.56, currency: "CZK", sector: "Banking & Finance" },
    { ticker: "ERSTE",  name: "Erste Group",           price: 45.67,   changePct: +0.45, currency: "CZK", sector: "Banking & Finance" },
    { ticker: "O2CR",   name: "O2 Czech Republic",     price: 234.56,  changePct: +0.23, currency: "CZK", sector: "Telecom" },
    { ticker: "MONET",  name: "Moneta Money Bank",     price: 89.45,   changePct: +0.67, currency: "CZK", sector: "Banking & Finance" },
  ],

  RO: [
    { ticker: "SNP",    name: "OMV Petrom",            price: 0.89,    changePct: +1.23, currency: "RON", sector: "Energy" },
    { ticker: "TLV",    name: "Banca Transilvania",    price: 2.34,    changePct: +0.89, currency: "RON", sector: "Banking & Finance" },
    { ticker: "BRD",    name: "BRD-Groupe SocGen",     price: 14.56,   changePct: +0.67, currency: "RON", sector: "Banking & Finance" },
    { ticker: "EL",     name: "Electrica SA",          price: 12.34,   changePct: +0.45, currency: "RON", sector: "Utilities" },
    { ticker: "DIGI",   name: "Digi Communications",   price: 34.56,   changePct: +1.12, currency: "RON", sector: "Telecom" },
    { ticker: "FP",     name: "Fondul Proprietatea",   price: 1.78,    changePct: +0.34, currency: "RON", sector: "Banking & Finance" },
  ],

  UA: [
    { ticker: "UAKI",   name: "Kernel Holding",        price: 3.45,    changePct: -3.12, currency: "UAH", sector: "Consumer" },
    { ticker: "MHP",    name: "MHP SE",                price: 4.56,    changePct: -2.34, currency: "UAH", sector: "Consumer" },
    { ticker: "KZTY",   name: "Ukrtelecom",            price: 1.23,    changePct: -1.89, currency: "UAH", sector: "Telecom" },
    { ticker: "UNAF",   name: "Ukrnafta",              price: 56.78,   changePct: -2.67, currency: "UAH", sector: "Energy" },
    { ticker: "ESPO",   name: "Epicenter K",           price: 23.45,   changePct: -1.45, currency: "UAH", sector: "Consumer" },
  ],

  /* ─── MIDDLE EAST ───────────────────────────────────────────────────────── */

  TR: [
    { ticker: "GARAN",  name: "Garanti BBVA Bank",     price: 45.67,   changePct: -2.34, currency: "₺", sector: "Banking & Finance" },
    { ticker: "ISCTR",  name: "İşbank",                price: 12.34,   changePct: -1.89, currency: "₺", sector: "Banking & Finance" },
    { ticker: "AKBNK",  name: "Akbank",                price: 23.45,   changePct: -1.56, currency: "₺", sector: "Banking & Finance" },
    { ticker: "SAHOL",  name: "Sabancı Holding",       price: 34.56,   changePct: -2.01, currency: "₺", sector: "Industrial" },
    { ticker: "KCHOL",  name: "Koç Holding",           price: 89.45,   changePct: -1.78, currency: "₺", sector: "Industrial" },
    { ticker: "ASELS",  name: "Aselsan",               price: 23.45,   changePct: -0.89, currency: "₺", sector: "Defence" },
    { ticker: "TCELL",  name: "Turkcell",              price: 34.56,   changePct: -1.23, currency: "₺", sector: "Telecom" },
    { ticker: "THYAO",  name: "Turkish Airlines",      price: 278.90,  changePct: +0.45, currency: "₺", sector: "Transportation" },
    { ticker: "EREGL",  name: "Ereğli Steel",          price: 23.45,   changePct: -1.67, currency: "₺", sector: "Industrial" },
    { ticker: "TOASO",  name: "Tofaş Otomobil",        price: 145.67,  changePct: -2.12, currency: "₺", sector: "Automotive" },
  ],

  IL: [
    { ticker: "CHKP",  name: "Check Point Software",   price: 167.89,  changePct: +2.34, currency: "ILS", sector: "Technology" },
    { ticker: "NICE",  name: "NICE Systems",           price: 189.45,  changePct: -1.23, currency: "ILS", sector: "Technology" },
    { ticker: "CYBR",  name: "CyberArk Software",      price: 234.56,  changePct: -0.89, currency: "ILS", sector: "Technology" },
    { ticker: "TEVA",  name: "Teva Pharmaceutical",    price: 14.56,   changePct: -2.34, currency: "ILS", sector: "Healthcare" },
    { ticker: "GMKP",  name: "Gamida Cell",            price: 1.23,    changePct: -3.45, currency: "ILS", sector: "Healthcare" },
    { ticker: "HAPOALIM",name:"Bank Hapoalim",         price: 34.56,   changePct: -2.12, currency: "ILS", sector: "Banking & Finance" },
    { ticker: "LEUMI",  name: "Bank Leumi",            price: 23.45,   changePct: -1.89, currency: "ILS", sector: "Banking & Finance" },
    { ticker: "ELBIT",  name: "Elbit Systems",         price: 189.45,  changePct: +1.23, currency: "ILS", sector: "Defence" },
    { ticker: "ICL",    name: "ICL Group",             price: 6.78,    changePct: -1.45, currency: "ILS", sector: "Industrial" },
    { ticker: "WTHR",   name: "Wix.com",               price: 145.67,  changePct: -0.67, currency: "ILS", sector: "Technology" },
  ],

  QA: [
    { ticker: "QIBK",  name: "Qatar Islamic Bank",     price: 19.45,   changePct: +0.89, currency: "QAR", sector: "Banking & Finance" },
    { ticker: "QNBK",  name: "QNB Group",              price: 18.90,   changePct: +1.12, currency: "QAR", sector: "Banking & Finance" },
    { ticker: "IQCD",  name: "Industries Qatar",       price: 12.34,   changePct: +0.78, currency: "QAR", sector: "Industrial" },
    { ticker: "MARK",  name: "Masraf Al Rayan",        price: 4.56,    changePct: +0.56, currency: "QAR", sector: "Banking & Finance" },
    { ticker: "QEWS",  name: "Qatar Electricity & Water",price:17.89, changePct: +0.34, currency: "QAR", sector: "Utilities" },
    { ticker: "DOHI",  name: "Doha Insurance",         price: 12.34,   changePct: +0.23, currency: "QAR", sector: "Banking & Finance" },
  ],

  KW: [
    { ticker: "NBK",   name: "National Bank of Kuwait", price: 1.12,   changePct: +0.89, currency: "KWD", sector: "Banking & Finance" },
    { ticker: "KFIN",  name: "Kuwait Finance House",   price: 0.78,    changePct: +0.67, currency: "KWD", sector: "Banking & Finance" },
    { ticker: "ZAIN",  name: "Zain Group",             price: 0.45,    changePct: +1.12, currency: "KWD", sector: "Telecom" },
    { ticker: "GBK",   name: "Gulf Bank",              price: 0.34,    changePct: +0.45, currency: "KWD", sector: "Banking & Finance" },
    { ticker: "HUMANSOFT",name:"Humansoft Holding",    price: 4.56,    changePct: +0.78, currency: "KWD", sector: "Technology" },
  ],

  OM: [
    { ticker: "BKMB",  name: "Bank Muscat",            price: 0.56,    changePct: +0.67, currency: "OMR", sector: "Banking & Finance" },
    { ticker: "ORDS",  name: "Ooredoo Oman",           price: 0.78,    changePct: +0.34, currency: "OMR", sector: "Telecom" },
    { ticker: "OQSH",  name: "OQ Gas Networks",        price: 0.45,    changePct: +0.23, currency: "OMR", sector: "Energy" },
    { ticker: "NLSI",  name: "Oman Telecommunications",price: 0.67,   changePct: +0.45, currency: "OMR", sector: "Telecom" },
    { ticker: "REEM",  name: "Reem Finance",           price: 0.89,    changePct: +0.56, currency: "OMR", sector: "Banking & Finance" },
  ],

  JO: [
    { ticker: "ABED",  name: "Arab Bank",              price: 5.23,    changePct: -1.12, currency: "JOD", sector: "Banking & Finance" },
    { ticker: "APOT",  name: "Arab Potash",            price: 34.56,   changePct: -0.67, currency: "JOD", sector: "Mining & Resources" },
    { ticker: "JOPT",  name: "Jordan Phosphate Mines", price: 23.45,   changePct: -0.89, currency: "JOD", sector: "Mining & Resources" },
    { ticker: "JOIC",  name: "Jordan Islamic Bank",    price: 3.45,    changePct: -0.45, currency: "JOD", sector: "Banking & Finance" },
    { ticker: "MRSL",  name: "Zara Investment",        price: 2.34,    changePct: -0.34, currency: "JOD", sector: "Real Estate" },
  ],

  BH: [
    { ticker: "AUB",   name: "Ahli United Bank",       price: 0.89,    changePct: +0.67, currency: "BHD", sector: "Banking & Finance" },
    { ticker: "ALBA",  name: "Aluminium Bahrain",      price: 1.12,    changePct: +0.89, currency: "BHD", sector: "Industrial" },
    { ticker: "BSFR",  name: "Bahrain Islamic Bank",   price: 0.34,    changePct: +0.45, currency: "BHD", sector: "Banking & Finance" },
    { ticker: "BATELCO",name:"Batelco Group",          price: 0.56,    changePct: +0.34, currency: "BHD", sector: "Telecom" },
    { ticker: "NHOTEL",name: "National Hotels",        price: 0.45,    changePct: +0.23, currency: "BHD", sector: "Consumer" },
  ],

  IR: [
    { ticker: "فولاد",  name: "Mobarakeh Steel",       price: 12456.78,changePct: -2.12, currency: "IRR", sector: "Industrial" },
    { ticker: "شستا",   name: "TAMIN Investment",      price: 8901.23, changePct: -1.89, currency: "IRR", sector: "Banking & Finance" },
    { ticker: "فارس",   name: "Persian Gulf Petrochem",price: 23456.78,changePct: -2.34, currency: "IRR", sector: "Energy" },
    { ticker: "ملت",    name: "Bank Mellat",           price: 3456.78, changePct: -2.56, currency: "IRR", sector: "Banking & Finance" },
    { ticker: "خودرو",  name: "Iran Khodro (IKCO)",    price: 4567.89, changePct: -1.67, currency: "IRR", sector: "Automotive" },
  ],

  /* ─── AFRICA ────────────────────────────────────────────────────────────── */

  EG: [
    { ticker: "COMI",  name: "Commercial Intl Bank",   price: 67.89,   changePct: +1.12, currency: "EGP", sector: "Banking & Finance" },
    { ticker: "TMGH",  name: "Talaat Moustafa Group",  price: 23.45,   changePct: +0.89, currency: "EGP", sector: "Real Estate" },
    { ticker: "OCDI",  name: "Orascom Construction",   price: 34.56,   changePct: +0.67, currency: "EGP", sector: "Industrial" },
    { ticker: "EFIH",  name: "Egyptian Int'l Finance",  price: 12.34,   changePct: +0.45, currency: "EGP", sector: "Banking & Finance" },
    { ticker: "SWDY",  name: "Elsewedy Electric",      price: 18.90,   changePct: +0.78, currency: "EGP", sector: "Industrial" },
    { ticker: "ETEL",  name: "Telecom Egypt",          price: 23.45,   changePct: +0.34, currency: "EGP", sector: "Telecom" },
    { ticker: "MCIT",  name: "Misr Cement",            price: 14.56,   changePct: -0.23, currency: "EGP", sector: "Industrial" },
    { ticker: "PHDC",  name: "Palm Hills Developments",price: 4.56,    changePct: +1.23, currency: "EGP", sector: "Real Estate" },
  ],

  MA: [
    { ticker: "IAM",   name: "Maroc Telecom",          price: 89.45,   changePct: +1.12, currency: "MAD", sector: "Telecom" },
    { ticker: "ATW",   name: "Attijariwafa Bank",      price: 456.78,  changePct: +0.78, currency: "MAD", sector: "Banking & Finance" },
    { ticker: "BMCE",  name: "Bank of Africa",         price: 189.45,  changePct: +0.67, currency: "MAD", sector: "Banking & Finance" },
    { ticker: "CIH",   name: "CIH Bank",               price: 345.67,  changePct: +0.45, currency: "MAD", sector: "Banking & Finance" },
    { ticker: "LAHO",  name: "LafargeHolcim Maroc",    price: 1567.89, changePct: +0.89, currency: "MAD", sector: "Industrial" },
    { ticker: "MNG",   name: "Managem Group",          price: 1234.56, changePct: +1.23, currency: "MAD", sector: "Mining & Resources" },
    { ticker: "HPS",   name: "Hightech Payment Systems",price:3456.78,changePct: +1.45, currency: "MAD", sector: "Technology" },
  ],

  KE: [
    { ticker: "SCOM",  name: "Safaricom PLC",          price: 14.56,   changePct: -2.34, currency: "KES", sector: "Telecom" },
    { ticker: "KCB",   name: "KCB Group",              price: 34.56,   changePct: -1.89, currency: "KES", sector: "Banking & Finance" },
    { ticker: "EQTY",  name: "Equity Group",           price: 45.67,   changePct: -1.56, currency: "KES", sector: "Banking & Finance" },
    { ticker: "COOP",  name: "Co-op Bank",             price: 12.34,   changePct: -1.12, currency: "KES", sector: "Banking & Finance" },
    { ticker: "BRIT",  name: "British American Tobacco KE",price:478.90,changePct:-0.67,currency:"KES",sector:"Consumer"},
    { ticker: "JUB",   name: "Jubilee Holdings",       price: 234.56,  changePct: -0.89, currency: "KES", sector: "Banking & Finance" },
    { ticker: "BAMB",  name: "Bamburi Cement",         price: 23.45,   changePct: -0.45, currency: "KES", sector: "Industrial" },
  ],

  GH: [
    { ticker: "MTNGH",  name: "MTN Ghana",             price: 1.89,    changePct: -1.67, currency: "GHS", sector: "Telecom" },
    { ticker: "GCB",    name: "GCB Bank",              price: 4.56,    changePct: -1.23, currency: "GHS", sector: "Banking & Finance" },
    { ticker: "EGH",    name: "Ecobank Ghana",         price: 8.90,    changePct: -0.89, currency: "GHS", sector: "Banking & Finance" },
    { ticker: "FAN",    name: "Fan Milk PLC",          price: 3.45,    changePct: -0.56, currency: "GHS", sector: "Consumer" },
    { ticker: "SCB",    name: "Standard Chartered GH", price: 12.34,   changePct: -1.45, currency: "GHS", sector: "Banking & Finance" },
    { ticker: "GGBL",   name: "Guinness Ghana",        price: 1.23,    changePct: -0.78, currency: "GHS", sector: "Consumer" },
  ],

  CI: [
    { ticker: "SNTS",  name: "Sonatel (Orange CI)",    price: 14500,   changePct: +1.67, currency: "XOF", sector: "Telecom" },
    { ticker: "BICC",  name: "BICI (BNP CI)",          price: 7890,    changePct: +0.89, currency: "XOF", sector: "Banking & Finance" },
    { ticker: "SIVC",  name: "SIV Côte d'Ivoire",      price: 1234,    changePct: +1.12, currency: "XOF", sector: "Industrial" },
    { ticker: "SGBC",  name: "Société Générale CI",    price: 12345,   changePct: +0.78, currency: "XOF", sector: "Banking & Finance" },
    { ticker: "PALM",  name: "SIFCA Group",            price: 4567,    changePct: +2.34, currency: "XOF", sector: "Consumer" },
  ],

  TZ: [
    { ticker: "CRDB",  name: "CRDB Bank",              price: 450,     changePct: +1.12, currency: "TZS", sector: "Banking & Finance" },
    { ticker: "NMB",   name: "NMB Bank PLC",           price: 3450,    changePct: +0.89, currency: "TZS", sector: "Banking & Finance" },
    { ticker: "TCCL",  name: "Tanzania Cigarette",     price: 12000,   changePct: -0.34, currency: "TZS", sector: "Consumer" },
    { ticker: "SWISSPORT",name:"Swissport Tanzania",   price: 4500,    changePct: +0.67, currency: "TZS", sector: "Transportation" },
    { ticker: "TOL",   name: "TOL Gases",              price: 1200,    changePct: +0.45, currency: "TZS", sector: "Industrial" },
  ],

  /* ─── ASIA-PACIFIC ──────────────────────────────────────────────────────── */

  TW: [
    { ticker: "2330",  name: "TSMC",                   price: 945.67,  changePct: +2.34, currency: "NT$", sector: "Technology" },
    { ticker: "2454",  name: "MediaTek",               price: 1234.56, changePct: +1.89, currency: "NT$", sector: "Technology" },
    { ticker: "2317",  name: "Foxconn (Hon Hai)",       price: 189.45,  changePct: +1.12, currency: "NT$", sector: "Technology" },
    { ticker: "2303",  name: "United Microelectronics", price: 56.78,   changePct: +1.56, currency: "NT$", sector: "Technology" },
    { ticker: "2308",  name: "Delta Electronics",       price: 345.67,  changePct: +0.89, currency: "NT$", sector: "Industrial" },
    { ticker: "2882",  name: "Cathay Financial",        price: 56.78,   changePct: +0.67, currency: "NT$", sector: "Banking & Finance" },
    { ticker: "2412",  name: "Chunghwa Telecom",        price: 112.34,  changePct: +0.34, currency: "NT$", sector: "Telecom" },
    { ticker: "1301",  name: "Formosa Plastics",        price: 67.89,   changePct: -0.45, currency: "NT$", sector: "Industrial" },
    { ticker: "2891",  name: "CTBC Financial",          price: 23.45,   changePct: +0.56, currency: "NT$", sector: "Banking & Finance" },
    { ticker: "3711",  name: "ASE Technology",          price: 145.67,  changePct: +1.23, currency: "NT$", sector: "Technology" },
  ],

  HK: [
    { ticker: "0700",  name: "Tencent Holdings",        price: 378.45,  changePct: +1.23, currency: "HK$", sector: "Technology" },
    { ticker: "9988",  name: "Alibaba Group",           price: 89.45,   changePct: +0.89, currency: "HK$", sector: "Technology" },
    { ticker: "0005",  name: "HSBC Holdings",           price: 67.89,   changePct: +0.56, currency: "HK$", sector: "Banking & Finance" },
    { ticker: "1299",  name: "AIA Group",              price: 67.34,   changePct: +0.45, currency: "HK$", sector: "Banking & Finance" },
    { ticker: "0941",  name: "China Mobile",           price: 78.90,   changePct: +0.67, currency: "HK$", sector: "Telecom" },
    { ticker: "0388",  name: "HK Exchanges & Clearing",price: 256.78,  changePct: +0.89, currency: "HK$", sector: "Banking & Finance" },
    { ticker: "0016",  name: "Sun Hung Kai Properties",price: 89.45,   changePct: -0.45, currency: "HK$", sector: "Real Estate" },
    { ticker: "0011",  name: "Hang Seng Bank",         price: 134.56,  changePct: +0.34, currency: "HK$", sector: "Banking & Finance" },
    { ticker: "3988",  name: "Bank of China",          price: 3.56,    changePct: +0.45, currency: "HK$", sector: "Banking & Finance" },
    { ticker: "0857",  name: "PetroChina",             price: 7.89,    changePct: -0.23, currency: "HK$", sector: "Energy" },
  ],

  ID: [
    { ticker: "BBCA",  name: "Bank Central Asia",      price: 9850,    changePct: +1.45, currency: "Rp", sector: "Banking & Finance" },
    { ticker: "BBRI",  name: "Bank Rakyat Indonesia",  price: 5100,    changePct: +0.89, currency: "Rp", sector: "Banking & Finance" },
    { ticker: "BMRI",  name: "Bank Mandiri",           price: 6750,    changePct: +1.12, currency: "Rp", sector: "Banking & Finance" },
    { ticker: "TLKM",  name: "Telkom Indonesia",       price: 3400,    changePct: +0.67, currency: "Rp", sector: "Telecom" },
    { ticker: "ASII",  name: "Astra International",    price: 4950,    changePct: +0.78, currency: "Rp", sector: "Industrial" },
    { ticker: "UNVR",  name: "Unilever Indonesia",     price: 2150,    changePct: -0.45, currency: "Rp", sector: "Consumer" },
    { ticker: "GOTO",  name: "GoTo Gojek Tokopedia",   price: 68,      changePct: +2.34, currency: "Rp", sector: "Technology" },
    { ticker: "ANTM",  name: "Aneka Tambang",          price: 1675,    changePct: +1.56, currency: "Rp", sector: "Mining & Resources" },
    { ticker: "SMGR",  name: "Semen Indonesia",        price: 5800,    changePct: +0.45, currency: "Rp", sector: "Industrial" },
    { ticker: "HMSP",  name: "H.M. Sampoerna",         price: 875,     changePct: -0.89, currency: "Rp", sector: "Consumer" },
  ],

  MY: [
    { ticker: "MAYBANK", name: "Malayan Banking",      price: 9.45,    changePct: +1.23, currency: "RM", sector: "Banking & Finance" },
    { ticker: "CIMB",    name: "CIMB Group",           price: 7.89,    changePct: +0.89, currency: "RM", sector: "Banking & Finance" },
    { ticker: "PUBBANK",  name: "Public Bank",         price: 4.23,    changePct: +0.67, currency: "RM", sector: "Banking & Finance" },
    { ticker: "PCHEM",   name: "Petronas Chemicals",   price: 6.78,    changePct: +1.45, currency: "RM", sector: "Energy" },
    { ticker: "TENAGA",  name: "Tenaga Nasional",      price: 12.34,   changePct: +0.45, currency: "RM", sector: "Utilities" },
    { ticker: "DIGI",    name: "CelcomDigi",           price: 3.89,    changePct: +0.34, currency: "RM", sector: "Telecom" },
    { ticker: "IHH",     name: "IHH Healthcare",      price: 6.56,    changePct: +0.78, currency: "RM", sector: "Healthcare" },
    { ticker: "GENTING", name: "Genting Berhad",      price: 4.12,    changePct: -0.45, currency: "RM", sector: "Consumer" },
    { ticker: "AXIATA",  name: "Axiata Group",        price: 2.56,    changePct: +0.56, currency: "RM", sector: "Telecom" },
    { ticker: "KLCC",    name: "KLCCP Stapled",       price: 7.23,    changePct: +0.23, currency: "RM", sector: "Real Estate" },
  ],

  TH: [
    { ticker: "PTT",   name: "PTT PCL",               price: 34.56,   changePct: -1.45, currency: "฿", sector: "Energy" },
    { ticker: "PTTEP", name: "PTT Exploration",        price: 123.45,  changePct: -0.89, currency: "฿", sector: "Energy" },
    { ticker: "KBANK", name: "Kasikorn Bank",          price: 145.67,  changePct: -1.23, currency: "฿", sector: "Banking & Finance" },
    { ticker: "SCB",   name: "Siam Commercial Bank",   price: 112.34,  changePct: -1.12, currency: "฿", sector: "Banking & Finance" },
    { ticker: "BBL",   name: "Bangkok Bank",           price: 156.78,  changePct: -0.89, currency: "฿", sector: "Banking & Finance" },
    { ticker: "CPALL", name: "CP All PCL",             price: 67.89,   changePct: -0.56, currency: "฿", sector: "Consumer" },
    { ticker: "ADVANC",name: "AIS (Advanced Info)",    price: 212.34,  changePct: -0.34, currency: "฿", sector: "Telecom" },
    { ticker: "SCC",   name: "Siam Cement Group",      price: 234.56,  changePct: -1.67, currency: "฿", sector: "Industrial" },
    { ticker: "AOT",   name: "Airports of Thailand",   price: 67.89,   changePct: -1.34, currency: "฿", sector: "Transportation" },
    { ticker: "INTUCH",name: "Intouch Holdings",       price: 56.78,   changePct: -0.45, currency: "฿", sector: "Telecom" },
  ],

  PH: [
    { ticker: "SM",    name: "SM Investments",         price: 878.90,  changePct: +1.12, currency: "₱", sector: "Consumer" },
    { ticker: "ALI",   name: "Ayala Land",             price: 28.45,   changePct: +0.78, currency: "₱", sector: "Real Estate" },
    { ticker: "BDO",   name: "BDO Unibank",            price: 145.67,  changePct: +0.89, currency: "₱", sector: "Banking & Finance" },
    { ticker: "BPI",   name: "Bank of Philippines Islands",price:112.34,changePct:+0.67,currency:"₱",sector:"Banking & Finance"},
    { ticker: "JFC",   name: "Jollibee Foods",         price: 178.90,  changePct: +0.45, currency: "₱", sector: "Consumer" },
    { ticker: "GLO",   name: "Globe Telecom",          price: 1890.45, changePct: +0.34, currency: "₱", sector: "Telecom" },
    { ticker: "AC",    name: "Ayala Corp.",            price: 678.90,  changePct: +0.56, currency: "₱", sector: "Industrial" },
    { ticker: "SMPH",  name: "SM Prime Holdings",      price: 34.56,   changePct: +0.89, currency: "₱", sector: "Real Estate" },
    { ticker: "DITO",  name: "DITO CME Holdings",      price: 1.89,    changePct: +1.23, currency: "₱", sector: "Telecom" },
    { ticker: "MONDE", name: "Monde Nissin",           price: 12.34,   changePct: +0.45, currency: "₱", sector: "Consumer" },
  ],

  VN: [
    { ticker: "VHM",   name: "Vinhomes",               price: 34.56,   changePct: +2.34, currency: "₫", sector: "Real Estate" },
    { ticker: "VCB",   name: "Vietcombank",            price: 89.45,   changePct: +1.56, currency: "₫", sector: "Banking & Finance" },
    { ticker: "BID",   name: "BIDV",                   price: 45.67,   changePct: +1.12, currency: "₫", sector: "Banking & Finance" },
    { ticker: "CTG",   name: "VietinBank",             price: 34.56,   changePct: +0.89, currency: "₫", sector: "Banking & Finance" },
    { ticker: "MSN",   name: "Masan Group",            price: 78.90,   changePct: +1.78, currency: "₫", sector: "Consumer" },
    { ticker: "VNM",   name: "Vinamilk",               price: 67.89,   changePct: +0.67, currency: "₫", sector: "Consumer" },
    { ticker: "FPT",   name: "FPT Corp.",              price: 123.45,  changePct: +2.12, currency: "₫", sector: "Technology" },
    { ticker: "VIC",   name: "Vingroup",               price: 45.67,   changePct: +1.89, currency: "₫", sector: "Industrial" },
    { ticker: "HPG",   name: "Hoa Phat Group",         price: 28.45,   changePct: +1.34, currency: "₫", sector: "Industrial" },
    { ticker: "VEA",   name: "Vietnam Automobile",     price: 34.56,   changePct: +1.56, currency: "₫", sector: "Automotive" },
  ],

  PK: [
    { ticker: "OGDC",  name: "OGDCL",                  price: 178.90,  changePct: +1.89, currency: "Rs", sector: "Energy" },
    { ticker: "HBL",   name: "Habib Bank Ltd.",        price: 145.67,  changePct: +1.56, currency: "Rs", sector: "Banking & Finance" },
    { ticker: "UBL",   name: "United Bank Ltd.",       price: 234.56,  changePct: +1.23, currency: "Rs", sector: "Banking & Finance" },
    { ticker: "MCB",   name: "MCB Bank",               price: 289.45,  changePct: +1.45, currency: "Rs", sector: "Banking & Finance" },
    { ticker: "LUCK",  name: "Lucky Cement",           price: 1234.56, changePct: +0.89, currency: "Rs", sector: "Industrial" },
    { ticker: "ENGRO", name: "Engro Corp.",            price: 345.67,  changePct: +1.12, currency: "Rs", sector: "Industrial" },
    { ticker: "PPL",   name: "Pakistan Petroleum",     price: 123.45,  changePct: +0.78, currency: "Rs", sector: "Energy" },
    { ticker: "MTPL",  name: "Pakistan Mobile",        price: 23.45,   changePct: +2.34, currency: "Rs", sector: "Telecom" },
    { ticker: "PSO",   name: "Pakistan State Oil",     price: 456.78,  changePct: +0.67, currency: "Rs", sector: "Energy" },
    { ticker: "HUBC",  name: "Hub Power",              price: 145.67,  changePct: +0.56, currency: "Rs", sector: "Utilities" },
  ],

  BD: [
    { ticker: "GP",    name: "Grameenphone",           price: 345.67,  changePct: -1.89, currency: "৳", sector: "Telecom" },
    { ticker: "BRACBANK",name:"BRAC Bank",             price: 45.67,   changePct: -1.56, currency: "৳", sector: "Banking & Finance" },
    { ticker: "SQPHARMA",name:"Square Pharma",         price: 234.56,  changePct: -0.89, currency: "৳", sector: "Healthcare" },
    { ticker: "DUTCHBA",name: "Dutch-Bangla Bank",     price: 89.45,   changePct: -1.23, currency: "৳", sector: "Banking & Finance" },
    { ticker: "BEXIMCO",name: "Beximco Ltd.",          price: 23.45,   changePct: -2.34, currency: "৳", sector: "Consumer" },
    { ticker: "ISLAMI",  name: "Islami Bank BD",       price: 34.56,   changePct: -1.12, currency: "৳", sector: "Banking & Finance" },
    { ticker: "RENATA",  name: "Renata Ltd.",          price: 678.90,  changePct: -0.67, currency: "৳", sector: "Healthcare" },
  ],

  LK: [
    { ticker: "DIAL",  name: "Dialog Axiata",          price: 12.34,   changePct: +0.89, currency: "Rs", sector: "Telecom" },
    { ticker: "JKH",   name: "John Keells Holdings",   price: 178.90,  changePct: +0.67, currency: "Rs", sector: "Consumer" },
    { ticker: "COMB",  name: "Commercial Bank",        price: 89.45,   changePct: +0.45, currency: "Rs", sector: "Banking & Finance" },
    { ticker: "HNB",   name: "Hatton National Bank",   price: 145.67,  changePct: +0.56, currency: "Rs", sector: "Banking & Finance" },
    { ticker: "SAMP",  name: "Sampath Bank",           price: 67.89,   changePct: +0.34, currency: "Rs", sector: "Banking & Finance" },
    { ticker: "NDB",   name: "NDB Bank",               price: 78.90,   changePct: +0.23, currency: "Rs", sector: "Banking & Finance" },
    { ticker: "LOLC",  name: "LOLC Holdings",          price: 456.78,  changePct: +0.78, currency: "Rs", sector: "Banking & Finance" },
  ],

  NZ: [
    { ticker: "FPH",   name: "Fisher & Paykel Healthcare",price:23.45, changePct: +0.89, currency: "NZ$", sector: "Healthcare" },
    { ticker: "ATM",   name: "a2 Milk Company",        price: 5.67,    changePct: +0.67, currency: "NZ$", sector: "Consumer" },
    { ticker: "MEL",   name: "Meridian Energy",        price: 5.23,    changePct: +0.45, currency: "NZ$", sector: "Utilities" },
    { ticker: "MCY",   name: "Mercury NZ",             price: 6.12,    changePct: +0.34, currency: "NZ$", sector: "Utilities" },
    { ticker: "CEN",   name: "Contact Energy",         price: 8.45,    changePct: +0.23, currency: "NZ$", sector: "Utilities" },
    { ticker: "SKL",   name: "Skellerup Holdings",     price: 4.89,    changePct: +0.56, currency: "NZ$", sector: "Industrial" },
    { ticker: "IFT",   name: "Infratil Ltd.",          price: 9.78,    changePct: +0.78, currency: "NZ$", sector: "Industrial" },
    { ticker: "SPK",   name: "Spark New Zealand",      price: 4.23,    changePct: -0.34, currency: "NZ$", sector: "Telecom" },
  ],

  KZ: [
    { ticker: "KMG",   name: "KazMunaiGaz",            price: 1234.56, changePct: +1.45, currency: "₸", sector: "Energy" },
    { ticker: "HSBK",  name: "Halyk Bank",             price: 156.78,  changePct: +1.12, currency: "₸", sector: "Banking & Finance" },
    { ticker: "KCEL",  name: "Kcell Telecom",          price: 1890.45, changePct: +0.89, currency: "₸", sector: "Telecom" },
    { ticker: "KEGOC", name: "Kazakhstan Electricity", price: 1234.56, changePct: +0.67, currency: "₸", sector: "Utilities" },
    { ticker: "KZTO",  name: "Kazteleport",            price: 234.56,  changePct: +0.45, currency: "₸", sector: "Technology" },
  ],

  /* ─── LATIN AMERICA ─────────────────────────────────────────────────────── */

  AR: [
    { ticker: "YPF",   name: "YPF S.A.",               price: 18.90,   changePct: +3.45, currency: "$", sector: "Energy" },
    { ticker: "MELI",  name: "MercadoLibre",           price: 1789.45, changePct: +2.34, currency: "$", sector: "Technology" },
    { ticker: "BMA",   name: "Banco Macro",            price: 456.78,  changePct: +2.12, currency: "ARS", sector: "Banking & Finance" },
    { ticker: "GGAL",  name: "Grupo Financiero Galicia",price: 234.56, changePct: +1.89, currency: "ARS", sector: "Banking & Finance" },
    { ticker: "PAMP",  name: "Pampa Energía",          price: 678.90,  changePct: +2.56, currency: "ARS", sector: "Energy" },
    { ticker: "TRAN",  name: "Transener",              price: 3456.78, changePct: +1.67, currency: "ARS", sector: "Utilities" },
    { ticker: "ALUA",  name: "Aluar Aluminio",         price: 1234.56, changePct: +1.45, currency: "ARS", sector: "Industrial" },
    { ticker: "CRES",  name: "Cresud",                 price: 234.56,  changePct: +1.23, currency: "ARS", sector: "Consumer" },
    { ticker: "TXAR",  name: "Ternium Argentina",      price: 567.89,  changePct: +1.12, currency: "ARS", sector: "Industrial" },
    { ticker: "CVH",   name: "Cablevision Holding",    price: 1234.56, changePct: +0.89, currency: "ARS", sector: "Telecom" },
  ],

  CO: [
    { ticker: "EC",    name: "Ecopetrol S.A.",         price: 8.90,    changePct: -2.12, currency: "COP", sector: "Energy" },
    { ticker: "BCOLO", name: "Bancolombia",            price: 34560,   changePct: -1.56, currency: "COP", sector: "Banking & Finance" },
    { ticker: "PFBCOLOM",name:"Bancolombia Pref",      price: 29000,   changePct: -1.34, currency: "COP", sector: "Banking & Finance" },
    { ticker: "PFAVH",  name: "Avianca Holdings",      price: 1234,    changePct: -0.89, currency: "COP", sector: "Transportation" },
    { ticker: "ISA",    name: "Interconexión Eléctrica",price: 12345,  changePct: -0.67, currency: "COP", sector: "Utilities" },
    { ticker: "NUTRESA",name: "Grupo Nutresa",         price: 34567,   changePct: -0.45, currency: "COP", sector: "Consumer" },
  ],

  CL: [
    { ticker: "SQM-B", name: "SQM Lithium",           price: 45.67,   changePct: +0.89, currency: "CLP", sector: "Mining & Resources" },
    { ticker: "FALABELLA",name:"Falabella",            price: 1234,    changePct: -0.67, currency: "CLP", sector: "Consumer" },
    { ticker: "COPEC",  name: "Empresas Copec",        price: 6789,    changePct: +0.45, currency: "CLP", sector: "Energy" },
    { ticker: "BSANTANDER",name:"Banco Santander Chile",price:34.56,  changePct: +0.34, currency: "CLP", sector: "Banking & Finance" },
    { ticker: "CHILE",  name: "Banco de Chile",        price: 89.45,   changePct: +0.56, currency: "CLP", sector: "Banking & Finance" },
    { ticker: "ENELCHILE",name:"Enel Chile",           price: 67.89,   changePct: +0.78, currency: "CLP", sector: "Utilities" },
    { ticker: "ANTARCHILE",name:"Antarchile",          price: 8901,    changePct: +0.23, currency: "CLP", sector: "Mining & Resources" },
    { ticker: "CCU",    name: "Cia Cervecerias Unidas",price: 6789,    changePct: -0.34, currency: "CLP", sector: "Consumer" },
  ],

  PE: [
    { ticker: "SCCO",  name: "Southern Copper",        price: 89.45,   changePct: +1.89, currency: "PEN", sector: "Mining & Resources" },
    { ticker: "BAP",   name: "Credicorp Ltd.",         price: 145.67,  changePct: +0.78, currency: "PEN", sector: "Banking & Finance" },
    { ticker: "BRIOSF",name: "Buenaventura",           price: 12.34,   changePct: +1.23, currency: "PEN", sector: "Mining & Resources" },
    { ticker: "FERREYC",name:"Ferreycorp",             price: 2.89,    changePct: +0.45, currency: "PEN", sector: "Industrial" },
    { ticker: "IFS",   name: "Intercorp Financial",    price: 23.45,   changePct: +0.67, currency: "PEN", sector: "Banking & Finance" },
    { ticker: "CPACASC",name:"Alicorp",                price: 6.78,    changePct: -0.34, currency: "PEN", sector: "Consumer" },
  ],
  
  GY: [
    { ticker: "DEMERARA", name: "Demerara Bank",        price: 234.50,  changePct: +1.20, currency: "GYD", sector: "Banking & Finance" },
    { ticker: "BANKS",    name: "Banks DIH Ltd.",       price: 145.20,  changePct: +0.80, currency: "GYD", sector: "Consumer" },
    { ticker: "GPL",      name: "Guyana Power & Light", price: 12.30,   changePct: 0.00,  currency: "GYD", sector: "Utilities" }
  ],
  
  DZ: [
    { ticker: "SONATRACH", name: "Sonatrach Gas",       price: 1234.50, changePct: +1.50, currency: "DZD", sector: "Energy" },
    { ticker: "BNA",       name: "Nationale d'Algerie", price: 456.20,  changePct: +0.60, currency: "DZD", sector: "Banking & Finance" },
    { ticker: "CEVITAL",   name: "Cevital Agro Group",  price: 789.30,  changePct: -0.40, currency: "DZD", sector: "Consumer" }
  ],
};

function getSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getRnd(str, seedOffset) {
  const seed = getSeed(str) + seedOffset;
  const s = Math.sin(seed) * 10000;
  return s - Math.floor(s);
}

function populateStockDetails(stock, countryCode) {
  const symbol = stock.symbol || stock.ticker;
  const price = stock.price;
  const currency = stock.currency || "$";
  
  const seedStr = symbol + countryCode;
  
  // Deterministic technical & financial metrics
  const pe = 10 + getRnd(seedStr, 1) * 25; // P/E between 10 and 35
  const eps = price / pe;
  
  // Market cap calculation: price * shares
  const sharesMultiplier = getRnd(seedStr, 2) > 0.6 ? 1000000000 : 50000000;
  const shares = 10000000 + Math.floor(getRnd(seedStr, 3) * sharesMultiplier);
  const mcapVal = price * shares;
  let marketCap;
  if (mcapVal >= 1e12) {
    marketCap = currency + (mcapVal / 1e12).toFixed(2) + "T";
  } else if (mcapVal >= 1e9) {
    marketCap = currency + (mcapVal / 1e9).toFixed(2) + "B";
  } else {
    marketCap = currency + (mcapVal / 1e6).toFixed(2) + "M";
  }
  
  // Volume: deterministic between 10K and 5M
  const volVal = 10000 + Math.floor(getRnd(seedStr, 4) * 4990000);
  let volume;
  if (volVal >= 1e6) {
    volume = (volVal / 1e6).toFixed(2) + "M";
  } else {
    volume = Math.floor(volVal / 1000) + "K";
  }
  
  const week52High = price * (1 + getRnd(seedStr, 5) * 0.3);
  const week52Low = price * (1 - getRnd(seedStr, 6) * 0.3);
  
  // Sparkline history: 7 data points
  const sparkline = [];
  let currPrice = price * (1 - getRnd(seedStr, 7) * 0.05);
  for (let i = 0; i < 7; i++) {
    sparkline.push(currPrice);
    currPrice += (getRnd(seedStr, 8 + i) - 0.48) * 0.02 * price;
  }
  sparkline[6] = price; // Ensure last matches current price
  
  const description = `${stock.name} is a leading player in the ${stock.sector.toLowerCase()} sector, focused on delivering value and innovation to its domestic and international customers.`;

  return {
    ...stock,
    symbol,
    country: countryCode,
    pe,
    eps,
    marketCap,
    volume,
    week52High,
    week52Low,
    sparkline,
    description
  };
}

export function getStocksForCountry(countryCode) {
  const code = (countryCode || "").toUpperCase();
  const list = STOCKS_BY_COUNTRY[code] || [];
  return list.map(stock => populateStockDetails(stock, code));
}

export function searchStocks(query) {
  if (!query) return [];
  const q = query.toLowerCase();
  const results = [];
  Object.entries(STOCKS_BY_COUNTRY).forEach(([country, list]) => {
    list.forEach(stock => {
      const sym = (stock.symbol || stock.ticker || "").toLowerCase();
      const name = (stock.name || "").toLowerCase();
      if (sym.includes(q) || name.includes(q)) {
        results.push(populateStockDetails(stock, country));
      }
    });
  });
  return results;
}

