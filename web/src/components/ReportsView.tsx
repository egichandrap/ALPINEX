import React, { useState, useEffect } from 'react';
import { FileBarChart, CheckCircle2, XCircle, TrendingUp, Download, ArrowUpRight, ArrowDownRight, Layers, Flame } from 'lucide-react';
import { ProjectItem } from '../types/auth';
import { PerformanceReport } from '../types/performance';

interface ReportsViewProps {
  activeProject?: ProjectItem;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ activeProject }) => {
  const [reports, setReports] = useState<PerformanceReport[]>([]);

  useEffect(() => {
    try {
      const key = `alpinex_perf_reports_${activeProject?.id || 'proj-sample'}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        setReports(JSON.parse(raw));
      } else {
        setReports([]);
      }
    } catch (e) {
      console.error('Failed to load reports in ReportsView', e);
    }
  }, [activeProject?.id]);

  const [selectedBaselineId, setSelectedBaselineId] = useState<string>('');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');

  useEffect(() => {
    if (reports.length >= 2) {
      setSelectedBaselineId(reports[1].id);
      setSelectedCandidateId(reports[0].id);
    } else if (reports.length === 1) {
      setSelectedBaselineId(reports[0].id);
      setSelectedCandidateId(reports[0].id);
    }
  }, [reports]);

  const baseline = reports.find((r) => r.id === selectedBaselineId);
  const candidate = reports.find((r) => r.id === selectedCandidateId);

  if (reports.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileBarChart size={22} color="#6366f1" />
              Reports & Performance Regression Compare
            </h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
              Compare SLA benchmarks, latency distributions, and functional stability across separate endpoint test runs.
            </p>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#111827',
            border: '1px dashed #374151',
            borderRadius: '8px',
            padding: '56px 24px',
            textAlign: 'center',
          }}
        >
          <FileBarChart size={44} color="#6366f1" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6' }}>
            No Performance Reports Recorded
          </h3>
          <p style={{ fontSize: '13px', color: '#9ca3af', maxWidth: '480px', margin: '8px auto 0', lineHeight: '1.6' }}>
            There are currently no performance test runs saved for project <strong>{activeProject?.name || 'Active Project'}</strong>.
            Execute a Smoke, Load, Stress, or Spike test in the <strong>Performance Studio (k6)</strong> to generate isolated execution reports and compare regressions here.
          </p>
        </div>
      </div>
    );
  }

  const baselineP50 = baseline ? baseline.p50Latency : 0;
  const candidateP50 = candidate ? candidate.p50Latency : 0;
  const p50Delta = baselineP50 > 0 ? Math.round(((candidateP50 - baselineP50) / baselineP50) * 100) : 0;

  const baselineP95 = baseline ? baseline.p95Latency : 0;
  const candidateP95 = candidate ? candidate.p95Latency : 0;
  const p95Delta = baselineP95 > 0 ? Math.round(((candidateP95 - baselineP95) / baselineP95) * 100) : 0;

  const baselineRps = baseline ? baseline.peakRps : 0;
  const candidateRps = candidate ? candidate.peakRps : 0;
  const rpsDelta = baselineRps > 0 ? Math.round(((candidateRps - baselineRps) / baselineRps) * 100) : 0;

  const baselineErr = baseline ? baseline.errorRate : 0;
  const candidateErr = candidate ? candidate.errorRate : 0;

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
            Compare SLA benchmarks, latency distributions, and functional stability across separate endpoint test runs.
          </p>
        </div>
        <button
          onClick={() => {
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reports, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute('href', dataStr);
            downloadAnchor.setAttribute('download', `alpinex-performance-report-${Date.now()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
          }}
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
          <Download size={14} /> Export Report (JSON)
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '16px', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold' }}>AVG PASS RATE</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#10b981', marginTop: '6px' }}>
            {reports.length > 0 ? `${Math.round((reports.filter((r) => r.verdict === 'PASSED').length / reports.length) * 100)}%` : '99.2%'}
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
            <ArrowUpRight size={13} /> SLA compliance verified
          </div>
        </div>

        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '16px', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold' }}>P95 LATENCY</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#38bdf8', marginTop: '6px' }}>
            {candidate ? `${candidate.p95Latency} ms` : '48 ms'}
          </div>
          <div style={{ fontSize: '11px', color: p95Delta <= 0 ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
            {p95Delta <= 0 ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
            {Math.abs(p95Delta)}% {p95Delta <= 0 ? 'faster' : 'slower'}
          </div>
        </div>

        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '16px', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold' }}>MAX RPS ACHIEVED</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#f59e0b', marginTop: '6px' }}>
            {reports.length > 0 ? `${Math.max(...reports.map((r) => r.peakRps)).toLocaleString()} rps` : '1,420 rps'}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
            {candidate ? `Under ${candidate.targetVUs} VUs load` : 'Under 50 VUs load'}
          </div>
        </div>

        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '16px', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold' }}>TOTAL RUNS RECORDED</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#a855f7', marginTop: '6px' }}>
            {reports.length} runs
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
            Project: {activeProject?.name || 'Active'}
          </div>
        </div>
      </div>

      {/* Regression Compare Matrix */}
      <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '20px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#f3f4f6', margin: 0 }}>
            Side-by-Side Execution Comparison
          </h3>

          {reports.length > 0 && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#9ca3af', display: 'block', marginBottom: '2px' }}>BASELINE RUN:</label>
                <select
                  value={selectedBaselineId}
                  onChange={(e) => setSelectedBaselineId(e.target.value)}
                  style={{ backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#f3f4f6', borderRadius: '4px', padding: '4px 8px', fontSize: '11px' }}
                >
                  {reports.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.profile}] {r.scenarioName} ({new Date(r.timestamp).toLocaleTimeString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#9ca3af', display: 'block', marginBottom: '2px' }}>CANDIDATE RUN:</label>
                <select
                  value={selectedCandidateId}
                  onChange={(e) => setSelectedCandidateId(e.target.value)}
                  style={{ backgroundColor: '#0b0f19', border: '1px solid #374151', color: '#f3f4f6', borderRadius: '4px', padding: '4px 8px', fontSize: '11px' }}
                >
                  {reports.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.profile}] {r.scenarioName} ({new Date(r.timestamp).toLocaleTimeString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1f2937', color: '#9ca3af' }}>
              <th style={{ padding: '10px 8px' }}>Metric</th>
              <th>Baseline ({baseline ? `${baseline.profile} - ${baseline.scenarioName}` : 'Baseline v1.0.1'})</th>
              <th>Candidate ({candidate ? `${candidate.profile} - ${candidate.scenarioName}` : 'Candidate v1.0.2'})</th>
              <th>Delta / Verdict</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #1f2937' }}>
              <td style={{ padding: '12px 8px', fontWeight: '600' }}>Median Latency (P50)</td>
              <td>{baselineP50} ms</td>
              <td>{candidateP50} ms</td>
              <td style={{ color: p50Delta <= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                {p50Delta <= 0 ? `${p50Delta}% (Improved)` : `+${p50Delta}% (Degraded)`}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #1f2937' }}>
              <td style={{ padding: '12px 8px', fontWeight: '600' }}>Tail Latency (P95)</td>
              <td>{baselineP95} ms</td>
              <td>{candidateP95} ms</td>
              <td style={{ color: p95Delta <= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                {p95Delta <= 0 ? `${p95Delta}% (Improved)` : `+${p95Delta}% (Degraded)`}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #1f2937' }}>
              <td style={{ padding: '12px 8px', fontWeight: '600' }}>Error Rate (%)</td>
              <td>{(baselineErr * 100).toFixed(2)}%</td>
              <td>{(candidateErr * 100).toFixed(2)}%</td>
              <td style={{ color: candidateErr === 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                {candidateErr === 0 ? '0 Errors (Passed SLA)' : `${(candidateErr * 100).toFixed(2)}% Errors`}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #1f2937' }}>
              <td style={{ padding: '12px 8px', fontWeight: '600' }}>Throughput (Peak RPS)</td>
              <td>{baselineRps.toLocaleString()} rps</td>
              <td>{candidateRps.toLocaleString()} rps</td>
              <td style={{ color: rpsDelta >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                {rpsDelta >= 0 ? `+${rpsDelta}% (Higher Capacity)` : `${rpsDelta}% (Lower Throughput)`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
