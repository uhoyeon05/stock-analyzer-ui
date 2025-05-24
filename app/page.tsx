'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function Page() {
  const [ticker, setTicker] = useState('AAPL');
  const [prices, setPrices] = useState([]);
  const [statMap, setStatMap] = useState({});
  const [error, setError] = useState('');

  const formatNumber = (num: number) => {
    if (Math.abs(num) >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const fetchData = async () => {
    setError('');
    try {
      const res = await fetch(`/api/income?ticker=${ticker}`);
      const json = await res.json();

      if (json.error || !Array.isArray(json.data)) {
        setError('데이터 불러오기 실패');
        return;
      }

      const reports = json.data.reverse();
      const stats = {
        totalRevenue: [],
        netIncome: [],
        operatingMargin: [],
        eps: [],
        per: [],
        pbr: [],
        roe: [],
        debtRatio: [],
      };

      for (const r of reports) {
        const date = r.fiscalDateEnding;
        const rev = +r.totalRevenue;
        const ni = +r.netIncome;
        const oe = +r.operatingIncome;
        const ta = +r.totalAssets;
        const tl = +r.totalLiabilities;
        const equity = ta - tl;
        const shares = +r.commonStockSharesOutstanding;

        stats.totalRevenue.push({ date, value: rev });
        stats.netIncome.push({ date, value: ni });
        stats.operatingMargin.push({ date, value: (oe / rev) * 100 });
        stats.eps.push({ date, value: ni / shares });
        stats.per.push({ date, value: rev && shares ? rev / shares : 0 });
        stats.pbr.push({ date, value: equity ? rev / equity : 0 });
        stats.roe.push({ date, value: equity ? (ni / equity) * 100 : 0 });
        stats.debtRatio.push({ date, value: equity ? (tl / equity) * 100 : 0 });
      }

      setStatMap(stats);

      const priceRes = await fetch(`/api/price?ticker=${ticker}`);
      const priceJson = await priceRes.json();
      if (!priceJson.error && Array.isArray(priceJson.prices)) {
        setPrices(priceJson.prices.map(p => ({ date: p.date, value: p.close })).reverse());
      }
    } catch (e: any) {
      setError('API 오류 발생');
    }
  };

  const renderChart = (title: string, data: any[], color: string) => (
    <div style={{ marginTop: '3rem' }}>
      <h2>{title}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={formatNumber} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => formatNumber(v as number)} />
          <Legend />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', background: 'black', color: 'white' }}>
      <h1 style={{ fontSize: '2rem' }}>📈 미국 주식 분석기</h1>
      <input
        list="tickers"
        value={ticker}
        onChange={e => setTicker(e.target.value)}
        placeholder="티커 (예: AAPL)"
        style={{ padding: '0.5rem', marginRight: '1rem', fontSize: '1rem' }}
      />
      <datalist id="tickers">
        <option value="AAPL" />
        <option value="GOOGL" />
        <option value="MSFT" />
        <option value="TSLA" />
        <option value="NVDA" />
        <option value="AMZN" />
        <option value="META" />
      </datalist>
      <button onClick={fetchData} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>
        분석하기
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {prices.length > 0 &&
        renderChart("주가 추이", prices, "#00eaff")}

      {Object.entries(statMap).map(([key, data]) =>
        renderChart(
          {
            totalRevenue: "매출 추이",
            netIncome: "순이익 추이",
            operatingMargin: "영업이익률 (%)",
            eps: "EPS",
            per: "PER",
            pbr: "PBR",
            roe: "ROE (%)",
            debtRatio: "부채비율 (%)",
          }[key],
          data,
          {
            totalRevenue: "#1f77b4",
            netIncome: "#ff7f0e",
            operatingMargin: "#2ca02c",
            eps: "#d62728",
            per: "#9467bd",
            pbr: "#8c564b",
            roe: "#e377c2",
            debtRatio: "#7f7f7f",
          }[key]
        )
      )}
    </div>
  );
}
