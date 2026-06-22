export interface AssetDocument {
  name: string;
  type: "legal" | "financial" | "audit" | "technical";
  date: string;
  size: string;
}

export interface InvestmentEvent {
  date: string;
  type: "purchase" | "yield" | "redemption" | "listing";
  description: string;
  amount?: number;
}

export interface Asset {
  id: string;
  name: string;
  type: "real-estate" | "commodity" | "treasury" | "infrastructure";
  location: string;
  totalValue: number;
  tokenPrice: number;
  totalTokens: number;
  soldTokens: number;
  annualYield: number;
  image: string;
  status: "active" | "upcoming" | "sold-out";
  description: string;
  longDescription?: string;
  highlights?: string[];
  documents?: AssetDocument[];
  investmentHistory?: InvestmentEvent[];
  contractAddress?: string;
  blockchain?: string;
  launchDate?: string;
  maturityDate?: string;
}

export interface PortfolioItem {
  asset: Asset;
  tokensOwned: number;
  totalInvested: number;
  currentValue: number;
  yieldEarned: number;
  pendingYield: number;
}

export const mockAssets: Asset[] = [
  {
    id: "1",
    name: "Manhattan Office Tower",
    type: "real-estate",
    location: "New York, USA",
    totalValue: 25000000,
    tokenPrice: 50,
    totalTokens: 500000,
    soldTokens: 425000,
    annualYield: 8.5,
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600",
    status: "active",
    description: "Premium Grade-A office space in Midtown Manhattan with long-term corporate tenants.",
    longDescription: "This Class A office tower in the heart of Midtown Manhattan offers 45 floors of premium commercial space. The property features LEED Gold certification, state-of-the-art amenities, and a 97% occupancy rate with blue-chip tenants on long-term leases averaging 8 years. The building underwent a $12M renovation in 2023, including lobby modernization and smart building technology integration. Located two blocks from Grand Central Terminal with excellent transit access.",
    highlights: [
      "97% occupancy rate with Fortune 500 tenants",
      "LEED Gold certified with ESG-compliant operations",
      "$12M renovation completed in 2023",
      "Average lease term of 8 years remaining",
      "Prime Midtown location near Grand Central Terminal",
    ],
    contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
    blockchain: "Ethereum (Sepolia)",
    launchDate: "Jan 15, 2025",
    maturityDate: "Jan 15, 2035",
    documents: [
      { name: "Property Valuation Report", type: "financial", date: "Dec 2024", size: "2.4 MB" },
      { name: "Legal Title & Deed", type: "legal", date: "Jan 2025", size: "1.8 MB" },
      { name: "Environmental Audit", type: "audit", date: "Nov 2024", size: "3.1 MB" },
      { name: "Smart Contract Audit (CertiK)", type: "technical", date: "Jan 2025", size: "890 KB" },
      { name: "Investor Prospectus", type: "financial", date: "Jan 2025", size: "5.2 MB" },
    ],
    investmentHistory: [
      { date: "Jan 15, 2025", type: "listing", description: "Asset listed on Cyber Estate marketplace" },
      { date: "Jan 20, 2025", type: "purchase", description: "Initial token sale — 200,000 tokens sold in first week", amount: 10000000 },
      { date: "Apr 1, 2025", type: "yield", description: "Q1 2025 yield distribution to all token holders", amount: 531250 },
      { date: "Jul 1, 2025", type: "yield", description: "Q2 2025 yield distribution to all token holders", amount: 531250 },
      { date: "Sep 15, 2025", type: "purchase", description: "Secondary market purchase — 100,000 tokens", amount: 5000000 },
      { date: "Oct 1, 2025", type: "yield", description: "Q3 2025 yield distribution to all token holders", amount: 531250 },
    ],
  },
  {
    id: "2",
    name: "Dubai Marina Residences",
    type: "real-estate",
    location: "Dubai, UAE",
    totalValue: 18000000,
    tokenPrice: 25,
    totalTokens: 720000,
    soldTokens: 540000,
    annualYield: 10.2,
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600",
    status: "active",
    description: "Luxury waterfront apartments in Dubai Marina with premium amenities.",
    longDescription: "An exclusive collection of 120 luxury apartments overlooking the Dubai Marina waterfront. Each unit features floor-to-ceiling windows, Italian marble finishes, and access to world-class amenities including infinity pools, a private beach club, spa, and concierge services. The development benefits from Dubai's tax-free rental income policy and high tourist demand for short-term rentals, with an average occupancy rate of 89%.",
    highlights: [
      "120 luxury units with marina and sea views",
      "Tax-free rental income jurisdiction",
      "89% average occupancy rate",
      "Premium amenities: infinity pool, beach club, spa",
      "Managed by leading hospitality group",
    ],
    contractAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    blockchain: "Ethereum (Sepolia)",
    launchDate: "Mar 1, 2025",
    maturityDate: "Mar 1, 2030",
    documents: [
      { name: "Property Appraisal Report", type: "financial", date: "Feb 2025", size: "3.0 MB" },
      { name: "Title Deed (Dubai Land Dept)", type: "legal", date: "Mar 2025", size: "1.2 MB" },
      { name: "Structural Engineering Report", type: "technical", date: "Jan 2025", size: "4.5 MB" },
      { name: "Token Sale Agreement", type: "legal", date: "Mar 2025", size: "780 KB" },
    ],
    investmentHistory: [
      { date: "Mar 1, 2025", type: "listing", description: "Asset listed on Cyber Estate marketplace" },
      { date: "Mar 10, 2025", type: "purchase", description: "Initial sale — 300,000 tokens sold", amount: 7500000 },
      { date: "Jun 1, 2025", type: "yield", description: "Q2 2025 yield distribution", amount: 459000 },
      { date: "Sep 1, 2025", type: "yield", description: "Q3 2025 yield distribution", amount: 459000 },
    ],
  },
  {
    id: "3",
    name: "Gold Reserve Fund",
    type: "commodity",
    location: "Switzerland",
    totalValue: 50000000,
    tokenPrice: 100,
    totalTokens: 500000,
    soldTokens: 500000,
    annualYield: 4.2,
    image: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=600",
    status: "sold-out",
    description: "Fully allocated gold bullion stored in Swiss vaults with annual rebalancing.",
    longDescription: "A fully-backed gold reserve fund holding 99.99% pure gold bullion stored in high-security vaults in Zurich, Switzerland. The fund is audited quarterly by an independent third party and insured against theft, damage, and loss. Token holders receive proportional ownership of the underlying gold assets, with annual rebalancing to maintain 1:1 parity.",
    highlights: [
      "Fully allocated 99.99% pure gold bullion",
      "Stored in LBMA-accredited Swiss vaults",
      "Quarterly independent audits",
      "Full insurance coverage",
      "1:1 gold-to-token parity maintained",
    ],
    blockchain: "Ethereum (Sepolia)",
    launchDate: "Nov 1, 2024",
    documents: [
      { name: "Gold Reserve Certificate", type: "financial", date: "Oct 2024", size: "1.5 MB" },
      { name: "Vault Security Audit", type: "audit", date: "Oct 2024", size: "2.8 MB" },
      { name: "Insurance Certificate", type: "legal", date: "Nov 2024", size: "650 KB" },
    ],
    investmentHistory: [
      { date: "Nov 1, 2024", type: "listing", description: "Gold Reserve Fund launched" },
      { date: "Nov 15, 2024", type: "purchase", description: "Fully subscribed in 2 weeks", amount: 50000000 },
      { date: "Dec 31, 2024", type: "yield", description: "Q4 2024 yield distribution", amount: 525000 },
      { date: "Mar 31, 2025", type: "yield", description: "Q1 2025 yield distribution", amount: 525000 },
    ],
  },
  {
    id: "4",
    name: "US Treasury Bond Fund",
    type: "treasury",
    location: "United States",
    totalValue: 100000000,
    tokenPrice: 10,
    totalTokens: 10000000,
    soldTokens: 7500000,
    annualYield: 5.1,
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600",
    status: "active",
    description: "Diversified US Treasury bond portfolio with quarterly yield distribution.",
    longDescription: "A diversified portfolio of US Treasury bonds across multiple maturities (2-year, 5-year, and 10-year). The fund provides stable, government-backed returns with quarterly yield distributions. Managed by a licensed fund administrator with full regulatory compliance, the fund offers institutional-grade treasury exposure accessible through fractional tokenization at just $10 per token.",
    highlights: [
      "US Government-backed securities",
      "Diversified across 2, 5, and 10-year maturities",
      "Quarterly yield distributions",
      "Licensed fund administrator",
      "Lowest entry point at $10 per token",
    ],
    blockchain: "Ethereum (Sepolia)",
    launchDate: "Feb 1, 2025",
    maturityDate: "Rolling",
    documents: [
      { name: "Fund Prospectus", type: "financial", date: "Jan 2025", size: "4.1 MB" },
      { name: "Regulatory Compliance Certificate", type: "legal", date: "Jan 2025", size: "920 KB" },
      { name: "Portfolio Holdings Report", type: "financial", date: "Dec 2024", size: "1.7 MB" },
      { name: "Smart Contract Audit (OpenZeppelin)", type: "technical", date: "Jan 2025", size: "1.1 MB" },
    ],
    investmentHistory: [
      { date: "Feb 1, 2025", type: "listing", description: "Treasury Bond Fund launched" },
      { date: "Feb 28, 2025", type: "purchase", description: "5M tokens sold in first month", amount: 50000000 },
      { date: "May 1, 2025", type: "yield", description: "Q1 2025 yield distribution", amount: 1275000 },
      { date: "Aug 1, 2025", type: "yield", description: "Q2 2025 yield distribution", amount: 1275000 },
    ],
  },
  {
    id: "5",
    name: "Singapore Data Center",
    type: "infrastructure",
    location: "Singapore",
    totalValue: 35000000,
    tokenPrice: 75,
    totalTokens: 466666,
    soldTokens: 280000,
    annualYield: 9.8,
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600",
    status: "active",
    description: "Tier IV data center with 99.99% uptime guarantee and 15-year lease commitments.",
    longDescription: "A state-of-the-art Tier IV data center facility in Singapore's Jurong Data Centre Park. The facility offers 10MW of IT power capacity, N+1 redundancy across all critical systems, and is fully leased to three major cloud service providers on 15-year contracts. The facility is PUE 1.2 rated, one of the most energy-efficient in the region, and features advanced cooling systems optimized for tropical climates.",
    highlights: [
      "Tier IV certified — 99.995% uptime guarantee",
      "10MW IT power capacity with N+1 redundancy",
      "3 major cloud providers on 15-year leases",
      "PUE 1.2 — industry-leading energy efficiency",
      "Strategic location in APAC's fastest-growing data market",
    ],
    contractAddress: "0x567890abcdef1234567890abcdef123456789012",
    blockchain: "Ethereum (Sepolia)",
    launchDate: "Apr 1, 2025",
    maturityDate: "Apr 1, 2040",
    documents: [
      { name: "Facility Specifications", type: "technical", date: "Mar 2025", size: "6.3 MB" },
      { name: "Lease Agreement Summary", type: "legal", date: "Mar 2025", size: "2.1 MB" },
      { name: "Independent Valuation", type: "financial", date: "Mar 2025", size: "3.4 MB" },
      { name: "Uptime Institute Certification", type: "audit", date: "Feb 2025", size: "1.9 MB" },
    ],
    investmentHistory: [
      { date: "Apr 1, 2025", type: "listing", description: "Data Center asset listed on marketplace" },
      { date: "Apr 30, 2025", type: "purchase", description: "Initial sale — 180,000 tokens sold", amount: 13500000 },
      { date: "Jul 1, 2025", type: "yield", description: "Q2 2025 yield distribution", amount: 857500 },
    ],
  },
  {
    id: "6",
    name: "London Commercial Complex",
    type: "real-estate",
    location: "London, UK",
    totalValue: 42000000,
    tokenPrice: 60,
    totalTokens: 700000,
    soldTokens: 0,
    annualYield: 7.3,
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600",
    status: "upcoming",
    description: "Mixed-use commercial development in the City of London financial district.",
    longDescription: "A newly planned mixed-use commercial development spanning 85,000 sq ft in the City of London. The project will include premium office space, ground-floor retail units, and a rooftop terrace. Construction is expected to begin in Q2 2026 with completion by Q4 2027. The development is pre-leased at 40% and targeting BREEAM Outstanding certification.",
    highlights: [
      "85,000 sq ft mixed-use development",
      "City of London financial district location",
      "40% pre-leased before construction",
      "Targeting BREEAM Outstanding certification",
      "Expected completion Q4 2027",
    ],
    blockchain: "Ethereum (Sepolia)",
    launchDate: "Q1 2026",
    maturityDate: "Q4 2037",
    documents: [
      { name: "Development Prospectus", type: "financial", date: "Nov 2025", size: "7.2 MB" },
      { name: "Planning Permission", type: "legal", date: "Oct 2025", size: "3.8 MB" },
    ],
    investmentHistory: [],
  },
];

export const mockPortfolio: PortfolioItem[] = [
  {
    asset: mockAssets[0],
    tokensOwned: 200,
    totalInvested: 10000,
    currentValue: 11200,
    yieldEarned: 850,
    pendingYield: 125,
  },
  {
    asset: mockAssets[1],
    tokensOwned: 400,
    totalInvested: 10000,
    currentValue: 10800,
    yieldEarned: 1020,
    pendingYield: 210,
  },
  {
    asset: mockAssets[3],
    tokensOwned: 1000,
    totalInvested: 10000,
    currentValue: 10200,
    yieldEarned: 510,
    pendingYield: 85,
  },
];

export const platformStats = {
  totalValueLocked: 270000000,
  totalAssets: 24,
  totalInvestors: 12500,
  avgYield: 7.5,
};
