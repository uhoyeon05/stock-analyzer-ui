'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function Page() {
  const [ticker, setTicker] = useState('');
  const [priceData, setPriceData] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const priceRes = await fetch(`/api/price?ticker=${ticker}`);
      const priceJson = await priceRes.json();
      const incomeRes = await fetch(`/api/income?ticker=${ticker}`);
      const incomeJson = await incomeRes.json();

      if (priceJson.error || incomeJson.error) {
        throw new Error('API 호출 실패');
      }

      setPriceData(priceJson.prices.reverse());
      setIncomeData(incomeJson.data.reverse());
    } catch (e) {
      setError('데이터 불러오기 실패');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (Math.abs(num) >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
    if (Math.abs(num) >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    return num.toString();
  };

  return (
    <div style={{ padding: '2rem', background: 'black', color: 'white', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '2rem' }}>📈 미국 주식 분석기</h1>
      <input
        type="text"
        placeholder="티커 입력 (예: AAPL)"
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        style={{ padding: '0.5rem', fontSize: '1rem', marginRight: '1rem' }}
      />
      <button onClick={fetchData} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>
        분석하기
      </button>

      {loading && <p>불러오는 중...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {priceData.length > 0 && (
        <>
          <h2>주가 추이</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="close" stroke="#00eaff" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}

      {incomeData.length > 0 && (
        <>
          <h2 style={{ marginTop: '2rem' }}>매출 & 순이익 추이</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={incomeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fiscalDateEnding" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={formatNumber} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalRevenue" stroke="#1f77b4" dot={false} name="매출" />
              <Line type="monotone" dataKey="netIncome" stroke="#ff7f0e" dot={false} name="순이익" />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}