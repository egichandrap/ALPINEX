import React, { useState } from 'react';
import { FileBarChart, CheckCircle2, XCircle, TrendingUp, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [selectedBaseline, setSelectedBaseline] = useState('exec-8a3f91 (Baseline v1.0.1)');
  const [selectedCandidate, setSelectedCandidate] = useState('exec-102bc4 (Candidate v1.0.2)');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileBarChart size={22} color="#6366f1" />
            Reports & Performance Regression Compare
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
            Compare SLA benchmarks, latency distributions, and functional stability across releases.
          </p>
        </div>
        <button
          onClick={() => alert('Report exported as JSON!')}
          style={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '6px',
            color: '#f3f4f6',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Download size={14} /> Export Report
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '16px', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold' }}>AVG PASS RATE</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#10b981', marginTop: '6px' }}>99.2%</div>
          <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
            <ArrowUpRight size={13} /> +0.8% vs last week
          </div>
        </div>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '16px', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold' }}>P95 LATENCY</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#38bdf8', marginTop: '6px' }}>48 ms</div>
          <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
            <ArrowDownRight size={13} /> -12ms faster
          </div>
        </div>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '16px', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold' }}>MAX RPS ACHIEVED</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#f59e0b', marginTop: '6px' }}>1,420 rps</div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Under 50 VUs load</div>
        </div>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '16px', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold' }}>TOTAL SUITES EXECUTED</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#a855f7', marginTop: '6px' }}>34 runs</div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Native HTTP & k6</div>
        </div>
      </div>

      {/* Regression Compare Matrix */}
      <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '14px', color: '#f3f4f6' }}>
          Execution Comparison (Baseline vs Candidate)
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1f2937', color: '#9ca3af' }}>
              <th style={{ padding: '10px 8px' }}>Metric</th>
              <th>Baseline (v1.0.1)</th>
              <th>Candidate (v1.0.2)</th>
              <th>Delta / Verdict</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #1f2937' }}>
              <td style={{ padding: '12px 8px', fontWeight: '600' }}>Median Latency (P50)</td>
              <td>58 ms</td>
              <td>42 ms</td>
              <td style={{ color: '#10b981', fontWeight: 'bold' }}>-27.5% (Improved)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #1f2937' }}>
              <td style={{ padding: '12px 8px', fontWeight: '600' }}>Tail Latency (P95)</td>
              <td>142 ms</td>
              <td>118 ms</td>
              <td style={{ color: '#10b981', fontWeight: 'bold' }}>-16.9% (Improved)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #1f2937' }}>
              <td style={{ padding: '12px 8px', fontWeight: '600' }}>Error Rate (%)</td>
              <td>0.02%</td>
              <td>0.00%</td>
              <td style={{ color: '#10b981', fontWeight: 'bold' }}>0 Errors (Pass)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #1f2937' }}>
              <td style={{ padding: '12px 8px', fontWeight: '600' }}>Throughput (Peak RPS)</td>
              <td>1,120 rps</td>
              <td>1,420 rps</td>
              <td style={{ color: '#10b981', fontWeight: 'bold' }}>+26.7% (Higher Capacity)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
