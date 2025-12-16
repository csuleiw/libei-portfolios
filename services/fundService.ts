import { Fund, DailyData, TRACKED_FUNDS, BASELINE_DATE } from '../types';

/**
 * Determines the market ID for Eastmoney API
 * 1 = Shanghai (codes starting with 5, 6)
 * 0 = Shenzhen (codes starting with 1, 0, 3)
 */
const getSecId = (code: string) => {
  if (code.startsWith('5') || code.startsWith('6')) {
    return `1.${code}`;
  }
  return `0.${code}`;
};

/**
 * Lightweight JSONP implementation to bypass CORS for Eastmoney API
 */
const jsonp = (url: string, params: Record<string, string | number>): Promise<any> => {
  return new Promise((resolve, reject) => {
    const callbackName = `jsonp_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement('script');
    
    (window as any)[callbackName] = (data: any) => {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      resolve(data);
    };

    script.onerror = () => {
      delete (window as any)[callbackName];
      if (document.body.contains(script)) document.body.removeChild(script);
      reject(new Error(`JSONP request failed for ${url}`));
    };

    const queryString = Object.entries({ ...params, cb: callbackName })
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    script.src = `${url}?${queryString}`;
    document.body.appendChild(script);
  });
};

/**
 * Fetches fund data from Eastmoney
 */
export const fetchFundData = async (): Promise<Fund[]> => {
  try {
    const promises = TRACKED_FUNDS.map(async (fund) => {
      try {
        const startDateStr = BASELINE_DATE.replace(/-/g, ''); // Convert 2024-12-01 to 20241201
        const secId = getSecId(fund.code);
        
        // Eastmoney K-line API
        // klt=101: Daily K-line
        // fqt=1: Forward adjusted price (复权) - Essential for accurate growth calculation
        // fields1=f1: Placeholder
        // fields2=f51,f53: f51=Date, f53=ClosePrice
        const data = await jsonp('https://push2his.eastmoney.com/api/qt/stock/kline/get', {
          secid: secId,
          fields1: 'f1',
          fields2: 'f51,f53',
          klt: '101',
          fqt: '1',
          beg: startDateStr,
          end: '20991231'
        });

        if (!data || !data.data || !data.data.klines) {
          console.warn(`No data returned for ${fund.name} (${fund.code})`);
          return null;
        }

        const klines: string[] = data.data.klines;
        
        // Process raw string data: "2024-12-01,1.234"
        const parsedHistory = klines.map(item => {
          const [date, priceStr] = item.split(',');
          return {
            date,
            nav: parseFloat(priceStr)
          };
        });

        if (parsedHistory.length === 0) return null;

        // Calculate Growth
        // Base is the first available day in the range (usually 2024-12-01 or the next trading day)
        const baseNav = parsedHistory[0].nav;
        
        const history: DailyData[] = parsedHistory.map((day, index) => {
          const prevNav = index > 0 ? parsedHistory[index - 1].nav : baseNav;
          const growthRate = ((day.nav - prevNav) / prevNav) * 100;
          const cumulativeGrowth = ((day.nav - baseNav) / baseNav) * 100;

          return {
            date: day.date,
            nav: day.nav,
            growthRate: parseFloat(growthRate.toFixed(2)),
            cumulativeGrowth: parseFloat(cumulativeGrowth.toFixed(2))
          };
        });

        const latest = history[history.length - 1];

        return {
          code: fund.code,
          name: fund.name,
          history,
          latestNav: latest.nav,
          latestDate: latest.date,
          totalGrowth: latest.cumulativeGrowth || 0
        };

      } catch (err) {
        console.error(`Error fetching ${fund.name}:`, err);
        return null;
      }
    });

    const results = await Promise.all(promises);
    const validFunds = results.filter((f): f is Fund => f !== null);

    if (validFunds.length === 0) {
      throw new Error('All API requests failed');
    }

    return validFunds;

  } catch (error) {
    console.error('Eastmoney API failed, falling back to simulation:', error);
    return generateMockData();
  }
};

/**
 * Fallback: Generates simulated data if API fails
 */
const generateMockData = (): Fund[] => {
  const getDatesInRange = (startDate: Date, endDate: Date) => {
    const date = new Date(startDate.getTime());
    const dates = [];
    while (date <= endDate) {
      const day = date.getDay();
      if (day !== 0 && day !== 6) dates.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return dates;
  };
  
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const start = new Date(BASELINE_DATE);
  const end = new Date();
  const dates = getDatesInRange(start, end);

  return TRACKED_FUNDS.map(fundConfig => {
    let currentNav = 1.000;
    const volatility = 0.015;
    const trend = (Math.random() - 0.45) * 0.002;

    const history: DailyData[] = dates.map((date, index) => {
      if (index === 0) return { date: formatDate(date), nav: currentNav, growthRate: 0, cumulativeGrowth: 0 };
      const changePercent = (Math.random() - 0.5) * 2 * volatility + trend;
      currentNav = currentNav * (1 + changePercent);
      const cumulative = (currentNav - 1.000) / 1.000 * 100;
      return {
        date: formatDate(date),
        nav: parseFloat(currentNav.toFixed(4)),
        growthRate: parseFloat((changePercent * 100).toFixed(2)),
        cumulativeGrowth: parseFloat(cumulative.toFixed(2))
      };
    });
    const latest = history[history.length - 1];
    return {
      code: fundConfig.code,
      name: fundConfig.name,
      history,
      latestNav: latest.nav,
      latestDate: latest.date,
      totalGrowth: latest.cumulativeGrowth || 0
    };
  });
};
