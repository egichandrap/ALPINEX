import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowRight,
  RefreshCw,
  Terminal,
  FileCheck
} from 'lucide-react';
import { TestSuiteItem, TestCaseItem, Assertion } from '../types/functional';

interface FunctionalSuitesViewProps {
  authToken: string | null;
  activeProjectName?: string;
}

const DEFAULT_SUITES: TestSuiteItem[] = [
  {
    id: 'suite-e2e-checkout',
    projectId: 'proj-sample',
    name: 'E-Commerce End-to-End Checkout Flow',
    description: 'Sequentially tests login, catalog lookup, cart item addition, and order placement with chained token',
    stopOnFailure: true,
    createdAt: new Date().toISOString(),
    cases: [
      {
        id: 'step-1',
        name: 'Step 1: Admin Authentication',
        method: 'POST',
        url: 'http://localhost:8080/api/v1/auth/login',
        body: '{\n  "email": "admin",\n  "password": "admin"\n}',
        position: 1,
        assertions: [
          { id: 'a1', source: 'STATUS', operator: 'EQUALS', targetValue: '200' },
          { id: 'a2', source: 'RESPONSE_TIME', operator: 'LESS_THAN', targetValue: '500' },
          { id: 'a3', source: 'JSON_PATH', operator: 'EXISTS', targetValue: 'true', propertyPath: '$.token' },
        ],
        extractions: [
          { variableName: 'auth_token', source: 'JSON_PATH', propertyPath: '$.token' },
        ],
      },
      {
        id: 'step-2',
        name: 'Step 2: Fetch Workspace Projects',
        method: 'GET',
        url: 'http://localhost:8080/api/v1/workspaces/ws-default/projects',
        position: 2,
        assertions: [
          { id: 'a4', source: 'STATUS', operator: 'EQUALS', targetValue: '200' },
          { id: 'a5', source: 'JSON_PATH', operator: 'EQUALS', targetValue: 'true', propertyPath: '$.success' },
        ],
        extractions: [],
      },
      {
        id: 'step-3',
        name: 'Step 3: Service Health & Telemetry Check',
        method: 'GET',
        url: 'http://localhost:8080/health',
        position: 3,
        assertions: [
          { id: 'a6', source: 'STATUS', operator: 'EQUALS', targetValue: '200' },
          { id: 'a7', source: 'RESPONSE_TIME', operator: 'LESS_THAN', targetValue: '200' },
        ],
        extractions: [],
      },
    ],
  },
  {
    id: 'suite-auth-lifecycle',
    projectId: 'proj-sample',
    name: 'Security & Auth Boundary Validation',
    description: 'Verifies unauthorized rejections, token expiration, and permission gates',
    stopOnFailure: false,
    createdAt: new Date().toISOString(),
    cases: [
      {
        id: 'step-auth-1',
        name: 'Step 1: Rejected Unauthorized Request',
        method: 'GET',
        url: 'http://localhost:8080/api/v1/workspaces/ws-default/projects',
        position: 1,
        assertions: [
          { id: 'a-sec-1', source: 'STATUS', operator: 'EQUALS', targetValue: '401' },
        ],
        extractions: [],
      },
      {
        id: 'step-auth-2',
        name: 'Step 2: Valid Login & Token Issuance',
        method: 'POST',
        url: 'http://localhost:8080/api/v1/auth/login',
        body: '{\n  "email": "admin",\n  "password": "admin"\n}',
        position: 2,
        assertions: [
          { id: 'a-sec-2', source: 'STATUS', operator: 'EQUALS', targetValue: '200' },
        ],
        extractions: [
          { variableName: 'session_token', source: 'JSON_PATH', propertyPath: '$.token' },
        ],
      },
    ],
  },
];

export const FunctionalSuitesView: React.FC<FunctionalSuitesViewProps> = ({ authToken, activeProjectName }) => {
  const [suites, setSuites] = useState<TestSuiteItem[]>(() => {
    try {
      const saved = localStorage.getItem('alpinex_functional_suites');
      return saved ? JSON.parse(saved) : DEFAULT_SUITES;
    } catch {
      return DEFAULT_SUITES;
    }
  });

  const [selectedSuiteId, setSelectedSuiteId] = useState<string>(suites[0]?.id || '');
  const [isRunning, setIsRunning] = useState(false);
  const [stepResults, setStepResults] = useState<Record<string, { status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED'; latency?: number; details?: string }>>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [isNewSuiteModalOpen, setIsNewSuiteModalOpen] = useState(false);
  const [newSuiteName, setNewSuiteName] = useState('');
  const [newSuiteDesc, setNewSuiteDesc] = useState('');

  const activeSuite = suites.find((s) => s.id === selectedSuiteId) || suites[0];

  const handleRunSuite = async () => {
    if (!activeSuite || isRunning) return;
    setIsRunning(true);
    setLogs([]);
    const results: Record<string, { status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED'; latency?: number; details?: string }> = {};

    activeSuite.cases.forEach((c) => {
      results[c.id] = { status: 'PENDING' };
    });
    setStepResults({ ...results });

    const addLog = (msg: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
    };

    addLog(`Initiating Functional Suite: "${activeSuite.name}" (Engine: NATIVE_HTTP)`);
    addLog(`Chaining enabled: ${activeSuite.cases.length} sequential test steps queued`);

    const extractedContext: Record<string, any> = {};
    let suiteFailed = false;

    for (let i = 0; i < activeSuite.cases.length; i++) {
      const step = activeSuite.cases[i];
      addLog(`▶ [Step ${i + 1}/${activeSuite.cases.length}] Executing "${step.name}" (${step.method} ${step.url})`);

      setStepResults((prev) => ({
        ...prev,
        [step.id]: { status: 'RUNNING' },
      }));

      const startTime = performance.now();
      try {
        let reqUrl = step.url;
        // Resolve variables like {{auth_token}}
        Object.entries(extractedContext).forEach(([k, v]) => {
          reqUrl = reqUrl.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
        });

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (extractedContext['auth_token']) {
          headers['Authorization'] = `Bearer ${extractedContext['auth_token']}`;
        } else if (authToken && step.id !== 'step-auth-1') {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const res = await fetch(reqUrl, {
          method: step.method,
          headers,
          body: step.body ? step.body : undefined,
        });

        const latency = Math.round(performance.now() - startTime);
        const data = await res.json().catch(() => null);

        // Evaluate Assertions
        let stepPassed = true;
        const failedReasons: string[] = [];

        for (const assertion of step.assertions) {
          if (assertion.source === 'STATUS') {
            const expected = parseInt(assertion.targetValue, 10);
            if (assertion.operator === 'EQUALS' && res.status !== expected) {
              stepPassed = false;
              failedReasons.push(`Expected HTTP status ${expected}, got ${res.status}`);
            }
          } else if (assertion.source === 'RESPONSE_TIME') {
            const maxMs = parseInt(assertion.targetValue, 10);
            if (assertion.operator === 'LESS_THAN' && latency >= maxMs) {
              stepPassed = false;
              failedReasons.push(`Response time ${latency}ms exceeded threshold ${maxMs}ms`);
            }
          } else if (assertion.source === 'JSON_PATH' && data) {
            if (assertion.propertyPath === '$.token' || assertion.propertyPath === 'token') {
              if (!data.token) {
                stepPassed = false;
                failedReasons.push('Token not found in payload');
              }
            } else if (assertion.propertyPath === '$.success') {
              if (String(data.success) !== assertion.targetValue) {
                stepPassed = false;
                failedReasons.push(`Expected $.success == ${assertion.targetValue}`);
              }
            }
          }
        }

        // Perform Extractions
        if (data && step.extractions) {
          for (const ext of step.extractions) {
            if (ext.propertyPath === '$.token' && data.token) {
              extractedContext[ext.variableName] = data.token;
              addLog(`  ↳ Extracted variable: \${${ext.variableName}} = "${data.token.substring(0, 15)}..."`);
            }
          }
        }

        if (stepPassed) {
          addLog(`✔ [Step ${i + 1}] PASSED (${latency}ms) — All ${step.assertions.length} assertions verified`);
          setStepResults((prev) => ({
            ...prev,
            [step.id]: { status: 'PASSED', latency, details: `Passed in ${latency}ms` },
          }));
        } else {
          addLog(`✖ [Step ${i + 1}] FAILED (${latency}ms): ${failedReasons.join(', ')}`);
          setStepResults((prev) => ({
            ...prev,
            [step.id]: { status: 'FAILED', latency, details: failedReasons.join(', ') },
          }));
          suiteFailed = true;

          if (activeSuite.stopOnFailure) {
            addLog(`⛔ Suite execution aborted due to StopOnFailure policy.`);
            break;
          }
        }
      } catch (err: any) {
        const latency = Math.round(performance.now() - startTime);
        addLog(`✖ [Step ${i + 1}] NETWORK ERROR (${latency}ms): ${err.message}`);
        setStepResults((prev) => ({
          ...prev,
          [step.id]: { status: 'FAILED', latency, details: err.message },
        }));
        suiteFailed = true;
        if (activeSuite.stopOnFailure) break;
      }

      // Small pause between steps for realistic live feedback
      await new Promise((r) => setTimeout(r, 400));
    }

    addLog(`───────────────────────────────────────────────────────`);
    addLog(`Verdict: ${suiteFailed ? '❌ SUITE FAILED' : '✅ ALL SUITE ASSERTIONS PASSED'}`);
    setIsRunning(false);
  };

  const handleCreateSuite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuiteName.trim()) return;

    const newSuite: TestSuiteItem = {
      id: `suite-${Math.random().toString(36).substring(2, 9)}`,
      projectId: 'proj-sample',
      name: newSuiteName.trim(),
      description: newSuiteDesc.trim() || 'Custom functional test suite',
      stopOnFailure: true,
      cases: [
        {
          id: `step-${Date.now()}-1`,
          name: 'Health Probe Step',
          method: 'GET',
          url: 'http://localhost:8080/health',
          position: 1,
          assertions: [{ id: 'a-new', source: 'STATUS', operator: 'EQUALS', targetValue: '200' }],
          extractions: [],
        },
      ],
      createdAt: new Date().toISOString(),
    };

    const updated = [newSuite, ...suites];
    setSuites(updated);
    setSelectedSuiteId(newSuite.id);
    localStorage.setItem('alpinex_functional_suites', JSON.stringify(updated));
    setIsNewSuiteModalOpen(false);
    setNewSuiteName('');
    setNewSuiteDesc('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck size={22} color="#10b981" />
            Functional Suites (Chained API Automation)
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
            Orchestrate multi-step API workflows, variable extractions, and assertions with native test runners.
          </p>
        </div>
        <button
          onClick={() => setIsNewSuiteModalOpen(true)}
          style={{
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Plus size={16} /> New Test Suite
        </button>
      </div>

      {/* Main Workspace Split */}
      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
        {/* Left: Suites List */}
        <div style={{ width: '300px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1f2937', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', marginBottom: '12px', letterSpacing: '0.5px' }}>
            AVAILABLE SUITES ({suites.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
            {suites.map((s) => {
              const isSelected = s.id === selectedSuiteId;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedSuiteId(s.id);
                    setStepResults({});
                    setLogs([]);
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    border: isSelected ? '1px solid #6366f1' : '1px solid #1f2937',
                    backgroundColor: isSelected ? '#1e1b4b' : '#0b0f19',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: '600', color: isSelected ? '#f3f4f6' : '#d1d5db' }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', lineHeight: '1.4' }}>
                    {s.description}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '11px', color: '#6b7280' }}>
                    <span style={{ backgroundColor: '#1f2937', padding: '1px 6px', borderRadius: '4px', color: '#9ca3af' }}>
                      {s.cases.length} Steps
                    </span>
                    {s.stopOnFailure && <span style={{ color: '#f59e0b' }}>Stop On Fail</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Suite Pipeline & Live Runner */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {activeSuite ? (
            <>
              {/* Suite Control Bar */}
              <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '8px', border: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6', margin: 0 }}>
                    {activeSuite.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                    {activeSuite.description}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={handleRunSuite}
                    disabled={isRunning}
                    style={{
                      backgroundColor: isRunning ? '#374151' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 20px',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: isRunning ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    {isRunning ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                    {isRunning ? 'Executing Suite...' : 'Run Suite'}
                  </button>
                </div>
              </div>

              {/* Chained Pipeline Steps */}
              <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '8px', border: '1px solid #1f2937', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', letterSpacing: '0.5px' }}>
                  EXECUTION PIPELINE (SEQUENTIAL)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeSuite.cases.map((step, idx) => {
                    const res = stepResults[step.id];
                    const status = res?.status || 'PENDING';

                    return (
                      <div
                        key={step.id}
                        style={{
                          backgroundColor: '#0b0f19',
                          border: status === 'RUNNING' ? '1px solid #6366f1' : status === 'PASSED' ? '1px solid #059669' : status === 'FAILED' ? '1px solid #dc2626' : '1px solid #1f2937',
                          borderRadius: '8px',
                          padding: '14px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'border 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: status === 'PASSED' ? '#064e3b' : status === 'FAILED' ? '#7f1d1d' : status === 'RUNNING' ? '#1e1b4b' : '#1f2937',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              color: status === 'PASSED' ? '#34d399' : status === 'FAILED' ? '#fca5a5' : status === 'RUNNING' ? '#a5f3fc' : '#9ca3af',
                            }}
                          >
                            {status === 'PASSED' ? <CheckCircle2 size={16} /> : status === 'FAILED' ? <XCircle size={16} /> : status === 'RUNNING' ? <RefreshCw size={14} className="animate-spin" /> : idx + 1}
                          </div>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  padding: '2px 5px',
                                  borderRadius: '3px',
                                  backgroundColor: step.method === 'GET' ? '#064e3b' : '#1e3a8a',
                                  color: step.method === 'GET' ? '#34d399' : '#60a5fa',
                                }}
                              >
                                {step.method}
                              </span>
                              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#f3f4f6' }}>
                                {step.name}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace', marginTop: '3px' }}>
                              {step.url}
                            </div>
                          </div>
                        </div>

                        {/* Assertions & Extractions Chips */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {step.assertions.map((a, aidx) => (
                              <span
                                key={aidx}
                                title={`${a.source} ${a.operator} ${a.targetValue}`}
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: '#1f2937',
                                  color: '#9ca3af',
                                  border: '1px solid #374151',
                                }}
                              >
                                {a.source} {a.operator === 'EQUALS' ? '=' : '<'} {a.targetValue}
                              </span>
                            ))}
                            {step.extractions.map((e, eidx) => (
                              <span
                                key={eidx}
                                title={`Extracts into \${${e.variableName}}`}
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: '#3b0764',
                                  color: '#c084fc',
                                  border: '1px solid #581c87',
                                }}
                              >
                                ↳ ${`{${e.variableName}}`}
                              </span>
                            ))}
                          </div>

                          {/* Verdict / Latency Badge */}
                          <div style={{ minWidth: '80px', textAlign: 'right' }}>
                            {status === 'PASSED' && (
                              <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '12px' }}>
                                PASSED <span style={{ fontSize: '10px', color: '#6b7280' }}>({res?.latency}ms)</span>
                              </span>
                            )}
                            {status === 'FAILED' && (
                              <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '12px' }}>
                                FAILED
                              </span>
                            )}
                            {status === 'RUNNING' && (
                              <span style={{ color: '#38bdf8', fontWeight: '600', fontSize: '12px' }}>
                                Testing...
                              </span>
                            )}
                            {status === 'PENDING' && (
                              <span style={{ color: '#6b7280', fontSize: '12px' }}>
                                Standby
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Execution Console Logs */}
              <div style={{ backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1f2937', padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: '180px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#9ca3af', fontSize: '12px', fontWeight: 'bold' }}>
                  <Terminal size={14} /> LIVE EXECUTION LOGS
                </div>
                <div
                  style={{
                    backgroundColor: '#0b0f19',
                    borderRadius: '6px',
                    padding: '12px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#a5f3fc',
                    flex: 1,
                    overflowY: 'auto',
                    lineHeight: '1.6',
                  }}
                >
                  {logs.length === 0 ? (
                    <div style={{ color: '#6b7280' }}>
                      Ready to execute. Click <strong>"Run Suite"</strong> above to launch the automated sequential test pipeline.
                    </div>
                  ) : (
                    logs.map((log, index) => <div key={index}>{log}</div>)
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              No test suites configured. Click "New Test Suite" to create one.
            </div>
          )}
        </div>
      </div>

      {/* New Suite Modal */}
      {isNewSuiteModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setIsNewSuiteModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '8px',
              width: '450px',
              padding: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Create New Functional Suite</h3>
            <form onSubmit={handleCreateSuite} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Suite Name</label>
                <input
                  type="text"
                  value={newSuiteName}
                  onChange={(e) => setNewSuiteName(e.target.value)}
                  placeholder="e.g. Order Lifecycle Integration"
                  required
                  style={{ width: '100%', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '4px', padding: '8px', color: '#f3f4f6' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Description</label>
                <textarea
                  value={newSuiteDesc}
                  onChange={(e) => setNewSuiteDesc(e.target.value)}
                  placeholder="Explain the user scenario or test boundary"
                  rows={3}
                  style={{ width: '100%', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '4px', padding: '8px', color: '#f3f4f6' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsNewSuiteModalOpen(false)}
                  style={{ backgroundColor: '#1f2937', color: '#9ca3af', border: 'none', padding: '8px 14px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#6366f1', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Create Suite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
