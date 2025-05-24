'use client';
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export default function Page() {
  const [ticker, setTicker] = useState("");
  const [priceData, setPriceData] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [metricsData, setMetricsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const upperTicker = ticker.toUpperCase();
      const priceRes = await fetch(`/api/price?ticker=${upperTicker}`);
      const priceJson = await priceRes.json();
      const incomeRes = await fetch(`/api/income?ticker=${upperTicker}`);
      const incomeJson = await incomeRes.json();

      if (priceJson.error || incomeJson.error) throw new Error("API 오류");

      setPriceData(priceJson.prices);
      const reports = incomeJson.data || [];

      setIncomeData(
        reports.map((r) => ({
          date: r.fiscalDateEnding,
          revenue: Number(r.totalRevenue),
          netIncome: Number(r.netIncome)
        }))
      );

      setMetricsData(
        reports.map((r) => ({
          date: r.fiscalDateEnding,
          operatingMargin:
            r.operatingIncome && r.totalRevenue
              ? (Number(r.operatingIncome) / Number(r.totalRevenue)) * 100
              : null,
          eps: r.eps ? Number(r.eps) : null,
          roe:
            r.netIncome && r.totalShareholderEquity
              ? (Number(r.netIncome) / Number(r.totalShareholderEquity)) * 100
              : null,
          debtRatio:
            r.totalLiabilities && r.totalAssets
              ? (Number(r.totalLiabilities) / Number(r.totalAssets)) * 100
              : null
        }))
      );
    } catch (e) {
      setError("데이터 불러오기 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", background: "black", color: "white", fontFamily: "Arial" }}>
      <h1 style={{ fontSize: "2rem" }}>📈 미국 주식 분석기</h1>
      <input
        placeholder="티커 (예: AAPL)"
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        style={{ padding: "0.5rem", marginRight: "0.5rem", fontSize: "1rem" }}
      />
      <button onClick={fetchData} style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}>분석하기</button>

      {loading && <p>불러오는 중...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* 주가 */}
      {priceData.length > 0 && (
        <>
          <h2 style={{ marginTop: 30 }}>주가 추이</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={priceData} margin={{ bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-30} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line dataKey="close" stroke="#00eaff" name="주가" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}

      {/* 매출 */}
      {incomeData.length > 0 && (
        <>
          <h2 style={{ marginTop: 30 }}>매출 추이</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={incomeData} margin={{ bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-30} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line dataKey="revenue" stroke="#1f77b4" name="매출" dot={false} />
            </LineChart>
          </ResponsiveContainer>

          <h2 style={{ marginTop: 30 }}>순이익 추이</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={incomeData} margin={{ bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-30} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line dataKey="netIncome" stroke="#ff7f0e" name="순이익" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}

      {/* 재무 지표 */}
      {metricsData.length > 0 && (
        <>
          <h2 style={{ marginTop: 30 }}>재무 지표 추이</h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={metricsData} margin={{ bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-30} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line dataKey="operatingMargin" stroke="#8884d8" name="영업이익률 %" dot={false} />
              <Line dataKey="eps" stroke="#82ca9d" name="EPS" dot={false} />
              <Line dataKey="roe" stroke="#ffbb28" name="ROE %" dot={false} />
              <Line dataKey="debtRatio" stroke="#d62728" name="부채비율 %" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
