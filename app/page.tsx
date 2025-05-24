
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

      if (json.error) {
        setError(json.error);
        return;
      }

      const reports = json.data.reverse();
      const stats = {
        totalRevenue: [],
        netIncome: []
      };

      for (const r of reports) {
        const date = r.fiscalDateEnding;
        const rev = +r.totalRevenue;
        const ni = +r.netIncome;

        stats.totalRevenue.push({ date, value: rev });
        stats.netIncome.push({ date, value: ni });
      }

      setStatMap(stats);

      const priceRes = await fetch(`/api/price?ticker=${ticker}`);
      const priceJson = await priceRes.json();
      if (!priceJson.error) {
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

      {statMap.totalRevenue && renderChart("매출 추이", statMap.totalRevenue, "#1f77b4")}
      {statMap.netIncome && renderChart("순이익 추이", statMap.netIncome, "#ff7f0e")}
    </div>
  );
}
