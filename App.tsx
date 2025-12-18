import React, { useEffect, useState } from 'react';
import { fetchFundData } from './services/fundService';
import { Fund, BASELINE_DATE } from './types';
import { FundCard } from './components/FundCard';
import { FundChart } from './components/FundChart';
import { RefreshCw, BarChart3, Clock } from 'lucide-react';

const App: React.FC = () => {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchFundData();
      setFunds(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BarChart3 className="text-white h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Fund Tracker Pro</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center text-sm text-gray-500 space-x-1">
              <Clock size={14} />
              <span>数据基准日: {BASELINE_DATE}</span>
            </div>
            <button 
              onClick={loadData}
              disabled={loading}
              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{loading ? '更新中...' : '刷新数据'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Intro Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">李蓓资产组合追踪</h2>
          <p className="text-gray-500 mt-1">
            自动统计指定股票自 {BASELINE_DATE} 以来的累计涨跌幅。
            <span className="inline-block ml-2 text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100">
              数据源: 东方财富 (Eastmoney API)
            </span>
          </p>
        </div>

        {loading && funds.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {funds.map(fund => (
                <FundCard key={fund.code} fund={fund} />
              ))}
            </div>

            {/* Chart Section */}
            <section>
              <FundChart funds={funds} />
            </section>
            
            {/* Disclaimer */}
            <div className="text-center text-xs text-gray-400 mt-12 pb-8">
              <p>注：数据实时获取自东方财富接口，展示最近交易日收盘数据。</p>
              <p>最新更新时间: {lastUpdated}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
