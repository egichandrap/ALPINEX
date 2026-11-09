import React, { useState } from 'react';
import {
  BarChart2,
  TrendingUp,
  Activity,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Maximize2,
  Sparkles
} from 'lucide-react';

export interface ThroughputDataPoint {
  time: string;
  success: number;
  errors: number;
  total: number;
}

export interface CandlestickDataPoint {
  time: string;
  min: number;     // Low
  p50: number;     // Open
  p95: number;     // Close
  max: number;     // High
  sla: number;     // SLA Target
  isBreached: boolean;
}

const SAMPLE_THROUGHPUT: Record<'6h' | '24h' | '7d', ThroughputDataPoint[]> = {
  '6h': [
    { time: '18:00', success: 1240, errors: 12, total: 1252 },
    { time: '19:00', success: 1890, errors: 28, total: 1918 },
    { time: '20:00', success: 2450, errors: 45, total: 2495 },
    { time: '21:00', success: 3100, errors: 110, total: 3210 },
    { time: '22:00', success: 2780, errors: 34, total: 2814 },
    { time: '23:00', success: 1950, errors: 18, total: 1968 },
  ],
  '24h': [
    { time: '00:00', success: 820, errors: 5, total: 825 },
    { time: '04:00', success: 450, errors: 2, total: 452 },
    { time: '08:00', success: 1680, errors: 22, total: 1702 },
    { time: '12:00', success: 3420, errors: 68, total: 3488 },
    { time: '16:00', success: 4120, errors: 140, total: 4260 },
    { time: '20:00', success: 2980, errors: 48, total: 3028 },
  ],
  '7d': [
    { time: 'Mon', success: 18400, errors: 210, total: 18610 },
    { time: 'Tue', success: 22100, errors: 340, total: 22440 },
    { time: 'Wed', success: 26800, errors: 490, total: 27290 },
    { time: 'Thu', success: 24200, errors: 280, total: 24480 },
    { time: 'Fri', success: 29500, errors: 610, total: 30110 },
    { time: 'Sat', success: 14100, errors: 95, total: 14195 },
    { time: 'Sun', success: 11900, errors: 80, total: 11980 },
  ],
};

const SAMPLE_CANDLESTICKS: Record<'6h' | '24h' | '7d', CandlestickDataPoint[]> = {
  '6h': [
    { time: '18:00', min: 28, p50: 64, p95: 142, max: 210, sla: 200, isBreached: false },
    { time: '19:00', min: 32, p50: 78, p95: 168, max: 245, sla: 200, isBreached: false },
    { time: '20:00', min: 45, p50: 110, p95: 220, max: 340, sla: 200, isBreached: true },
    { time: '21:00', min: 38, p50: 95, p95: 190, max: 280, sla: 200, isBreached: false },
    { time: '22:00', min: 30, p50: 70, p95: 155, max: 225, sla: 200, isBreached: false },
    { time: '23:00', min: 25, p50: 58, p95: 130, max: 195, sla: 200, isBreached: false },
  ],
  '24h': [
    { time: '00:00', min: 22, p50: 48, p95: 115, max: 160, sla: 200, isBreached: false },
    { time: '04:00', min: 20, p50: 42, p95: 98, max: 140, sla: 200, isBreached: false },
    { time: '08:00', min: 35, p50: 82, p95: 175, max: 250, sla: 200, isBreached: false },
    { time: '12:00', min: 48, p50: 125, p95: 245, max: 390, sla: 200, isBreached: true },
    { time: '16:00', min: 42, p50: 105, p95: 215, max: 320, sla: 200, isBreached: true },
    { time: '20:00', min: 30, p50: 72, p95: 160, max: 230, sla: 200, isBreached: false },
  ],
  '7d': [
    { time: 'Mon', min: 25, p50: 68, p95: 152, max: 230, sla: 200, isBreached: false },
    { time: 'Tue', min: 28, p50: 74, p95: 165, max: 260, sla: 200, isBreached: false },
    { time: 'Wed', min: 34, p50: 92, p95: 205, max: 340, sla: 200, isBreached: true },
    { time: 'Thu', min: 30, p50: 80, p95: 172, max: 275, sla: 200, isBreached: false },
    { time: 'Fri', min: 40, p50: 115, p95: 235, max: 410, sla: 200, isBreached: true },
    { time: 'Sat', min: 24, p50: 55, p95: 125, max: 180, sla: 200, isBreached: false },
    { time: 'Sun', min: 22, p50: 50, p95: 110, max: 165, sla: 200, isBreached: false },
  ],
};

interface OverviewAnalyticsProps {
  projectName?: string;
}

export const OverviewAnalytics: React.FC<OverviewAnalyticsProps> = ({ projectName = 'Default Project' }) => {
  const [chartView, setChartView] = useState<'both' | 'bar' | 'candlestick'>('both');
  const [timeRange, setTimeRange] = useState<'6h' | '24h' | '7d'>('6h');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const throughput = SAMPLE_THROUGHPUT[timeRange];
  const candlesticks = SAMPLE_CANDLESTICKS[timeRange];

  // Max calculations for scaling
  const maxThroughput = Math.max(...throughput.map((d) => d.total)) * 1.15;
  const maxLatency = Math.max(...candlesticks.map((d) => d.max), 250) * 1.15;

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
              Telemetry Analytics & Performance Visualizer
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
              Real-time request distribution, latency jitter, and SLA compliance for {projectName}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Chart View Switcher */}
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
              onClick={() => setChartView('both')}
              style={{
                backgroundColor: chartView === 'both' ? '#1f2937' : 'transparent',
                color: chartView === 'both' ? '#f3f4f6' : '#9ca3af',
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
              onClick={() => setChartView('bar')}
              style={{
                backgroundColor: chartView === 'bar' ? '#1f2937' : 'transparent',
                color: chartView === 'bar' ? '#38bdf8' : '#9ca3af',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Throughput (Bars)
            </button>
            <button
              onClick={() => setChartView('candlestick')}
              style={{
                backgroundColor: chartView === 'candlestick' ? '#1f2937' : 'transparent',
                color: chartView === 'candlestick' ? '#fbbf24' : '#9ca3af',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Latency (Candlestick)
            </button>
          </div>

          {/* Time Range Filter */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#0b0f19',
              border: '1px solid #1f2937',
              borderRadius: '6px',
              padding: '2px',
            }}
          >
            {(['6h', '24h', '7d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                style={{
                  backgroundColor: timeRange === r ? '#4338ca' : 'transparent',
                  color: timeRange === r ? '#ffffff' : '#9ca3af',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Charts Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            chartView === 'both' ? 'repeat(2, 1fr)' : '1fr',
          gap: '16px',
        }}
      >
        {/* =================================================================== */}
        {/* CHART 1: DIAGRAM BATANG (Throughput & Request Volume)               */}
        {/* =================================================================== */}
        {(chartView === 'both' || chartView === 'bar') && (
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
                  Execution Throughput & Request Volume (Diagram Batang)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#10b981' }} />
                  <span style={{ color: '#9ca3af' }}>Success (2xx)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#ef4444' }} />
                  <span style={{ color: '#9ca3af' }}>Errors (4xx/5xx)</span>
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
                {throughput.map((d, idx) => {
                  const totalBars = throughput.length;
                  const availableWidth = 475;
                  const slotWidth = availableWidth / totalBars;
                  const barWidth = Math.min(32, slotWidth * 0.55);
                  const x = 45 + idx * slotWidth + (slotWidth - barWidth) / 2;

                  const totalHeight = (d.total / maxThroughput) * 140;
                  const errorHeight = (d.errors / maxThroughput) * 140;
                  const successHeight = Math.max(0, totalHeight - errorHeight);

                  const yBase = 170;
                  const ySuccess = yBase - totalHeight;
                  const yError = yBase - errorHeight;

                  const isHovered = activeTooltip === `bar-${idx}`;

                  return (
                    <g
                      key={idx}
                      onMouseEnter={() => setActiveTooltip(`bar-${idx}`)}
                      onMouseLeave={() => setActiveTooltip(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Success Bar (Lower/Main Portion) */}
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

                      {/* Error Bar (Top Portion) */}
                      {d.errors > 0 && (
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
                        fontSize="10"
                        fontWeight={isHovered ? '700' : '500'}
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {d.time}
                      </text>

                      {/* Value on top of bar */}
                      <text
                        x={x + barWidth / 2}
                        y={ySuccess - 6}
                        fill="#d1d5db"
                        fontSize="9"
                        fontWeight="600"
                        textAnchor="middle"
                        fontFamily="monospace"
                        opacity={isHovered ? 1 : 0.75}
                      >
                        {d.total >= 1000 ? `${(d.total / 1000).toFixed(1)}k` : d.total}
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
              <span>Total Volume: <strong>{throughput.reduce((a, b) => a + b.total, 0).toLocaleString()} reqs</strong></span>
              <span>Overall Success Rate: <strong style={{ color: '#10b981' }}>98.9%</strong></span>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* CHART 2: CANDLESTICK CHART (Latency Variance: Min, P50, P95, Max)   */}
        {/* =================================================================== */}
        {(chartView === 'both' || chartView === 'candlestick') && (
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
                  API Latency Dispersion (Candlestick / Box-Whisker)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '1px', backgroundColor: '#10b981', border: '1px solid #059669' }} />
                  <span style={{ color: '#9ca3af' }}>P95 ≤ SLA Target</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '1px', backgroundColor: '#ef4444', border: '1px solid #b91c1c' }} />
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

                {/* SLA Threshold Target Reference Line (Red Dashed) */}
                {(() => {
                  const slaVal = candlesticks[0]?.sla || 200;
                  const slaY = 170 - (slaVal / maxLatency) * 140;
                  return (
                    <g>
                      <line
                        x1="35"
                        y1={slaY}
                        x2="520"
                        y2={slaY}
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                        strokeDasharray="5 3"
                      />
                      <text x="515" y={slaY - 4} fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="end" fontFamily="monospace">
                        SLA Threshold: {slaVal}ms
                      </text>
                    </g>
                  );
                })()}

                {/* Candlesticks: Wicks (Min to Max) and Bodies (P50 to P95) */}
                {candlesticks.map((d, idx) => {
                  const totalSticks = candlesticks.length;
                  const availableWidth = 475;
                  const slotWidth = availableWidth / totalSticks;
                  const candleWidth = Math.min(26, slotWidth * 0.45);
                  const xCenter = 45 + idx * slotWidth + slotWidth / 2;
                  const xBody = xCenter - candleWidth / 2;

                  const yMin = 170 - (d.min / maxLatency) * 140;
                  const yP50 = 170 - (d.p50 / maxLatency) * 140;
                  const yP95 = 170 - (d.p95 / maxLatency) * 140;
                  const yMax = 170 - (d.max / maxLatency) * 140;

                  const bodyHeight = Math.max(4, yP50 - yP95);
                  const isHovered = activeTooltip === `candle-${idx}`;

                  const strokeColor = d.isBreached ? '#ef4444' : '#10b981';
                  const fillColor = d.isBreached ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)';

                  return (
                    <g
                      key={idx}
                      onMouseEnter={() => setActiveTooltip(`candle-${idx}`)}
                      onMouseLeave={() => setActiveTooltip(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* High Wick (P95 to Max) */}
                      <line
                        x1={xCenter}
                        y1={yP95}
                        x2={xCenter}
                        y2={yMax}
                        stroke={strokeColor}
                        strokeWidth={isHovered ? 2.5 : 1.5}
                      />
                      {/* Top Wick Cap */}
                      <line
                        x1={xCenter - 4}
                        y1={yMax}
                        x2={xCenter + 4}
                        y2={yMax}
                        stroke={strokeColor}
                        strokeWidth="1.5"
                      />

                      {/* Low Wick (Min to P50) */}
                      <line
                        x1={xCenter}
                        y1={yMin}
                        x2={xCenter}
                        y2={yP50}
                        stroke={strokeColor}
                        strokeWidth={isHovered ? 2.5 : 1.5}
                      />
                      {/* Bottom Wick Cap */}
                      <line
                        x1={xCenter - 4}
                        y1={yMin}
                        x2={xCenter + 4}
                        y2={yMin}
                        stroke={strokeColor}
                        strokeWidth="1.5"
                      />

                      {/* Candlestick Body (P50 to P95) */}
                      <rect
                        x={xBody}
                        y={yP95}
                        width={candleWidth}
                        height={bodyHeight}
                        rx="2"
                        fill={isHovered ? strokeColor : fillColor}
                        stroke={strokeColor}
                        strokeWidth="1.5"
                        style={{ transition: 'all 0.15s' }}
                      />

                      {/* Median Line inside Body (P50 indicator) */}
                      <line
                        x1={xBody}
                        y1={yP50}
                        x2={xBody + candleWidth}
                        y2={yP50}
                        stroke={strokeColor}
                        strokeWidth="1.5"
                        opacity={0.8}
                      />

                      {/* X-Axis Label */}
                      <text
                        x={xCenter}
                        y="188"
                        fill={isHovered ? '#f3f4f6' : '#9ca3af'}
                        fontSize="10"
                        fontWeight={isHovered ? '700' : '500'}
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {d.time}
                      </text>

                      {/* P95 Callout Text */}
                      <text
                        x={xCenter}
                        y={yMax - 6}
                        fill={d.isBreached ? '#f87171' : '#34d399'}
                        fontSize="9"
                        fontWeight="700"
                        textAnchor="middle"
                        fontFamily="monospace"
                        opacity={isHovered ? 1 : 0.8}
                      >
                        {d.p95}ms
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
              <span>Wick Range: <strong>Min ({Math.min(...candlesticks.map(c => c.min))}ms) → Max ({Math.max(...candlesticks.map(c => c.max))}ms)</strong></span>
              <span>Body: <strong>P50 (Median) to P95 SLA</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* SECTION 3: HTTP STATUS CODE RATIO & PLATFORM HEALTH STRIP           */}
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
              HTTP Status Code Distribution & Health Ratio
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
            Total Analyzed: <strong>14,820 responses</strong>
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
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
          <div style={{ width: '92.4%', backgroundColor: '#10b981' }} title="2xx Success: 92.4%" />
          <div style={{ width: '4.8%', backgroundColor: '#38bdf8' }} title="3xx Redirection: 4.8%" />
          <div style={{ width: '2.1%', backgroundColor: '#f59e0b' }} title="4xx Client Error: 2.1%" />
          <div style={{ width: '0.7%', backgroundColor: '#ef4444' }} title="5xx Server Error: 0.7%" />
        </div>

        {/* Legend Pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <div style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: '6px', padding: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#34d399', fontWeight: 'bold' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              2xx Success
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f3f4f6', marginTop: '4px' }}>92.4%</div>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>13,693 requests</div>
          </div>

          <div style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: '6px', padding: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#38bdf8', fontWeight: 'bold' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
              3xx Redirection
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f3f4f6', marginTop: '4px' }}>4.8%</div>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>711 requests</div>
          </div>

          <div style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: '6px', padding: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#fbbf24', fontWeight: 'bold' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              4xx Client Error
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f3f4f6', marginTop: '4px' }}>2.1%</div>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>311 requests</div>
          </div>

          <div style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: '6px', padding: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#f87171', fontWeight: 'bold' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              5xx Server Fault
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f3f4f6', marginTop: '4px' }}>0.7%</div>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>105 requests</div>
          </div>
        </div>
      </div>
    </div>
  );
};
