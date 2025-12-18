export interface DailyData {
  date: string;
  nav: number; // Net Asset Value (单位净值)
  growthRate: number; // Daily growth rate (日增长率)
  cumulativeGrowth?: number; // Calculated cumulative growth since start date
}

export interface Fund {
  code: string;
  name: string;
  history: DailyData[];
  latestNav: number;
  latestDate: string;
  totalGrowth: number; // Total growth from baseline
}

// Configuration for the funds we want to track
export const TRACKED_FUNDS = [
  { code: '601186', name: '中国铁建' },
  { code: '601390', name: '中国中铁' },
  { code: '600048', name: '保利发展' },
  { code: '001979', name: '招商蛇口' },
  { code: '600585', name: '海螺水泥' },
  { code: '600887', name: '伊利股份' },
  { code: '600690', name: '海尔智家' },
  { code: '601225', name: '陕西煤业' },
  { code: '601088', name: '中国神华' },
  { code: '601600', name: '中国铝业' },
];

// Baseline date for calculation (Correcting 2025 to 2024 for realistic context)
export const BASELINE_DATE = '2025-12-01';
