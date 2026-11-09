import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  ChevronRight,
  Folder,
  RefreshCw,
  Terminal,
  FileCheck,
  ArrowUp,
  ArrowDown,
  Layers,
  Sliders,
  Sparkles,
  Link2,
  AlertCircle,
  Edit3
} from 'lucide-react';
import { TestSuiteItem, TestCaseItem, Assertion, VariableExtraction, AssertionSource, AssertionOperator } from '../types/functional';
import { CollectionItem, RequestItem, HTTPMethod } from '../types/collection';
import { ProjectItem } from '../types/auth';

interface FunctionalSuitesViewProps {
  authToken: string | null;
  activeProject: ProjectItem;
  collections: CollectionItem[];
}

// Safely extract nested properties via JSONPath / dot notation / array indexing (e.g. "$.data.token", "items[0].id")
export const getNestedValue = (obj: any, path: string): any => {
  if (!obj || !path) return undefined;
  const cleaned = path.replace(/^\$\.?/, '').trim();
  if (!cleaned) return obj;

  const parts = cleaned.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);

  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
};

export const FunctionalSuitesView: React.FC<FunctionalSuitesViewProps> = ({
  authToken,
  activeProject,
  collections = [],
}) => {
  const getSuitesKey = (projId: string) => `alpinex_functional_suites_${projId}`;

  const loadSuitesForProject = (projId: string): TestSuiteItem[] => {
    try {
      const specific = localStorage.getItem(getSuitesKey(projId));
      if (specific) return JSON.parse(specific);
    } catch (e) {
      console.error('Failed to load suites for project', projId, e);
    }
    return [];
  };

  const [suites, setSuites] = useState<TestSuiteItem[]>(() => loadSuitesForProject(activeProject?.id || 'proj-default'));

  // Reload suites whenever activeProject.id changes
  useEffect(() => {
    if (!activeProject?.id) return;
    const projSuites = loadSuitesForProject(activeProject.id);
    setSuites(projSuites);
    setSelectedSuiteId(projSuites[0]?.id || '');
    setStepResults({});
    setLogs([]);
  }, [activeProject?.id]);

  // Persist suites whenever suites change
  useEffect(() => {
    if (!activeProject?.id) return;
    try {
      localStorage.setItem(getSuitesKey(activeProject.id), JSON.stringify(suites));
    } catch (e) {
      console.error('Failed to save functional suites to localStorage', e);
    }
  }, [suites, activeProject?.id]);

  const [selectedSuiteId, setSelectedSuiteId] = useState<string>(suites[0]?.id || '');
  const [isRunning, setIsRunning] = useState(false);
  const [stepResults, setStepResults] = useState<Record<string, { status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED'; latency?: number; details?: string }>>({});
  const [logs, setLogs] = useState<string[]>([]);
  const logsBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Modal: New Test Suite
  const [isNewSuiteModalOpen, setIsNewSuiteModalOpen] = useState(false);
  const [newSuiteName, setNewSuiteName] = useState('');
  const [newSuiteDesc, setNewSuiteDesc] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [autoImportEndpoints, setAutoImportEndpoints] = useState(true);
  const [stopOnFailure, setStopOnFailure] = useState(true);

  // Modal: Add Endpoint/Step to Pipeline
  const [isAddStepModalOpen, setIsAddStepModalOpen] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [stepSourceMode, setStepSourceMode] = useState<'COLLECTION' | 'CUSTOM'>('COLLECTION');
  const [chosenColId, setChosenColId] = useState<string>('');
  const [chosenReqId, setChosenReqId] = useState<string>('');
  const [stepName, setStepName] = useState('');
  const [stepMethod, setStepMethod] = useState<HTTPMethod>('GET');
  const [stepUrl, setStepUrl] = useState('');
  const [stepBody, setStepBody] = useState('');
  const [stepAssertions, setStepAssertions] = useState<Assertion[]>([
    { id: 'a-def-1', source: 'STATUS', operator: 'EQUALS', targetValue: '200' },
    { id: 'a-def-2', source: 'RESPONSE_TIME', operator: 'LESS_THAN', targetValue: '500' },
  ]);
  const [stepExtractions, setStepExtractions] = useState<VariableExtraction[]>([]);

  // Sync suites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('alpinex_functional_suites', JSON.stringify(suites));
    } catch (e) {
      console.error('Failed to save functional suites to localStorage', e);
    }
  }, [suites]);

  const activeSuite = suites.find((s) => s.id === selectedSuiteId) || suites[0];

  // Open Add Step Modal
  const handleOpenAddStepModal = () => {
    setEditingStepId(null);
    const defaultColId = activeSuite?.collectionId || collections[0]?.id || '';
    setChosenColId(defaultColId);
    setStepSourceMode('COLLECTION');
    setStepAssertions([
      { id: `a-${Date.now()}-1`, source: 'STATUS', operator: 'EQUALS', targetValue: '200' },
      { id: `a-${Date.now()}-2`, source: 'RESPONSE_TIME', operator: 'LESS_THAN', targetValue: '500' },
    ]);
    setStepExtractions([]);

    // Prepopulate first request of that collection if exists
    const col = collections.find((c) => c.id === defaultColId);
    if (col && col.requests.length > 0) {
      const firstReq = col.requests[0];
      setChosenReqId(firstReq.id);
      setStepName(firstReq.name);
      setStepMethod(firstReq.method);
      setStepUrl(firstReq.url);
      setStepBody(firstReq.body || '');
    } else {
      setChosenReqId('');
      setStepName('');
      setStepMethod('GET');
      setStepUrl('{{base_url}}/api/v1/resource');
      setStepBody('');
    }

    setIsAddStepModalOpen(true);
  };

  // Open Edit Step Modal
  const handleOpenEditStepModal = (step: TestCaseItem) => {
    setEditingStepId(step.id);
    setStepSourceMode('CUSTOM');
    setChosenReqId(step.requestId || '');
    setStepName(step.name);
    setStepMethod(step.method);
    setStepUrl(step.url);
    setStepBody(step.body || '');
    setStepAssertions(step.assertions ? JSON.parse(JSON.stringify(step.assertions)) : []);
    setStepExtractions(step.extractions ? JSON.parse(JSON.stringify(step.extractions)) : []);
    setIsAddStepModalOpen(true);
  };

  // Handle request selection in Add Step Modal
  const handleSelectRequestForStep = (reqId: string, colId: string) => {
    setChosenReqId(reqId);
    const col = collections.find((c) => c.id === colId);
    const req = col?.requests.find((r) => r.id === reqId);
    if (req) {
      setStepName(req.name);
      setStepMethod(req.method);
      setStepUrl(req.url);
      setStepBody(req.body || '');
      setStepAssertions([
        { id: `a-${Date.now()}-1`, source: 'STATUS', operator: 'EQUALS', targetValue: req.method === 'POST' ? '201' : '200' },
        { id: `a-${Date.now()}-2`, source: 'RESPONSE_TIME', operator: 'LESS_THAN', targetValue: '500' },
      ]);
      // If it looks like a login endpoint, suggest extracting token!
      if (req.url.toLowerCase().includes('login') || req.name.toLowerCase().includes('login') || req.name.toLowerCase().includes('auth')) {
        setStepExtractions([{ variableName: 'auth_token', source: 'JSON_PATH', propertyPath: '$.token' }]);
      }
    }
  };

  // Save Step (Create or Update) to Active Suite
  const handleSaveStepToSuite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepUrl.trim() || !activeSuite) return;

    if (editingStepId) {
      setSuites((prev) =>
        prev.map((s) => {
          if (s.id === activeSuite.id) {
            return {
              ...s,
              cases: s.cases.map((c) =>
                c.id === editingStepId
                  ? {
                      ...c,
                      name: stepName.trim() || `${stepMethod} ${stepUrl}`,
                      method: stepMethod,
                      url: stepUrl.trim(),
                      body: stepBody.trim() ? stepBody : undefined,
                      assertions: stepAssertions,
                      extractions: stepExtractions,
                    }
                  : c
              ),
            };
          }
          return s;
        })
      );
    } else {
      const newStep: TestCaseItem = {
        id: `step-${Date.now()}`,
        requestId: chosenReqId || undefined,
        name: stepName.trim() || `${stepMethod} ${stepUrl}`,
        method: stepMethod,
        url: stepUrl.trim(),
        body: stepBody.trim() ? stepBody : undefined,
        position: activeSuite.cases.length + 1,
        assertions: stepAssertions,
        extractions: stepExtractions,
      };

      setSuites((prev) =>
        prev.map((s) => {
          if (s.id === activeSuite.id) {
            return {
              ...s,
              cases: [...s.cases, newStep],
            };
          }
          return s;
        })
      );
    }

    setIsAddStepModalOpen(false);
    setEditingStepId(null);
  };

  // Re-order step position
  const handleMoveStep = (index: number, direction: 'UP' | 'DOWN') => {
    if (!activeSuite) return;
    const cases = [...activeSuite.cases];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cases.length) return;

    const temp = cases[index];
    cases[index] = cases[targetIndex];
    cases[targetIndex] = temp;

    // Recalculate positions
    const reordered = cases.map((c, i) => ({ ...c, position: i + 1 }));

    setSuites((prev) =>
      prev.map((s) => (s.id === activeSuite.id ? { ...s, cases: reordered } : s))
    );
  };

  // Delete step from suite
  const handleDeleteStep = (stepId: string) => {
    if (!activeSuite) return;
    if (!confirm('Remove this endpoint step from the suite?')) return;

    const filtered = activeSuite.cases
      .filter((c) => c.id !== stepId)
      .map((c, i) => ({ ...c, position: i + 1 }));

    setSuites((prev) =>
      prev.map((s) => (s.id === activeSuite.id ? { ...s, cases: filtered } : s))
    );
  };

  // Delete whole suite
  const handleDeleteSuite = (suiteId: string) => {
    if (!confirm('Are you sure you want to delete this functional test suite?')) return;
    const remaining = suites.filter((s) => s.id !== suiteId);
    setSuites(remaining);
    if (remaining.length > 0) {
      setSelectedSuiteId(remaining[0].id);
    }
  };

  // Execute Test Suite (Automated Chained Execution)
  const handleRunSuite = async () => {
    if (!activeSuite || isRunning || activeSuite.cases.length === 0) return;
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
    if (activeSuite.collectionName) {
      addLog(`Bound Collection: ${activeSuite.collectionName}`);
    }
    addLog(`Chaining enabled: ${activeSuite.cases.length} sequential test steps queued`);

    const extractedContext: Record<string, any> = {};
    let suiteFailed = false;

    // Base URL resolution
    const boundCol = collections.find((c) => c.id === activeSuite.collectionId);
    const defaultBaseUrl = boundCol?.baseUrl || 'http://localhost:8080';

    for (let i = 0; i < activeSuite.cases.length; i++) {
      const step = activeSuite.cases[i];
      addLog(`▶ [Step ${i + 1}/${activeSuite.cases.length}] Executing "${step.name}" (${step.method} ${step.url})`);

      setStepResults((prev) => ({
        ...prev,
        [step.id]: { status: 'RUNNING' },
      }));

      const startTime = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      try {
        let reqUrl = step.url;
        // Resolve {{base_url}}
        if (reqUrl.includes('{{base_url}}')) {
          reqUrl = reqUrl.replace(/\{\{base_url\}\}/g, defaultBaseUrl.replace(/\/$/, ''));
        }

        // Resolve extracted session variables like {{auth_token}} or {{order_id}}
        Object.entries(extractedContext).forEach(([k, v]) => {
          reqUrl = reqUrl.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
        });

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // If an auth_token, token, or accessToken was extracted previously, automatically inject it!
        if (extractedContext['auth_token']) {
          headers['Authorization'] = `Bearer ${extractedContext['auth_token']}`;
        } else if (extractedContext['token']) {
          headers['Authorization'] = `Bearer ${extractedContext['token']}`;
        } else if (extractedContext['accessToken']) {
          headers['Authorization'] = `Bearer ${extractedContext['accessToken']}`;
        } else if (authToken && step.id !== 'step-auth-1') {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        let bodyPayload = step.body;
        if (bodyPayload && typeof bodyPayload === 'string') {
          Object.entries(extractedContext).forEach(([k, v]) => {
            bodyPayload = bodyPayload!.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
          });
        }

        const res = await fetch(reqUrl, {
          method: step.method,
          headers,
          body: step.method !== 'GET' && step.method !== 'HEAD' && bodyPayload ? bodyPayload : undefined,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

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
            const val = getNestedValue(data, assertion.propertyPath || '');
            if (assertion.operator === 'EXISTS' && (val === undefined || val === null)) {
              stepPassed = false;
              failedReasons.push(`Path "${assertion.propertyPath}" does not exist in response`);
            } else if (assertion.operator === 'EQUALS' && String(val) !== assertion.targetValue) {
              stepPassed = false;
              failedReasons.push(`Expected ${assertion.propertyPath} == ${assertion.targetValue}, got ${val}`);
            }
          }
        }

        // Perform Extractions into context
        if (data && step.extractions) {
          for (const ext of step.extractions) {
            const extractedVal = getNestedValue(data, ext.propertyPath);
            if (extractedVal !== undefined) {
              extractedContext[ext.variableName] = extractedVal;
              addLog(`  ↳ Extracted variable: \${${ext.variableName}} = "${String(extractedVal).substring(0, 30)}"`);
            } else {
              addLog(`  ⚠ Warning: Unable to extract \${${ext.variableName}} (Path "${ext.propertyPath}" not found in response)`);
            }
          }
        }

        if (stepPassed) {
          addLog(`✔ [Step ${i + 1}: ${step.name}] PASSED (${latency}ms) — All ${step.assertions.length} assertions verified`);
          setStepResults((prev) => ({
            ...prev,
            [step.id]: { status: 'PASSED', latency, details: `Passed in ${latency}ms` },
          }));
        } else {
          addLog(`✖ [Step ${i + 1}: ${step.name}] FAILED (${latency}ms): ${failedReasons.join('; ')}`);
          setStepResults((prev) => ({
            ...prev,
            [step.id]: { status: 'FAILED', latency, details: failedReasons.join('; ') },
          }));
          suiteFailed = true;

          if (activeSuite.stopOnFailure) {
            addLog(`⛔ Suite execution aborted at Step ${i + 1} ("${step.name}") due to StopOnFailure policy.`);
            break;
          }
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        const latency = Math.round(performance.now() - startTime);
        const isTimeout = err.name === 'AbortError';

        let errReason = isTimeout
          ? 'Connection Timeout (7000ms exceeded — host did not respond)'
          : (err.message === 'Failed to fetch' || err.name === 'TypeError'
              ? 'Failed to fetch (Host unreachable / handshake rejected)'
              : (err.message || 'Network Failure'));

        addLog(`✖ [Step ${i + 1}: ${step.name}] UNREACHABLE (${latency}ms): ${errReason}`);
        addLog(`   ↳ Diagnostic: Target "${step.method} ${step.url}" could not be reached.`);
        addLog(`   ↳ Checklist: 1) Verify VPN connection if internal subnet, 2) Check firewall/whitelist, 3) Verify server status & CORS.`);

        setStepResults((prev) => ({
          ...prev,
          [step.id]: {
            status: 'FAILED',
            latency,
            details: `${errReason} — Check VPN connection or firewall`,
          },
        }));
        suiteFailed = true;
        if (activeSuite.stopOnFailure) {
          addLog(`⛔ Suite execution aborted at Step ${i + 1} ("${step.name}") due to StopOnFailure policy.`);
          break;
        }
      }

      await new Promise((r) => setTimeout(r, 350));
    }

    addLog(`───────────────────────────────────────────────────────`);
    addLog(`Verdict: ${suiteFailed ? '❌ SUITE FAILED' : '✅ ALL SUITE ASSERTIONS PASSED'}`);
    setIsRunning(false);
  };

  // Create New Suite Handler
  const handleCreateSuite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuiteName.trim()) return;

    let initialCases: TestCaseItem[] = [];
    let boundColName = undefined;

    if (selectedCollectionId) {
      const boundCol = collections.find((c) => c.id === selectedCollectionId);
      if (boundCol) {
        boundColName = boundCol.name;
        if (autoImportEndpoints && boundCol.requests.length > 0) {
          initialCases = boundCol.requests.map((req, idx) => ({
            id: `step-${Date.now()}-${idx}`,
            requestId: req.id,
            name: req.name,
            method: req.method,
            url: req.url,
            body: req.body,
            position: idx + 1,
            assertions: [
              { id: `a-${Date.now()}-${idx}-1`, source: 'STATUS', operator: 'EQUALS', targetValue: req.method === 'POST' ? '201' : '200' },
              { id: `a-${Date.now()}-${idx}-2`, source: 'RESPONSE_TIME', operator: 'LESS_THAN', targetValue: '500' },
            ],
            extractions:
              req.url.toLowerCase().includes('login') || req.name.toLowerCase().includes('login')
                ? [{ variableName: 'auth_token', source: 'JSON_PATH', propertyPath: '$.token' }]
                : [],
          }));
        }
      }
    }

    const newSuite: TestSuiteItem = {
      id: `suite-${Math.random().toString(36).substring(2, 9)}`,
      projectId: activeProject?.id || 'proj-default',
      collectionId: selectedCollectionId || undefined,
      collectionName: boundColName,
      name: newSuiteName.trim(),
      description: newSuiteDesc.trim() || 'Automated functional integration test suite',
      stopOnFailure,
      cases: initialCases,
      createdAt: new Date().toISOString(),
    };

    const updated = [newSuite, ...suites];
    setSuites(updated);
    setSelectedSuiteId(newSuite.id);
    setIsNewSuiteModalOpen(false);
    setNewSuiteName('');
    setNewSuiteDesc('');
    setSelectedCollectionId('');
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
            Orchestrate end-to-end API workflows with endpoints selected directly from your API collections.
          </p>
        </div>
        <button
          data-tour="new-suite-btn"
          onClick={() => {
            setSelectedCollectionId(collections[0]?.id || '');
            setAutoImportEndpoints(true);
            setIsNewSuiteModalOpen(true);
          }}
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
            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)',
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
            TEST SUITES ({suites.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
            {suites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 10px', color: '#6b7280', fontSize: '12px' }}>
                No suites created yet.
              </div>
            ) : (
              suites.map((s) => {
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
                    {s.collectionName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#818cf8', marginTop: '3px' }}>
                        <Folder size={11} /> {s.collectionName}
                      </div>
                    )}
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
              })
            )}
          </div>
        </div>

        {/* Right: Suite Pipeline & Live Runner */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {activeSuite ? (
            <>
              {/* Suite Control Bar */}
              <div style={{ backgroundColor: '#111827', padding: '16px 20px', borderRadius: '8px', border: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6', margin: 0 }}>
                      {activeSuite.name}
                    </h3>
                    {activeSuite.collectionName && (
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Folder size={11} /> Source: {activeSuite.collectionName}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                    {activeSuite.description}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => handleDeleteSuite(activeSuite.id)}
                    title="Delete suite"
                    style={{
                      background: 'transparent',
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      color: '#9ca3af',
                      padding: '8px 10px',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                  >
                    <Trash2 size={15} />
                  </button>

                  <button
                    onClick={handleRunSuite}
                    disabled={isRunning || activeSuite.cases.length === 0}
                    style={{
                      backgroundColor: isRunning ? '#374151' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 20px',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: isRunning || activeSuite.cases.length === 0 ? 'not-allowed' : 'pointer',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', letterSpacing: '0.5px' }}>
                    EXECUTION PIPELINE ({activeSuite.cases.length} ENDPOINTS SEQUENCED)
                  </div>
                  <button
                    onClick={handleOpenAddStepModal}
                    title="Add endpoint step to pipeline from API Collections"
                    style={{
                      backgroundColor: '#1f2937',
                      color: '#f3f4f6',
                      border: '1px solid #374151',
                      borderRadius: '4px',
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1f2937')}
                  >
                    <Plus size={14} color="#818cf8" />
                    + Add Endpoint / Step
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeSuite.cases.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280', border: '1px dashed #374151', borderRadius: '8px' }}>
                      No endpoint steps in this suite. Click <strong>"+ Add Endpoint / Step"</strong> above to import endpoints from your API Collections.
                    </div>
                  ) : (
                    activeSuite.cases.map((step, idx) => {
                      const res = stepResults[step.id];
                      const status = res?.status || 'PENDING';

                      return (
                        <div
                          key={step.id}
                          style={{
                            backgroundColor: '#0b0f19',
                            border:
                              status === 'RUNNING'
                                ? '1px solid #6366f1'
                                : status === 'PASSED'
                                ? '1px solid #059669'
                                : status === 'FAILED'
                                ? '1px solid #dc2626'
                                : '1px solid #1f2937',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'border 0.2s',
                          }}
                        >
                          {/* Step Info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor:
                                  status === 'PASSED'
                                    ? '#064e3b'
                                    : status === 'FAILED'
                                    ? '#7f1d1d'
                                    : status === 'RUNNING'
                                    ? '#1e1b4b'
                                    : '#1f2937',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color:
                                  status === 'PASSED'
                                    ? '#34d399'
                                    : status === 'FAILED'
                                    ? '#fca5a5'
                                    : status === 'RUNNING'
                                    ? '#a5f3fc'
                                    : '#9ca3af',
                              }}
                            >
                              {status === 'PASSED' ? (
                                <CheckCircle2 size={16} />
                              ) : status === 'FAILED' ? (
                                <XCircle size={16} />
                              ) : status === 'RUNNING' ? (
                                <RefreshCw size={14} className="animate-spin" />
                              ) : (
                                idx + 1
                              )}
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
                              <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {step.url}
                              </div>
                              {status === 'FAILED' && res?.details && (
                                <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '3px 8px', borderRadius: '4px', width: 'fit-content' }}>
                                  <AlertCircle size={13} style={{ flexShrink: 0, color: '#ef4444' }} />
                                  <span style={{ fontWeight: 500 }}>{res.details}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Assertions & Extractions Chips */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '300px' }}>
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
                                  title={`Extracts ${e.propertyPath} into \${${e.variableName}}`}
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

                            {/* Position Re-order & Delete Controls */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                onClick={() => handleMoveStep(idx, 'UP')}
                                disabled={idx === 0}
                                title="Move Step Up"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: idx === 0 ? '#374151' : '#9ca3af',
                                  cursor: idx === 0 ? 'default' : 'pointer',
                                  padding: '4px',
                                }}
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                onClick={() => handleMoveStep(idx, 'DOWN')}
                                disabled={idx === activeSuite.cases.length - 1}
                                title="Move Step Down"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: idx === activeSuite.cases.length - 1 ? '#374151' : '#9ca3af',
                                  cursor: idx === activeSuite.cases.length - 1 ? 'default' : 'pointer',
                                  padding: '4px',
                                }}
                              >
                                <ArrowDown size={14} />
                              </button>
                              <button
                                onClick={() => handleOpenEditStepModal(step)}
                                title="Edit Step & Variable Extractions"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#9ca3af',
                                  cursor: 'pointer',
                                  padding: '4px',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#818cf8')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteStep(step.id)}
                                title="Delete step"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#6b7280',
                                  cursor: 'pointer',
                                  padding: '4px',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            {/* Verdict / Latency Badge */}
                            <div style={{ minWidth: '75px', textAlign: 'right' }}>
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
                    })
                  )}
                </div>
              </div>

              {/* Execution Console Logs */}
              <div style={{ backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1f2937', padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '12px', fontWeight: 'bold' }}>
                    <Terminal size={14} /> LIVE EXECUTION LOGS
                  </div>
                  {logs.length > 0 && (
                    <button
                      onClick={() => setLogs([])}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6b7280',
                        fontSize: '11px',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                    >
                      Clear Logs
                    </button>
                  )}
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
                    maxHeight: '260px',
                    lineHeight: '1.6',
                  }}
                >
                  {logs.length === 0 ? (
                    <div style={{ color: '#6b7280' }}>
                      Ready to execute. Click <strong>"Run Suite"</strong> above to launch the automated sequential test pipeline.
                    </div>
                  ) : (
                    logs.map((log, index) => {
                      const isError = log.includes('✖') || log.includes('FAILED') || log.includes('NETWORK ERROR') || log.includes('⛔') || log.includes('❌') || log.includes('UNREACHABLE');
                      const isSuccess = log.includes('✔') || log.includes('✅') || log.includes('ALL SUITE ASSERTIONS PASSED');
                      const isWarning = log.includes('⚠') || log.includes('Diagnostic:') || log.includes('Checklist:') || log.includes('Check VPN');
                      const isInfo = log.includes('▶');
                      const isExtract = log.includes('↳') && !isWarning;
                      const isSeparator = log.includes('────');

                      let color = '#d1d5db';
                      let bg = 'transparent';
                      let fontWeight: 'normal' | 'bold' = 'normal';

                      if (isError) {
                        color = '#fca5a5';
                        bg = 'rgba(239, 68, 68, 0.14)';
                        fontWeight = 'bold';
                      } else if (isSuccess) {
                        color = '#6ee7b7';
                        bg = 'rgba(16, 185, 129, 0.08)';
                        fontWeight = 'bold';
                      } else if (isWarning) {
                        color = '#fde047';
                        bg = 'rgba(234, 179, 8, 0.1)';
                        fontWeight = 'bold';
                      } else if (isInfo) {
                        color = '#38bdf8';
                        fontWeight = 'bold';
                      } else if (isExtract) {
                        color = '#c084fc';
                      } else if (isSeparator) {
                        color = '#4b5563';
                      }

                      return (
                        <div
                          key={index}
                          style={{
                            color,
                            backgroundColor: bg,
                            padding: isError || isSuccess || isWarning ? '3px 8px' : '1px 4px',
                            borderRadius: '4px',
                            margin: '2px 0',
                            fontWeight,
                            borderLeft: isError
                              ? '3px solid #ef4444'
                              : isSuccess
                              ? '3px solid #10b981'
                              : isWarning
                              ? '3px solid #eab308'
                              : isInfo
                              ? '3px solid #0284c7'
                              : 'none',
                          }}
                        >
                          {log}
                        </div>
                      );
                    })
                  )}
                  <div ref={logsBottomRef} />
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

      {/* Modal 1: Create New Suite */}
      {isNewSuiteModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setIsNewSuiteModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '10px',
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px', color: '#f3f4f6' }}>
              Create New Functional Suite
            </h3>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '18px' }}>
              Link your test suite to an existing API Collection or build custom chained workflows.
            </p>

            <form onSubmit={handleCreateSuite} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  Suite Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newSuiteName}
                  onChange={(e) => setNewSuiteName(e.target.value)}
                  placeholder="e.g. End-to-End Checkout Flow"
                  required
                  style={{ width: '100%', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '6px', padding: '9px 12px', color: '#f3f4f6', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  Source API Collection (Optional)
                </label>
                <select
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '6px', padding: '9px 12px', color: '#f3f4f6', fontSize: '13px' }}
                >
                  <option value="">-- None / Custom (Start from scratch) --</option>
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name} ({col.requests.length} endpoints)
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  Selecting a collection links base URLs and lets you quickly import its endpoints.
                </div>
              </div>

              {selectedCollectionId && (
                <div style={{ backgroundColor: '#1e1b4b33', border: '1px solid #4338ca', padding: '10px 12px', borderRadius: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#c7d2fe', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={autoImportEndpoints}
                      onChange={(e) => setAutoImportEndpoints(e.target.checked)}
                      style={{ accentColor: '#6366f1' }}
                    />
                    Automatically import all endpoints from this collection as initial steps
                  </label>
                </div>
              )}

              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  Description
                </label>
                <textarea
                  value={newSuiteDesc}
                  onChange={(e) => setNewSuiteDesc(e.target.value)}
                  placeholder="Explain the business scenario or test boundary covered by this suite"
                  rows={2}
                  style={{ width: '100%', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '6px', padding: '9px 12px', color: '#f3f4f6', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#9ca3af', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={stopOnFailure}
                    onChange={(e) => setStopOnFailure(e.target.checked)}
                    style={{ accentColor: '#6366f1' }}
                  />
                  Stop suite execution immediately if any step fails (Stop on Failure)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsNewSuiteModalOpen(false)}
                  style={{ backgroundColor: '#1f2937', color: '#9ca3af', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#6366f1', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                >
                  Create Suite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Endpoint/Step to Pipeline */}
      {isAddStepModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setIsAddStepModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '10px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px', color: '#f3f4f6' }}>
              {editingStepId ? 'Edit Step & Chaining Variables' : 'Add Endpoint Step to Pipeline'}
            </h3>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>
              {editingStepId
                ? 'Modify assertions, request payload, or extract variables to pass to next steps.'
                : 'Select an endpoint from your API Collections or configure a custom step with assertions & variable chaining.'}
            </p>

            {/* Mode Switcher */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #1f2937', paddingBottom: '8px' }}>
              <button
                type="button"
                onClick={() => setStepSourceMode('COLLECTION')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: stepSourceMode === 'COLLECTION' ? '#6366f1' : '#1f2937',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Layers size={14} /> Pick from API Collection
              </button>
              <button
                type="button"
                onClick={() => setStepSourceMode('CUSTOM')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: stepSourceMode === 'CUSTOM' ? '#6366f1' : '#1f2937',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sliders size={14} /> Custom Endpoint
              </button>
            </div>

            <form onSubmit={handleSaveStepToSuite} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {stepSourceMode === 'COLLECTION' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#0b0f19', padding: '12px', borderRadius: '6px', border: '1px solid #1f2937' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                      1. Select Collection
                    </label>
                    <select
                      value={chosenColId}
                      onChange={(e) => {
                        const newColId = e.target.value;
                        setChosenColId(newColId);
                        const c = collections.find((col) => col.id === newColId);
                        if (c && c.requests.length > 0) {
                          handleSelectRequestForStep(c.requests[0].id, newColId);
                        }
                      }}
                      style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', padding: '7px 10px', color: '#f3f4f6', fontSize: '12px' }}
                    >
                      {collections.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.name} ({col.requests.length} endpoints)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                      2. Select Endpoint / Request
                    </label>
                    {(() => {
                      const curCol = collections.find((c) => c.id === chosenColId);
                      const reqs = curCol?.requests || [];
                      return reqs.length === 0 ? (
                        <div style={{ fontSize: '11px', color: '#6b7280', padding: '8px 0' }}>No requests in this collection</div>
                      ) : (
                        <select
                          value={chosenReqId}
                          onChange={(e) => handleSelectRequestForStep(e.target.value, chosenColId)}
                          style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', padding: '7px 10px', color: '#f3f4f6', fontSize: '12px' }}
                        >
                          {reqs.map((r) => (
                            <option key={r.id} value={r.id}>
                              [{r.method}] {r.name}
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Step Name */}
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                  Step Name
                </label>
                <input
                  type="text"
                  value={stepName}
                  onChange={(e) => setStepName(e.target.value)}
                  placeholder="e.g. Authenticate Admin, Fetch Catalog"
                  required
                  style={{ width: '100%', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '6px', padding: '8px 12px', color: '#f3f4f6', fontSize: '13px' }}
                />
              </div>

              {/* Method and URL */}
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                  HTTP Method & URL <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={stepMethod}
                    onChange={(e) => setStepMethod(e.target.value as HTTPMethod)}
                    style={{ backgroundColor: '#1f2937', color: '#f3f4f6', fontWeight: 'bold', border: '1px solid #374151', borderRadius: '6px', padding: '0 12px', fontSize: '12px' }}
                  >
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>DELETE</option>
                    <option>PATCH</option>
                  </select>
                  <input
                    type="text"
                    value={stepUrl}
                    onChange={(e) => setStepUrl(e.target.value)}
                    placeholder="{{base_url}}/api/v1/orders or https://api.example.com/..."
                    required
                    style={{ flex: 1, backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '6px', padding: '8px 12px', color: '#f3f4f6', fontSize: '13px', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              {/* Body (if POST/PUT/PATCH) */}
              {(stepMethod === 'POST' || stepMethod === 'PUT' || stepMethod === 'PATCH') && (
                <div>
                  <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                    Request Body (JSON)
                  </label>
                  <textarea
                    value={stepBody}
                    onChange={(e) => setStepBody(e.target.value)}
                    rows={4}
                    placeholder="{\n  &quot;order_id&quot;: &quot;{{extracted_id}}&quot;\n}"
                    style={{ width: '100%', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '6px', padding: '8px 12px', color: '#a5f3fc', fontSize: '12px', fontFamily: 'monospace' }}
                  />
                </div>
              )}

              {/* Assertions Builder */}
              <div style={{ backgroundColor: '#0b0f19', padding: '12px', borderRadius: '6px', border: '1px solid #1f2937' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af' }}>
                    ASSERTIONS (VERIFICATIONS)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setStepAssertions((prev) => [
                        ...prev,
                        { id: `a-${Date.now()}`, source: 'STATUS', operator: 'EQUALS', targetValue: '200' },
                      ])
                    }
                    style={{ backgroundColor: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    <Plus size={11} /> Add Assertion
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {stepAssertions.map((a, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <select
                        value={a.source}
                        onChange={(e) => {
                          const copy = [...stepAssertions];
                          copy[idx].source = e.target.value as AssertionSource;
                          setStepAssertions(copy);
                        }}
                        style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', color: '#f3f4f6', fontSize: '11px', padding: '4px 6px' }}
                      >
                        <option value="STATUS">STATUS</option>
                        <option value="RESPONSE_TIME">RESPONSE_TIME</option>
                        <option value="JSON_PATH">JSON_PATH</option>
                      </select>

                      <select
                        value={a.operator}
                        onChange={(e) => {
                          const copy = [...stepAssertions];
                          copy[idx].operator = e.target.value as AssertionOperator;
                          setStepAssertions(copy);
                        }}
                        style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', color: '#f3f4f6', fontSize: '11px', padding: '4px 6px' }}
                      >
                        <option value="EQUALS">EQUALS</option>
                        <option value="LESS_THAN">LESS_THAN</option>
                        <option value="EXISTS">EXISTS</option>
                      </select>

                      {a.source === 'JSON_PATH' && (
                        <input
                          type="text"
                          value={a.propertyPath || ''}
                          onChange={(e) => {
                            const copy = [...stepAssertions];
                            copy[idx].propertyPath = e.target.value;
                            setStepAssertions(copy);
                          }}
                          placeholder="$.data.id or $.success"
                          style={{ flex: 1, backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', padding: '4px 8px', color: '#f3f4f6', fontSize: '11px', fontFamily: 'monospace' }}
                        />
                      )}

                      <input
                        type="text"
                        value={a.targetValue}
                        onChange={(e) => {
                          const copy = [...stepAssertions];
                          copy[idx].targetValue = e.target.value;
                          setStepAssertions(copy);
                        }}
                        placeholder="Expected Value (e.g. 200, 500, true)"
                        style={{ flex: 1, backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', padding: '4px 8px', color: '#a5f3fc', fontSize: '11px' }}
                      />

                      <button
                        type="button"
                        onClick={() => setStepAssertions((prev) => prev.filter((_, i) => i !== idx))}
                        style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Variable Extractions Builder */}
              <div style={{ backgroundColor: '#0b0f19', padding: '12px', borderRadius: '6px', border: '1px solid #1f2937' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Link2 size={13} color="#c084fc" /> VARIABLE EXTRACTIONS (FOR CHAINING)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setStepExtractions((prev) => [
                        ...prev,
                        { variableName: 'extracted_var', source: 'JSON_PATH', propertyPath: '$.token' },
                      ])
                    }
                    style={{ backgroundColor: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    <Plus size={11} /> Add Extraction
                  </button>
                </div>

                {stepExtractions.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    No variables extracted. Use this to pull tokens or IDs to pass into subsequent steps.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {stepExtractions.map((e, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>Extract:</span>
                        <input
                          type="text"
                          value={e.propertyPath}
                          onChange={(ev) => {
                            const copy = [...stepExtractions];
                            copy[idx].propertyPath = ev.target.value;
                            setStepExtractions(copy);
                          }}
                          placeholder="JSONPath e.g. $.token or $.data.id"
                          style={{ flex: 1, backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', padding: '4px 8px', color: '#f3f4f6', fontSize: '11px', fontFamily: 'monospace' }}
                        />
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>as</span>
                        <input
                          type="text"
                          value={e.variableName}
                          onChange={(ev) => {
                            const copy = [...stepExtractions];
                            copy[idx].variableName = ev.target.value;
                            setStepExtractions(copy);
                          }}
                          placeholder="Variable Name e.g. auth_token"
                          style={{ flex: 1, backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', padding: '4px 8px', color: '#c084fc', fontSize: '11px', fontFamily: 'monospace' }}
                        />
                        <button
                          type="button"
                          onClick={() => setStepExtractions((prev) => prev.filter((_, i) => i !== idx))}
                          style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddStepModalOpen(false)}
                  style={{ backgroundColor: '#1f2937', color: '#9ca3af', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#6366f1', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                >
                  {editingStepId ? 'Update Step' : 'Add Step to Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
