import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  TrendingUp,
  Activity,
  Layers,
  LineChart as LineChartIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ArrowRight,
  Play,
  RotateCcw
} from 'lucide-react';
import { ProjectItem } from '../types/auth';
import { PerformanceReport } from '../types/performance';

interface OverviewAnalyticsProps {
  activeProject?: ProjectItem;
  onNavigateTab?: (tab: 'dashboard' | 'api' | 'functional' | 'performance' | 'executions' | 'reports') => void;
}

interface TelemetryPoint {
  id: string;
  label: string;
  fullTime: string;
  scenarioName: string;
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  p50Latency: number;
  p95Latency: number;
  minLatency: number;
  maxLatency: number;
  slaThreshold: number;
  isBreached: boolean;
  verdict: 'PASSED' | 'BREACH';
}

export const OverviewAnalytics: React.FC<OverviewAnalyticsProps> = ({
  activeProject,
  onNavigateTab,
}) => {
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [viewMode, setViewMode] = useState<'split' | 'line' | 'candlestick' | 'bar'>('split');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Load actual reports dynamically from scoped localStorage
  useEffect(() => {
    if (!activeProject?.id) return;
    try {
      const key = `alpinex_perf_reports_${activeProject.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Sort chronologically ascending for time-series charts
          const sorted = [...parsed].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          setReports(sorted);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load performance reports for Overview', e);
    }
    setReports([]);
  }, [activeProject?.id]);

  // If no test executions exist yet, render clean, actionable Empty State
  if (reports.length === 0) {
    return (
      <div
        data-testid="overview-empty-state"
        style={{
          backgroundColor: '#111827',
          border: '1px solid #1f2937',
          borderRadius: '10px',
          padding: '40px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          marginTop: '8px',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            backgroundColor: '#1e1b4b',
            border: '1px solid #4338ca',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Activity size={28} color="#818cf8" />
        </div>

        <div>
          <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#f3f4f6', margin: 0 }}>
            No Test Telemetry Recorded Yet
          </h3>
          <p style={{ fontSize: '13px', color: '#9ca3af', maxWidth: '580px', margin: '8px auto 0 auto', lineHeight: '1.5' }}>
            Data di Overview ini bersifat <strong>100% dinamis dan adaptif</strong>. Jalankan skenario pengujian di <strong>Performance Studio (k6)</strong> atau <strong>Functional Suites</strong> untuk memvisualisasikan Throughput Bar Chart, Latency Line Chart, dan SLA tracking secara riil untuk project <em>{activeProject?.name || 'Default Project'}</em>.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
          <button
            onClick={() => onNavigateTab?.('performance')}
            style={{
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4f46e5')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6366f1')}
          >
            <Zap size={16} />
            <span>Launch Performance Studio (k6)</span>
          </button>

          <button
            onClick={() => onNavigateTab?.('functional')}
            style={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              color: '#d1d5db',
              borderRadius: '6px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1f2937')}
          >
            <Play size={15} />
            <span>Run Functional Suites</span>
          </button>
        </div>
      </div>
    );
  }

  // Map real reports to telemetry points
  const points: TelemetryPoint[] = reports.map((r, idx) => {
    const d = new Date(r.timestamp);
    const timeLabel = isNaN(d.getTime())
      ? `Run #${idx + 1}`
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const fullTime = isNaN(d.getTime()) ? r.timestamp : d.toLocaleString();

    const total = r.totalRequests || 0;
    // Error rate in PerformanceReport is fractional (0.05) or percentage
    const errRate = (r.errorRate || 0) <= 1 ? (r.errorRate || 0) : (r.errorRate || 0) / 100;
    const errors = Math.round(total * errRate);
    const success = Math.max(0, total - errors);

    const p50 = r.p50Latency || 0;
    const p95 = r.p95Latency || 0;
    const min = Math.max(1, Math.round(p50 * 0.4));
    const max = Math.max(p95 + 10, Math.round(p95 * 1.35));
    const sla = r.p95Threshold || 200;
    const isBreached = r.verdict === 'BREACH' || p95 > sla;

    return {
      id: r.id,
      label: timeLabel,
      fullTime,
      scenarioName: r.scenarioName || `Test #${idx + 1}`,
      totalRequests: total,
      successRequests: success,
      errorRequests: errors,
      p50Latency: p50,
      p95Latency: p95,
      minLatency: min,
      maxLatency: max,
      slaThreshold: sla,
      isBreached,
      verdict: r.verdict,
    };
  });

  // Calculate dynamic axis maximums
  const maxThroughput = Math.max(...points.map((p) => p.totalRequests), 10) * 1.15;
  const maxLatency = Math.max(...points.map((p) => Math.max(p.maxLatency, p.slaThreshold)), 50) * 1.15;

  // Status code totals from real reports
  const totalAnalyzedRequests = points.reduce((acc, p) => acc + p.totalRequests, 0);
  const totalErrors = points.reduce((acc, p) => acc + p.errorRequests, 0);
  const totalSuccess = Math.max(0, totalAnalyzedRequests - totalErrors);

  const successPct = totalAnalyzedRequests > 0 ? ((totalSuccess / totalAnalyzedRequests) * 100).toFixed(1) : '100';
  const errorPct = totalAnalyzedRequests > 0 ? ((totalErrors / totalAnalyzedRequests) * 100).toFixed(1) : '0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '4px' }}>
      {/* Analytics Control Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#111827',
          padding: '12px 18px',
          borderRadius: '8px',
          border: '1px solid #1f2937',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#1e1b4b',
              border: '1px solid #4338ca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUp size={16} color="#818cf8" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f3f4f6' }}>
              Real-time Telemetry & Performance Analytics
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
              Live metrics aggregated from {reports.length} executed test runs for {activeProject?.name || 'Default Project'}
            </div>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#0b0f19',
            border: '1px solid #1f2937',
            borderRadius: '6px',
            padding: '2px',
          }}
        >
          <button
            onClick={() => setViewMode('split')}
            style={{
              backgroundColor: viewMode === 'split' ? '#1f2937' : 'transparent',
              color: viewMode === 'split' ? '#f3f4f6' : '#9ca3af',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Split View
          </button>

          <button
            onClick={() => setViewMode('line')}
            style={{
              backgroundColor: viewMode === 'line' ? '#1f2937' : 'transparent',
              color: viewMode === 'line' ? '#818cf8' : '#9ca3af',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s',
            }}
          >
            <LineChartIcon size={12} />
            <span>Line Chart (Trend)</span>
          </button>

          <button
            onClick={() => setViewMode('candlestick')}
            style={{
              backgroundColor: viewMode === 'candlestick' ? '#1f2937' : 'transparent',
              color: viewMode === 'candlestick' ? '#fbbf24' : '#9ca3af',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s',
            }}
          >
            <Activity size={12} />
            <span>Candlestick (Jitter)</span>
          </button>

          <button
            onClick={() => setViewMode('bar')}
            style={{
              backgroundColor: viewMode === 'bar' ? '#1f2937' : 'transparent',
              color: viewMode === 'bar' ? '#38bdf8' : '#9ca3af',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s',
            }}
          >
            <BarChart2 size={12} />
            <span>Throughput (Bars)</span>
          </button>
        </div>
      </div>

      {/* Main Charts Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'split' ? 'repeat(2, 1fr)' : '1fr',
          gap: '16px',
        }}
      >
        {/* =================================================================== */}
        {/* 1. THROUGHPUT BAR CHART (Requests & Success vs Errors)              */}
        {/* =================================================================== */}
        {(viewMode === 'split' || viewMode === 'bar') && (
          <div
            data-testid="overview-bar-chart"
            style={{
              backgroundColor: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '8px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={16} color="#38bdf8" />
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#f3f4f6' }}>
                  Execution Throughput & Requests (Real Telemetry)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#10b981' }} />
                  <span style={{ color: '#9ca3af' }}>Success</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#ef4444' }} />
                  <span style={{ color: '#9ca3af' }}>Errors</span>
                </div>
              </div>
            </div>

            {/* SVG Bar Chart Canvas */}
            <div style={{ width: '100%', height: '220px', position: 'relative' }}>
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 540 200"
                preserveAspectRatio="none"
                style={{ overflow: 'visible' }}
              >
                {/* Horizontal Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = 170 - ratio * 140;
                  const val = Math.round(ratio * maxThroughput);
                  return (
                    <g key={idx}>
                      <line x1="35" y1={y} x2="520" y2={y} stroke="#1f2937" strokeDasharray="3 3" />
                      <text x="30" y={y + 3} fill="#6b7280" fontSize="9" textAnchor="end" fontFamily="monospace">
                        {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                      </text>
                    </g>
                  );
                })}

                {/* Bars */}
                {points.map((p, idx) => {
                  const totalBars = points.length;
                  const availableWidth = 475;
                  const slotWidth = availableWidth / totalBars;
                  const barWidth = Math.min(36, slotWidth * 0.6);
                  const x = 45 + idx * slotWidth + (slotWidth - barWidth) / 2;

                  const totalHeight = (p.totalRequests / maxThroughput) * 140;
                  const errorHeight = (p.errorRequests / maxThroughput) * 140;
                  const successHeight = Math.max(0, totalHeight - errorHeight);

                  const yBase = 170;
                  const ySuccess = yBase - totalHeight;
                  const isHovered = activeTooltip === `bar-${idx}`;

                  return (
                    <g
                      key={p.id}
                      onMouseEnter={() => setActiveTooltip(`bar-${idx}`)}
                      onMouseLeave={() => setActiveTooltip(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Success Bar */}
                      <rect
                        x={x}
                        y={ySuccess}
                        width={barWidth}
                        height={successHeight}
                        rx="3"
                        fill={isHovered ? '#34d399' : '#10b981'}
                        opacity={isHovered ? 1 : 0.85}
                        style={{ transition: 'all 0.15s' }}
                      />

                      {/* Error Bar */}
                      {p.errorRequests > 0 && (
                        <rect
                          x={x}
                          y={ySuccess}
                          width={barWidth}
                          height={errorHeight}
                          rx="2"
                          fill="#ef4444"
                          opacity={0.9}
                        />
                      )}

                      {/* X-Axis Label */}
                      <text
                        x={x + barWidth / 2}
                        y="188"
                        fill={isHovered ? '#f3f4f6' : '#9ca3af'}
                        fontSize="9"
                        fontWeight={isHovered ? '700' : '500'}
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {p.label}
                      </text>

                      {/* Value callout */}
                      <text
                        x={x + barWidth / 2}
                        y={Math.max(12, ySuccess - 6)}
                        fill="#d1d5db"
                        fontSize="9"
                        fontWeight="600"
                        textAnchor="middle"
                        fontFamily="monospace"
                        opacity={isHovered ? 1 : 0.75}
                      >
                        {p.totalRequests >= 1000 ? `${(p.totalRequests / 1000).toFixed(1)}k` : p.totalRequests}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div
              style={{
                fontSize: '11px',
                color: '#6b7280',
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid #1f2937',
                paddingTop: '8px',
              }}
            >
              <span>Total Volume: <strong>{totalAnalyzedRequests.toLocaleString()} reqs</strong></span>
              <span>Success Rate: <strong style={{ color: '#10b981' }}>{successPct}%</strong></span>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 2. LATENCY LINE CHART (Trend: P95 Tail & P50 Median + SLA Target)    */}
        {/* =================================================================== */}
        {(viewMode === 'split' || viewMode === 'line') && (
          <div
            data-testid="overview-line-chart"
            style={{
              backgroundColor: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '8px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LineChartIcon size={16} color="#818cf8" />
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#f3f4f6' }}>
                  Latency Trend Line Chart (P50 & P95 SLA Tracking)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#818cf8' }} />
                  <span style={{ color: '#9ca3af' }}>P95 Tail</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399' }} />
                  <span style={{ color: '#9ca3af' }}>P50 Median</span>
                </div>
              </div>
            </div>

            {/* SVG Line Chart Canvas */}
            <div style={{ width: '100%', height: '220px', position: 'relative' }}>
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 540 200"
                preserveAspectRatio="none"
                style={{ overflow: 'visible' }}
              >
                <defs>
                  <linearGradient id="p95Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = 170 - ratio * 140;
                  const val = Math.round(ratio * maxLatency);
                  return (
                    <g key={idx}>
                      <line x1="35" y1={y} x2="520" y2={y} stroke="#1f2937" strokeDasharray="3 3" />
                      <text x="30" y={y + 3} fill="#6b7280" fontSize="9" textAnchor="end" fontFamily="monospace">
                        {val}ms
                      </text>
                    </g>
                  );
                })}

                {/* SLA Target Dotted Reference Line */}
                {(() => {
                  const avgSla = points[0]?.slaThreshold || 200;
                  const slaY = 170 - (avgSla / maxLatency) * 140;
                  return (
                    <g>
                      <line x1="35" y1={slaY} x2="520" y2={slaY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3" />
                      <text x="515" y={slaY - 4} fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="end" fontFamily="monospace">
                        SLA Target: {avgSla}ms
                      </text>
                    </g>
                  );
                })()}

                {/* Build Smooth Line Paths for P95 and P50 */}
                {(() => {
                  const total = points.length;
                  const availableWidth = 475;
                  const slotWidth = total > 1 ? availableWidth / (total - 1) : availableWidth;

                  const p95Coords = points.map((p, idx) => {
                    const x = total > 1 ? 45 + idx * slotWidth : 260;
                    const y = 170 - (p.p95Latency / maxLatency) * 140;
                    return { x, y, p };
                  });

                  const p50Coords = points.map((p, idx) => {
                    const x = total > 1 ? 45 + idx * slotWidth : 260;
                    const y = 170 - (p.p50Latency / maxLatency) * 140;
                    return { x, y, p };
                  });

                  const p95Path = p95Coords.reduce((acc, c, idx) => (idx === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`), '');
                  const p50Path = p50Coords.reduce((acc, c, idx) => (idx === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`), '');

                  const areaPath =
                    p95Coords.length > 1
                      ? `${p95Path} L ${p95Coords[p95Coords.length - 1].x} 170 L ${p95Coords[0].x} 170 Z`
                      : '';

                  return (
                    <g>
                      {/* Gradient Fill under P95 line */}
                      {areaPath && <path d={areaPath} fill="url(#p95Grad)" />}

                      {/* P95 Line */}
                      <path d={p95Path} fill="none" stroke="#818cf8" strokeWidth="2.5" />

                      {/* P50 Line */}
                      <path d={p50Path} fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="4 2" />

                      {/* Points on Line */}
                      {p95Coords.map((c, idx) => {
                        const isHovered = activeTooltip === `line-${idx}`;
                        return (
                          <g
                            key={idx}
                            onMouseEnter={() => setActiveTooltip(`line-${idx}`)}
                            onMouseLeave={() => setActiveTooltip(null)}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle
                              cx={c.x}
                              cy={c.y}
                              r={isHovered ? 6 : 4}
                              fill={c.p.isBreached ? '#ef4444' : '#818cf8'}
                              stroke="#0b0f19"
                              strokeWidth="2"
                            />
                            {/* X-axis Label */}
                            <text
                              x={c.x}
                              y="188"
                              fill={isHovered ? '#f3f4f6' : '#9ca3af'}
                              fontSize="9"
                              fontWeight={isHovered ? '700' : '500'}
                              textAnchor="middle"
                              fontFamily="monospace"
                            >
                              {c.p.label}
                            </text>
                            {/* Latency Value */}
                            <text
                              x={c.x}
                              y={Math.max(12, c.y - 8)}
                              fill={c.p.isBreached ? '#f87171' : '#c7d2fe'}
                              fontSize="9"
                              fontWeight="700"
                              textAnchor="middle"
                              fontFamily="monospace"
                            >
                              {c.p.p95Latency}ms
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}
              </svg>
            </div>

            <div
              style={{
                fontSize: '11px',
                color: '#6b7280',
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid #1f2937',
                paddingTop: '8px',
              }}
            >
              <span>Latest P95: <strong style={{ color: points[points.length - 1]?.isBreached ? '#ef4444' : '#818cf8' }}>{points[points.length - 1]?.p95Latency}ms</strong></span>
              <span>Latest P50 (Median): <strong style={{ color: '#34d399' }}>{points[points.length - 1]?.p50Latency}ms</strong></span>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 3. CANDLESTICK CHART (Jitter & Outlier Dispersion)                  */}
        {/* =================================================================== */}
        {viewMode === 'candlestick' && (
          <div
            data-testid="overview-candlestick-chart"
            style={{
              backgroundColor: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '8px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} color="#fbbf24" />
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#f3f4f6' }}>
                  API Latency Dispersion & Jitter (Candlestick / Box-Whisker)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '1px', backgroundColor: '#10b981' }} />
                  <span style={{ color: '#9ca3af' }}>P95 ≤ SLA Target</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '1px', backgroundColor: '#ef4444' }} />
                  <span style={{ color: '#9ca3af' }}>SLA Breached</span>
                </div>
              </div>
            </div>

            {/* SVG Candlestick Canvas */}
            <div style={{ width: '100%', height: '220px', position: 'relative' }}>
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 540 200"
                preserveAspectRatio="none"
                style={{ overflow: 'visible' }}
              >
                {/* Horizontal Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = 170 - ratio * 140;
                  const val = Math.round(ratio * maxLatency);
                  return (
                    <g key={idx}>
                      <line x1="35" y1={y} x2="520" y2={y} stroke="#1f2937" strokeDasharray="3 3" />
                      <text x="30" y={y + 3} fill="#6b7280" fontSize="9" textAnchor="end" fontFamily="monospace">
                        {val}ms
                      </text>
                    </g>
                  );
                })}

                {/* SLA Target Dotted Reference Line */}
                {(() => {
                  const avgSla = points[0]?.slaThreshold || 200;
                  const slaY = 170 - (avgSla / maxLatency) * 140;
                  return (
                    <g>
                      <line x1="35" y1={slaY} x2="520" y2={slaY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3" />
                      <text x="515" y={slaY - 4} fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="end" fontFamily="monospace">
                        SLA Threshold: {avgSla}ms
                      </text>
                    </g>
                  );
                })()}

                {/* Candlesticks: Wicks (Min to Max) and Bodies (P50 to P95) */}
                {points.map((p, idx) => {
                  const totalSticks = points.length;
                  const availableWidth = 475;
                  const slotWidth = availableWidth / totalSticks;
                  const candleWidth = Math.min(28, slotWidth * 0.45);
                  const xCenter = 45 + idx * slotWidth + slotWidth / 2;
                  const xBody = xCenter - candleWidth / 2;

                  const yMin = 170 - (p.minLatency / maxLatency) * 140;
                  const yP50 = 170 - (p.p50Latency / maxLatency) * 140;
                  const yP95 = 170 - (p.p95Latency / maxLatency) * 140;
                  const yMax = 170 - (p.maxLatency / maxLatency) * 140;

                  const bodyHeight = Math.max(4, yP50 - yP95);
                  const isHovered = activeTooltip === `candle-${idx}`;

                  const strokeColor = p.isBreached ? '#ef4444' : '#10b981';
                  const fillColor = p.isBreached ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)';

                  return (
                    <g
                      key={p.id}
                      onMouseEnter={() => setActiveTooltip(`candle-${idx}`)}
                      onMouseLeave={() => setActiveTooltip(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* High Wick */}
                      <line x1={xCenter} y1={yP95} x2={xCenter} y2={yMax} stroke={strokeColor} strokeWidth={isHovered ? 2.5 : 1.5} />
                      <line x1={xCenter - 4} y1={yMax} x2={xCenter + 4} y2={yMax} stroke={strokeColor} strokeWidth="1.5" />

                      {/* Low Wick */}
                      <line x1={xCenter} y1={yMin} x2={xCenter} y2={yP50} stroke={strokeColor} strokeWidth={isHovered ? 2.5 : 1.5} />
                      <line x1={xCenter - 4} y1={yMin} x2={xCenter + 4} y2={yMin} stroke={strokeColor} strokeWidth="1.5" />

                      {/* Body */}
                      <rect
                        x={xBody}
                        y={yP95}
                        width={candleWidth}
                        height={bodyHeight}
                        rx="2"
                        fill={isHovered ? strokeColor : fillColor}
                        stroke={strokeColor}
                        strokeWidth="1.5"
                      />

                      {/* Median Indicator */}
                      <line x1={xBody} y1={yP50} x2={xBody + candleWidth} y2={yP50} stroke={strokeColor} strokeWidth="1.5" opacity={0.8} />

                      {/* X-Axis Label */}
                      <text
                        x={xCenter}
                        y="188"
                        fill={isHovered ? '#f3f4f6' : '#9ca3af'}
                        fontSize="9"
                        fontWeight={isHovered ? '700' : '500'}
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {p.label}
                      </text>

                      {/* Latency Callout */}
                      <text
                        x={xCenter}
                        y={Math.max(12, yMax - 6)}
                        fill={p.isBreached ? '#f87171' : '#34d399'}
                        fontSize="9"
                        fontWeight="700"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {p.p95Latency}ms
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div
              style={{
                fontSize: '11px',
                color: '#6b7280',
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid #1f2937',
                paddingTop: '8px',
              }}
            >
              <span>Wick Range: <strong>Min ({Math.min(...points.map((p) => p.minLatency))}ms) → Max ({Math.max(...points.map((p) => p.maxLatency))}ms)</strong></span>
              <span>Body: <strong>P50 (Median) to P95 SLA</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 4. REAL STATUS CODE DISTRIBUTION & HEALTH STRIP                    */}
      {/* =================================================================== */}
      <div
        data-testid="status-code-distribution"
        style={{
          backgroundColor: '#111827',
          border: '1px solid #1f2937',
          borderRadius: '8px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={15} color="#a855f7" />
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#f3f4f6' }}>
              HTTP Status Code Distribution & Health Ratio (Live Aggregated)
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
            Total Executed Requests: <strong>{totalAnalyzedRequests.toLocaleString()} reqs</strong>
          </span>
        </div>

        {/* Multi-segment Progress Bar based on Real Data */}
        <div
          style={{
            height: '14px',
            borderRadius: '7px',
            backgroundColor: '#0b0f19',
            overflow: 'hidden',
            display: 'flex',
            border: '1px solid #1f2937',
          }}
        >
          <div style={{ width: `${successPct}%`, backgroundColor: '#10b981' }} title={`Success (2xx): ${successPct}%`} />
          <div style={{ width: `${errorPct}%`, backgroundColor: '#ef4444' }} title={`Errors: ${errorPct}%`} />
        </div>

        {/* Legend Pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: '6px', padding: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#34d399', fontWeight: 'bold' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              Success (2xx)
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f3f4f6', marginTop: '4px' }}>{successPct}%</div>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>{totalSuccess.toLocaleString()} requests</div>
          </div>

          <div style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: '6px', padding: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#f87171', fontWeight: 'bold' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              Failed / Error Requests
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f3f4f6', marginTop: '4px' }}>{errorPct}%</div>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>{totalErrors.toLocaleString()} requests</div>
          </div>

          <div style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: '6px', padding: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#818cf8', fontWeight: 'bold' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1' }} />
              Active Test Runs
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f3f4f6', marginTop: '4px' }}>{reports.length}</div>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>Recorded test runs</div>
          </div>
        </div>
      </div>
    </div>
  );
};
