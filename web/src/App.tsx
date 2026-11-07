import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Layers,
  CheckCircle2,
  Zap,
  Activity,
  FileBarChart,
  Settings,
  Send,
  Play,
  Square,
  Server,
  ShieldCheck,
  ChevronRight,
  Folder,
  FileCode,
  Plus,
  RefreshCw
} from 'lucide-react';

interface MetricPoint {
  time: string;
  vus: number;
  rps: number;
  p95: number;
  errorRate: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'api' | 'functional' | 'performance' | 'executions' | 'reports'>('api');
  
  // API Builder State
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('http://localhost:8080/health');
  const [requestBody, setRequestBody] = useState('{\n  "name": "Test Payload"\n}');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [env, setEnv] = useState('Development');

  // Performance Test State
  const [perfTestType, setPerfTestType] = useState('LOAD');
  const [targetVUs, setTargetVUs] = useState(50);
  const [duration, setDuration] = useState('1m');
  const [p95Threshold, setP95Threshold] = useState('500');
  const [isRunningPerf, setIsRunningPerf] = useState(false);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);

  // Send Single API Request
  const handleSendRequest = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method !== 'GET' && method !== 'HEAD' ? requestBody : undefined,
      });
      const data = await res.json().catch(() => res.text());
      const durationMs = Math.round(performance.now() - start);

      setResponse({
        status: res.status,
        statusText: res.statusText,
        time: durationMs,
        size: JSON.stringify(data).length,
        body: data,
        headers: Object.fromEntries(res.headers.entries()),
      });
    } catch (err: any) {
      setResponse({
        status: 500,
        statusText: 'Network / CORS Error',
        time: Math.round(performance.now() - start),
        body: { error: err.message || 'Failed to fetch target' },
      });
    } finally {
      setLoading(false);
    }
  };

  // Simulated Live k6 Test Run
  useEffect(() => {
    let interval: any;
    if (isRunningPerf) {
      interval = setInterval(() => {
        setMetrics((prev) => {
          const now = new Date().toLocaleTimeString();
          const baseLatency = 45 + Math.random() * 20;
          const newPoint: MetricPoint = {
            time: now,
            vus: targetVUs,
            rps: Math.round(targetVUs * (8 + Math.random() * 3)),
            p95: Math.round(baseLatency + (Math.random() > 0.9 ? 120 : 15)),
            errorRate: Math.random() > 0.95 ? 0.005 : 0.0,
          };
          return [...prev.slice(-15), newPoint];
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunningPerf, targetVUs]);

  const latestMetric = metrics[metrics.length - 1] || {
    vus: 0,
    rps: 0,
    p95: 0,
    errorRate: 0,
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#0b0f19', color: '#f3f4f6' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', backgroundColor: '#111827', borderRight: '1px solid #1f2937', display: 'flex', flexDirection: 'column' }}>
        {/* Brand Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
            ▲
          </div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '0.5px' }}>ALPINEX</h1>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>v1.0.1 • Community</span>
          </div>
        </div>

        {/* Project Context */}
        <div style={{ padding: '12px 16px', backgroundColor: '#161e2e', margin: '12px', borderRadius: '6px', border: '1px solid #1f2937' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 'bold' }}>Active Project</div>
          <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '2px', color: '#e5e7eb' }}>E-Commerce Storefront</div>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <NavItem icon={<LayoutDashboard size={18} />} label="Overview" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Layers size={18} />} label="API Collections" active={activeTab === 'api'} onClick={() => setActiveTab('api')} />
          <NavItem icon={<CheckCircle2 size={18} />} label="Functional Suites" active={activeTab === 'functional'} onClick={() => setActiveTab('functional')} />
          <NavItem icon={<Zap size={18} />} label="Performance (k6)" active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} />
          <NavItem icon={<Activity size={18} />} label="Execution Center" active={activeTab === 'executions'} onClick={() => setActiveTab('executions')} />
          <NavItem icon={<FileBarChart size={18} />} label="Reports & Compare" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
        </nav>

        {/* System Status Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid #1f2937', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#9ca3af' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span>Core API & k6 Online</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Navbar */}
        <header style={{ height: '60px', backgroundColor: '#111827', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', color: '#9ca3af' }}>Workspace: <strong style={{ color: '#f3f4f6' }}>Default Workspace</strong></span>
            <span style={{ color: '#374151' }}>/</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>Environment:</span>
              <select
                value={env}
                onChange={(e) => setEnv(e.target.value)}
                style={{ backgroundColor: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}
              >
                <option>Development</option>
                <option>Staging</option>
                <option>Production (Locked)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '4px 10px', backgroundColor: '#1e293b', borderRadius: '12px', color: '#38bdf8' }}>
              <ShieldCheck size={14} />
              <span>SSRF Protected</span>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
              PA
            </div>
          </div>
        </header>

        {/* Dynamic Views */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {activeTab === 'api' && (
            <div style={{ display: 'flex', height: '100%', gap: '20px' }}>
              {/* Collection Tree Pane */}
              <div style={{ width: '240px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1f2937', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af' }}>COLLECTIONS</span>
                  <Plus size={16} style={{ cursor: 'pointer', color: '#9ca3af' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#f3f4f6', fontWeight: '500' }}>
                    <Folder size={16} color="#6366f1" /> Storefront API
                  </div>
                  <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', padding: '4px 6px', backgroundColor: '#1e293b', borderRadius: '4px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '10px' }}>GET</span> Healthcheck
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#3b82f6', padding: '4px 6px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '10px' }}>POST</span> Auth Login
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', padding: '4px 6px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '10px' }}>GET</span> Products
                    </div>
                  </div>
                </div>
              </div>

              {/* Request Builder & Response Pane */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* URL Bar */}
                <div style={{ display: 'flex', gap: '8px', backgroundColor: '#111827', padding: '12px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    style={{ backgroundColor: '#1f2937', color: method === 'GET' ? '#10b981' : method === 'POST' ? '#3b82f6' : '#ef4444', fontWeight: 'bold', border: '1px solid #374151', borderRadius: '4px', padding: '0 12px' }}
                  >
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>DELETE</option>
                    <option>PATCH</option>
                  </select>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://api.example.com/v1/resource or {{base_url}}/health"
                    style={{ flex: 1, backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '4px', padding: '8px 12px', color: '#f3f4f6', fontSize: '14px' }}
                  />
                  <button
                    onClick={handleSendRequest}
                    disabled={loading}
                    style={{ backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    {loading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                    Send
                  </button>
                </div>

                {/* Request Body Editor */}
                {method !== 'GET' && method !== 'HEAD' && (
                  <div style={{ backgroundColor: '#111827', padding: '16px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', marginBottom: '8px' }}>REQUEST BODY (JSON)</div>
                    <textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      rows={5}
                      style={{ width: '100%', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '4px', padding: '10px', color: '#a5f3fc', fontFamily: 'monospace', fontSize: '13px' }}
                    />
                  </div>
                )}

                {/* Response Viewer */}
                <div style={{ flex: 1, backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1f2937', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #1f2937', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#9ca3af' }}>RESPONSE</span>
                    {response && (
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                        <span>Status: <strong style={{ color: response.status >= 200 && response.status < 300 ? '#10b981' : '#ef4444' }}>{response.status} {response.statusText}</strong></span>
                        <span>Time: <strong style={{ color: '#38bdf8' }}>{response.time} ms</strong></span>
                        <span>Size: <strong style={{ color: '#9ca3af' }}>{response.size} B</strong></span>
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, backgroundColor: '#0b0f19', borderRadius: '4px', border: '1px solid #1f2937', padding: '12px', overflow: 'auto', fontFamily: 'monospace', fontSize: '13px' }}>
                    {response ? (
                      <pre style={{ color: '#a5f3fc' }}>{JSON.stringify(response.body, null, 2)}</pre>
                    ) : (
                      <div style={{ color: '#6b7280', textAlign: 'center', marginTop: '40px' }}>Hit "Send" to execute request and inspect telemetry.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Performance Test Designer (k6 Engine)</h2>
                <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
                  Configure workloads, VUs, and SLA thresholds without writing manual scripts.
                </p>
              </div>

              {/* Workload Profile Card */}
              <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#e5e7eb', marginBottom: '16px' }}>1. Workload Model</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  {['SMOKE', 'LOAD', 'STRESS', 'SPIKE'].map((type) => (
                    <div
                      key={type}
                      onClick={() => setPerfTestType(type)}
                      style={{
                        padding: '12px',
                        borderRadius: '6px',
                        border: perfTestType === type ? '2px solid #6366f1' : '1px solid #374151',
                        backgroundColor: perfTestType === type ? '#1e1b4b' : '#0b0f19',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{type} TEST</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                        {type === 'SMOKE' ? '1-5 VUs verification' : type === 'LOAD' ? 'Expected baseline' : type === 'STRESS' ? 'Capacity threshold' : 'Sudden traffic burst'}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Virtual Users (VUs):</label>
                    <input
                      type="number"
                      value={targetVUs}
                      onChange={(e) => setTargetVUs(Number(e.target.value))}
                      style={{ width: '100%', backgroundColor: '#0b0f19', border: '1px solid #374151', padding: '8px', borderRadius: '4px', color: '#f3f4f6' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>Test Duration:</label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 5m, 30s"
                      style={{ width: '100%', backgroundColor: '#0b0f19', border: '1px solid #374151', padding: '8px', borderRadius: '4px', color: '#f3f4f6' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>P95 Latency SLA (ms):</label>
                    <input
                      type="number"
                      value={p95Threshold}
                      onChange={(e) => setP95Threshold(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#0b0f19', border: '1px solid #374151', padding: '8px', borderRadius: '4px', color: '#f3f4f6' }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setIsRunningPerf(!isRunningPerf)}
                  style={{
                    backgroundColor: isRunningPerf ? '#ef4444' : '#10b981',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {isRunningPerf ? <Square size={16} /> : <Play size={16} />}
                  {isRunningPerf ? 'Emergency Stop Test' : 'Run Performance Test (k6)'}
                </button>
              </div>

              {/* Real-time Telemetry Dashboard */}
              {isRunningPerf && (
                <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulse 1s infinite' }} />
                      <span style={{ fontWeight: 'bold', fontSize: '14px' }}>LIVE METRICS STREAM (1s Rollup)</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>Engine: <strong>Grafana k6 v2.3.0</strong></span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                    <MetricCard title="ACTIVE VIRTUAL USERS" value={latestMetric.vus} unit="VUs" color="#6366f1" />
                    <MetricCard title="THROUGHPUT (RPS)" value={latestMetric.rps} unit="req/sec" color="#38bdf8" />
                    <MetricCard title="P95 LATENCY" value={latestMetric.p95} unit="ms" color={latestMetric.p95 > Number(p95Threshold) ? '#ef4444' : '#10b981'} />
                    <MetricCard title="ERROR RATE" value={`${(latestMetric.errorRate * 100).toFixed(2)}%`} unit="errors" color="#f59e0b" />
                  </div>

                  <div style={{ backgroundColor: '#0b0f19', padding: '12px', borderRadius: '4px', border: '1px solid #1f2937', fontFamily: 'monospace', fontSize: '12px', height: '140px', overflowY: 'auto' }}>
                    {metrics.map((m, idx) => (
                      <div key={idx} style={{ color: '#9ca3af', marginBottom: '2px' }}>
                        [{m.time}] k6: VUs={m.vus} RPS={m.rps} p(95)={m.p95}ms ErrorRate={m.errorRate} | Target SLA {p95Threshold}ms ({m.p95 <= Number(p95Threshold) ? 'PASS' : 'BREACH'})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Platform Overview</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <MetricCard title="TOTAL TEST RUNS" value="128" unit="Completed" color="#6366f1" />
                <MetricCard title="SLA PASS RATE" value="98.4%" unit="Last 30 Days" color="#10b981" />
                <MetricCard title="ACTIVE WORKERS" value="3 Nodes" unit="Healthy" color="#38bdf8" />
              </div>
            </div>
          )}

          {activeTab === 'executions' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Execution History & Queue</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1f2937', color: '#9ca3af' }}>
                    <th style={{ padding: '10px' }}>Execution ID</th>
                    <th>Type</th>
                    <th>Engine</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: '#6366f1' }}>exec-8a3f91</td>
                    <td>PERFORMANCE</td>
                    <td>k6</td>
                    <td><span style={{ backgroundColor: '#064e3b', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>COMPLETED</span></td>
                    <td>1m 00s</td>
                    <td><span style={{ color: '#10b981', fontWeight: 'bold' }}>PASSED</span></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: '#6366f1' }}>exec-102bc4</td>
                    <td>FUNCTIONAL</td>
                    <td>NATIVE_HTTP</td>
                    <td><span style={{ backgroundColor: '#064e3b', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>COMPLETED</span></td>
                    <td>240 ms</td>
                    <td><span style={{ color: '#10b981', fontWeight: 'bold' }}>PASSED</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        backgroundColor: active ? '#1f2937' : 'transparent',
        color: active ? '#f3f4f6' : '#9ca3af',
        borderLeft: active ? '3px solid #6366f1' : '3px solid transparent',
      }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

function MetricCard({ title, value, unit, color }: { title: string; value: any; unit: string; color: string }) {
  return (
    <div style={{ backgroundColor: '#0b0f19', border: '1px solid #1f2937', borderRadius: '6px', padding: '16px' }}>
      <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold', letterSpacing: '0.5px' }}>{title}</div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: color, marginTop: '6px' }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{unit}</div>
    </div>
  );
}
