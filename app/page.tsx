// app/page.tsx
'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const tickerList = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'BRK.B', 'V', 'UNH'];

export default function Page() {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedTicker, setSelectedTicker] = useState('');
  const [dataMap, setDataMap] = useState<Record<string, any[]>>({});

  const fetchData = async (ticker: string) => {
    const res = await fetch(`/api/income?ticker=${ticker}`);
    const json = await res.json();
    const reports = json.data.reverse();

    const newMap: Record<string, any[]> = {
      revenue: [], netIncome: [], operatingMargin: [], eps: [],
      per: [], pbr: [], roe: [], debt: []
    };

    for (const r of reports) {
      const date = r.fiscalDateEnding;
      const rev = +r.totalRevenue;
      const ni = +r.netIncome;
      const op = +r.operatingIncome;
      const eq = +r.totalAssets - +r.totalLiabilities;
      const shares = +r.commonStockSharesOutstanding;

      newMap.revenue.push({ date, value: rev });
      newMap.netIncome.push({ date, value: ni });
      newMap.operatingMargin.push({ date, value: rev ? (op / rev) * 100 : 0 });
      newMap.eps.push({ date, value: ni / shares });
      newMap.per.push({ date, value: shares ? rev / shares : 0 });
      newMap.pbr.push({ date, value: eq ? rev / eq : 0 });
      newMap.roe.push({ date, value: eq ? (ni / eq) * 100 : 0 });
      newMap.debt.push({ date, value: eq ? (+r.totalLiabilities / eq) * 100 : 0 });
    }

    const priceRes = await fetch(`/api/price?ticker=${ticker}`);
    const priceJson = await priceRes.json();
    newMap.price = priceJson.prices.reverse().map((p: any) => ({ date: p.date, value: p.close }));

    setDataMap(newMap);
  };

  const onInputChange = (v: string) => {
    setInput(v);
    const matched = tickerList.filter(t => t.toLowerCase().startsWith(v.toLowerCase()));
    setSuggestions(matched.slice(0, 5));
  };

  const onSelectTicker = (ticker: string) => {
    setInput(ticker);
    setSuggestions([]);
    setSelectedTicker(ticker);
    fetchData(ticker);
  };

  const format = (n: number) => {
    if (n > 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n > 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    return n.toFixed(0);
  };

  const renderChart = (title: string, key: string, color: string) => (
    <div style={{ marginTop: 40 }}>
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={dataMap[key] || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={format} tick={{ fontSize: 12 }} />
          <Tooltip formatter={v => format(v as number)} />
          <Legend />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div style={{ background: 'black', color: 'white', padding: 32, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2rem' }}>📈 미국 주식 분석기</h1>
      <input
        value={input}
        onChange={e => onInputChange(e.target.value)}
        placeholder="티커 (예: AAPL)"
        style={{ padding: '8px', fontSize: '1rem' }}
      />
      <button onClick={() => onSelectTicker(input)} style={{ marginLeft: 12, padding: '8px 16px' }}>분석하기</button>

      {suggestions.length > 0 && (
        <div style={{ background: '#333', padding: 10, marginTop: 4 }}>
          {suggestions.map(t => (
            <div key={t} style={{ padding: 4, cursor: 'pointer' }} onClick={() => onSelectTicker(t)}>
              {t}
            </div>
          ))}
        </div>
      )}

      {selectedTicker && <>
        {renderChart('주가 추이', 'price', '#00eaff')}
        {renderChart('매출 추이', 'revenue', '#1f77b4')}
        {renderChart('순이익 추이', 'netIncome', '#ff7f0e')}
        {renderChart('영업이익률 (%)', 'operatingMargin', '#2ca02c')}
        {renderChart('EPS', 'eps', '#d62728')}
        {renderChart('PER', 'per', '#9467bd')}
        {renderChart('PBR', 'pbr', '#8c564b')}
        {renderChart('ROE (%)', 'roe', '#e377c2')}
        {renderChart('부채비율 (%)', 'debt', '#7f7f7f')}
      </>}
    </div>
  );
}
