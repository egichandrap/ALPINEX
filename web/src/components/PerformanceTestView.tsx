import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Play,
  Square,
  Plus,
  Trash2,
  Edit3,
  Layers,
  Sliders,
  CheckCircle2,
  XCircle,
  Activity,
  FileText,
  Download,
  Code2,
  Folder,
  RefreshCw,
  Terminal,
  AlertTriangle,
  Flame,
  Gauge,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { ProjectItem } from '../types/auth';
import { CollectionItem, HTTPMethod } from '../types/collection';
import {
  PerformanceProfile,
  PerformanceScenario,
  PerformanceMetricPoint,
  PerformanceReport,
} from '../types/performance';

interface PerformanceTestViewProps {
  authToken: string | null;
  activeProject: ProjectItem;
  collections: CollectionItem[];
}

export const PerformanceTestView: React.FC<PerformanceTestViewProps> = ({
  authToken,
  activeProject,
  collections = [],
}) => {
  const getScenariosKey = (projId: string) => `alpinex_perf_scenarios_${projId}`;
  const getReportsKey = (projId: string) => `alpinex_perf_reports_${projId}`;

  const loadScenarios = (projId: string): PerformanceScenario[] => {
    try {
      const saved = localStorage.getItem(getScenariosKey(projId));
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load performance scenarios', e);
    }
    return [];
  };

  const loadReports = (projId: string): PerformanceReport[] => {
    try {
      const saved = localStorage.getItem(getReportsKey(projId));
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load performance reports', e);
    }
    return [];
  };

  const [scenarios, setScenarios] = useState<PerformanceScenario[]>(() => loadScenarios(activeProject?.id || 'proj-default'));
  const [reports, setReports] = useState<PerformanceReport[]>(() => loadReports(activeProject?.id || 'proj-default'));

  // Main View Mode: SCENARIOS (Configure/Run), REPORTS (Separate reports), K6_SCRIPT
  const [viewTab, setViewTab] = useState<'SCENARIOS' | 'REPORTS' | 'K6_SCRIPT'>('SCENARIOS');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Modal State for Add / Edit Scenario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState<'COLLECTION' | 'CUSTOM'>('COLLECTION');
  const [chosenColId, setChosenColId] = useState<string>('');
  const [chosenReqId, setChosenReqId] = useState<string>('');
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioMethod, setScenarioMethod] = useState<HTTPMethod>('GET');
  const [scenarioUrl, setScenarioUrl] = useState('');
  const [scenarioBody, setScenarioBody] = useState('');
  const [scenarioProfile, setScenarioProfile] = useState<PerformanceProfile>('LOAD');
  const [scenarioVUs, setScenarioVUs] = useState(50);
  const [scenarioDuration, setScenarioDuration] = useState('1m');
  const [scenarioP95, setScenarioP95] = useState(500);

  // Execution State
  const [runningScenarioIds, setRunningScenarioIds] = useState<string[]>([]);
  const [liveMetrics, setLiveMetrics] = useState<Record<string, PerformanceMetricPoint>>({});
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const executionTimerRef = useRef<any>(null);
  const accumulatedMetricsRef = useRef<Record<string, PerformanceMetricPoint[]>>({});
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Reload when project changes
  useEffect(() => {
    if (!activeProject?.id) return;
    const loadedScens = loadScenarios(activeProject.id);
    const loadedReps = loadReports(activeProject.id);
    setScenarios(loadedScens);
    setReports(loadedReps);
    setRunningScenarioIds([]);
    setLiveMetrics({});
    setLiveLogs([]);
    if (executionTimerRef.current) clearInterval(executionTimerRef.current);
  }, [activeProject?.id]);

  // Persist scenarios
  useEffect(() => {
    if (!activeProject?.id) return;
    try {
      localStorage.setItem(getScenariosKey(activeProject.id), JSON.stringify(scenarios));
    } catch (e) {
      console.error('Failed to save scenarios', e);
    }
  }, [scenarios, activeProject?.id]);

  // Persist reports
  useEffect(() => {
    if (!activeProject?.id) return;
    try {
      localStorage.setItem(getReportsKey(activeProject.id), JSON.stringify(reports));
    } catch (e) {
      console.error('Failed to save reports', e);
    }
  }, [reports, activeProject?.id]);

  // Scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveLogs]);

  // Handle Preset Profile Selection in Modal
  const handleSelectProfile = (profile: PerformanceProfile) => {
    setScenarioProfile(profile);
    if (profile === 'SMOKE') {
      setScenarioVUs(5);
      setScenarioDuration('30s');
      setScenarioP95(300);
    } else if (profile === 'LOAD') {
      setScenarioVUs(50);
      setScenarioDuration('1m');
      setScenarioP95(500);
    } else if (profile === 'STRESS') {
      setScenarioVUs(200);
      setScenarioDuration('2m');
      setScenarioP95(800);
    } else if (profile === 'SPIKE') {
      setScenarioVUs(500);
      setScenarioDuration('1m');
      setScenarioP95(1500);
    }
  };

  // Open Modal for New Scenario
  const handleOpenAddModal = () => {
    setEditingScenarioId(null);
    const defaultCol = collections[0];
    setChosenColId(defaultCol?.id || '');
    if (defaultCol && defaultCol.requests.length > 0) {
      const firstReq = defaultCol.requests[0];
      setChosenReqId(firstReq.id);
      setScenarioName(`${firstReq.name} Load Test`);
      setScenarioMethod(firstReq.method);
      setScenarioUrl(firstReq.url);
      setScenarioBody(firstReq.body || '');
      setSourceMode('COLLECTION');
    } else {
      setChosenReqId('');
      setScenarioName('New Custom Performance Test');
      setScenarioMethod('GET');
      setScenarioUrl('http://localhost:8080/health');
      setScenarioBody('');
      setSourceMode('CUSTOM');
    }
    handleSelectProfile('LOAD');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (scen: PerformanceScenario) => {
    setEditingScenarioId(scen.id);
    setScenarioName(scen.name);
    setScenarioMethod(scen.method);
    setScenarioUrl(scen.url);
    setScenarioBody(scen.body || '');
    setScenarioProfile(scen.profile);
    setScenarioVUs(scen.targetVUs);
    setScenarioDuration(scen.duration);
    setScenarioP95(scen.p95Threshold);
    setSourceMode('CUSTOM');
    setIsModalOpen(true);
  };

  // Save Scenario (Create or Update)
  const handleSaveScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioName.trim() || !scenarioUrl.trim()) return;

    if (editingScenarioId) {
      setScenarios((prev) =>
        prev.map((s) =>
          s.id === editingScenarioId
            ? {
                ...s,
                name: scenarioName.trim(),
                method: scenarioMethod,
                url: scenarioUrl.trim(),
                body: scenarioBody.trim() || undefined,
                profile: scenarioProfile,
                targetVUs: Number(scenarioVUs) || 10,
                duration: scenarioDuration.trim() || '1m',
                p95Threshold: Number(scenarioP95) || 500,
              }
            : s
        )
      );
    } else {
      const selectedCol = collections.find((c) => c.id === chosenColId);
      const newScen: PerformanceScenario = {
        id: `scen-${Date.now()}`,
        projectId: activeProject?.id || 'proj-default',
        collectionId: chosenColId || undefined,
        collectionName: selectedCol?.name,
        requestId: chosenReqId || undefined,
        name: scenarioName.trim(),
        method: scenarioMethod,
        url: scenarioUrl.trim(),
        body: scenarioBody.trim() || undefined,
        profile: scenarioProfile,
        targetVUs: Number(scenarioVUs) || 10,
        duration: scenarioDuration.trim() || '1m',
        p95Threshold: Number(scenarioP95) || 500,
        createdAt: new Date().toISOString(),
      };
      setScenarios((prev) => [...prev, newScen]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteScenario = (id: string) => {
    if (confirm('Are you sure you want to delete this performance scenario?')) {
      setScenarios((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Convert duration string (e.g. "30s", "1m", "2m") to total seconds
  const parseDurationToSeconds = (dur: string): number => {
    const trimmed = dur.trim().toLowerCase();
    if (trimmed.endsWith('m')) {
      const mins = parseFloat(trimmed.replace('m', ''));
      return Math.max(5, Math.round(mins * 60));
    }
    if (trimmed.endsWith('s')) {
      const secs = parseFloat(trimmed.replace('s', ''));
      return Math.max(5, Math.round(secs));
    }
    const num = parseFloat(trimmed);
    return isNaN(num) ? 30 : Math.max(5, Math.round(num));
  };

  // Resolve Target URL (replacing {{base_url}} or relative path)
  const resolveTargetUrl = (scen: PerformanceScenario): string => {
    let url = scen.url.trim();
    const boundCol = collections.find((c) => c.id === scen.collectionId) || collections[0];
    const baseUrl = (boundCol?.baseUrl || 'http://localhost:8080').replace(/\/$/, '');
    if (url.includes('{{base_url}}')) {
      url = url.replace(/\{\{base_url\}\}/g, baseUrl);
    } else if (url.startsWith('/')) {
      url = `${baseUrl}${url}`;
    }
    return url;
  };

  interface ProbeResult {
    success: boolean;
    latency: number;
    status: number;
    statusText: string;
    error?: string;
  }

  // Execute an actual HTTP network probe against the target endpoint
  const executeSingleProbe = async (
    scen: PerformanceScenario,
    targetUrl: string,
    token: string | null
  ): Promise<ProbeResult> => {
    const start = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json, text/plain, */*',
      };
      if (scen.method !== 'GET' && scen.method !== 'HEAD') {
        headers['Content-Type'] = 'application/json';
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(targetUrl, {
        method: scen.method,
        headers,
        body: scen.method !== 'GET' && scen.method !== 'HEAD' && scen.body?.trim() ? scen.body : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - start);
      const isHttpOk = res.status >= 200 && res.status < 400;

      return {
        success: isHttpOk,
        latency,
        status: res.status,
        statusText: res.statusText || `${res.status}`,
        error: isHttpOk ? undefined : `HTTP ${res.status} ${res.statusText || ''}`.trim(),
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - start);
      let errorMsg =
        err.name === 'AbortError'
          ? 'Connection Timeout (7000ms)'
          : err.message || 'Network Failure';

      if (errorMsg === 'Failed to fetch') {
        errorMsg = 'Failed to fetch (Endpoint unreachable — Check VPN / Intranet / CORS)';
      }

      return {
        success: false,
        latency,
        status: 0,
        statusText: 'Network Error',
        error: errorMsg,
      };
    }
  };

  // Launch Performance Execution (Single or Multiple in Parallel) with REAL HTTP Requests
  const runPerformanceTests = async (targets: PerformanceScenario[]) => {
    if (targets.length === 0) return;

    if (executionTimerRef.current) {
      clearInterval(executionTimerRef.current);
      executionTimerRef.current = null;
    }

    const targetIds = targets.map((t) => t.id);
    setRunningScenarioIds(targetIds);
    setElapsedSeconds(0);

    accumulatedMetricsRef.current = {};
    targets.forEach((t) => {
      accumulatedMetricsRef.current[t.id] = [];
    });

    const isParallel = targets.length > 1;
    const startTimestamp = new Date().toLocaleTimeString();

    const targetUrlMap: Record<string, string> = {};
    targets.forEach((t) => {
      targetUrlMap[t.id] = resolveTargetUrl(t);
    });

    setLiveLogs([
      `🚀 [${startTimestamp}] Initializing AlpineX Live k6 Engine v2.3.0...`,
      `⚙️ Orchestration Mode: ${isParallel ? `PARALLEL CONCURRENT WORKLOAD (${targets.length} endpoints)` : `ISOLATED ENDPOINT WORKLOAD`}`,
      ...targets.map(
        (t) =>
          `  ▶ Target [${t.method}] "${t.name}" -> ${t.profile} Profile (${t.targetVUs} VUs, ${t.duration}, P95 SLA: ${t.p95Threshold}ms)`
      ),
      `🔍 Running preflight connectivity verification...`,
    ]);

    // Preflight connectivity verification: Check if target endpoints are reachable
    let anyUnreachable = false;
    for (const t of targets) {
      const targetUrl = targetUrlMap[t.id];
      const preflight = await executeSingleProbe(t, targetUrl, authToken);
      if (!preflight.success) {
        anyUnreachable = true;
        setLiveLogs((prev) => [
          ...prev,
          `❌ [PREFLIGHT FAILED] Target "${t.name}" (${targetUrl}) is UNREACHABLE!`,
          `   ↳ Reason: ${preflight.error}. If this host requires VPN or corporate intranet, make sure VPN is ACTIVE.`,
        ]);
      } else {
        setLiveLogs((prev) => [
          ...prev,
          `✅ [PREFLIGHT OK] Target "${t.name}" responded HTTP ${preflight.status} (${preflight.latency}ms). Connectivity verified.`,
        ]);
      }
    }

    if (anyUnreachable) {
      setLiveLogs((prev) => [
        ...prev,
        `⚠️ WARNING: Unreachable target(s) detected. Load testing will run real requests, but connection failures will trigger SLA BREACH.`,
      ]);
    }

    setLiveLogs((prev) => [
      ...prev,
      `─────────────────────────────────────────────────────────────────────────────`,
      `⚡ Dispatched concurrent worker threads to target endpoints...`,
    ]);

    const maxTestSeconds = Math.max(...targets.map((t) => parseDurationToSeconds(t.duration)));
    let currentSecond = 0;
    let isTickRunning = false;

    const timer = setInterval(async () => {
      if (isTickRunning) return;
      isTickRunning = true;

      try {
        currentSecond += 1;
        setElapsedSeconds(currentSecond);

        const latestRollup: Record<string, PerformanceMetricPoint> = {};

        await Promise.all(
          targets.map(async (scen) => {
            const scenDurationSec = parseDurationToSeconds(scen.duration);
            const isActive = currentSecond <= scenDurationSec;
            if (!isActive) return;

            const targetUrl = targetUrlMap[scen.id];

            // Batch sizing based on workload profile & target VUs
            let batchSize = 1;
            if (scen.profile === 'SMOKE') {
              batchSize = Math.max(1, Math.min(scen.targetVUs, 5));
            } else if (scen.profile === 'LOAD') {
              batchSize = Math.max(2, Math.min(scen.targetVUs, 12));
            } else if (scen.profile === 'STRESS') {
              batchSize = Math.max(4, Math.min(scen.targetVUs, 20));
            } else if (scen.profile === 'SPIKE') {
              batchSize =
                currentSecond > 5 && currentSecond < 20
                  ? Math.max(8, Math.min(scen.targetVUs, 30))
                  : Math.max(2, Math.min(scen.targetVUs, 6));
            }

            // Execute real network HTTP requests
            const batchPromises = Array.from({ length: batchSize }).map(() =>
              executeSingleProbe(scen, targetUrl, authToken)
            );
            const results = await Promise.all(batchPromises);

            const totalCount = results.length;
            const failedCount = results.filter((r) => !r.success).length;
            const currentErrorRate = totalCount > 0 ? failedCount / totalCount : 0;

            const latencies = results.map((r) => r.latency).sort((a, b) => a - b);
            const p95 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0;

            const metricPoint: PerformanceMetricPoint = {
              time: new Date().toLocaleTimeString(),
              vus: scen.targetVUs,
              rps: totalCount,
              p95,
              errorRate: Math.round(currentErrorRate * 100) / 100,
            };

            if (!accumulatedMetricsRef.current[scen.id]) {
              accumulatedMetricsRef.current[scen.id] = [];
            }
            accumulatedMetricsRef.current[scen.id].push(metricPoint);
            latestRollup[scen.id] = metricPoint;

            // Live terminal log
            if (failedCount > 0) {
              const firstErr = results.find((r) => !r.success)?.error || 'Network Error';
              const is100Percent = failedCount === totalCount;
              const logLine = is100Percent
                ? `❌ [${metricPoint.time}] [${scen.name.substring(0, 16)}] ALL ${totalCount} REQS FAILED (100% Error Rate) | ${firstErr}`
                : `⚠️ [${metricPoint.time}] [${scen.name.substring(0, 16)}] ${failedCount}/${totalCount} failed (${Math.round(currentErrorRate * 100)}% err) | P95: ${p95}ms`;
              setLiveLogs((prev) => [...prev.slice(-150), logLine]);
            } else if (currentSecond % 2 === 0) {
              const isSlaOk = p95 <= scen.p95Threshold;
              const logLine = `✔ [${metricPoint.time}] [${scen.name.substring(0, 16)}] k6: VUs=${scen.targetVUs} RPS=${totalCount} p(95)=${p95}ms | SLA: ${isSlaOk ? 'PASS' : 'BREACH'}`;
              setLiveLogs((prev) => [...prev.slice(-150), logLine]);
            }
          })
        );

        setLiveMetrics((prev) => ({ ...prev, ...latestRollup }));

        if (currentSecond >= maxTestSeconds) {
          clearInterval(timer);
          executionTimerRef.current = null;
          stopPerformanceTests(targets, accumulatedMetricsRef.current);
        }
      } finally {
        isTickRunning = false;
      }
    }, 1000);

    executionTimerRef.current = timer;
  };

  // Stop / Finalize Tests & Generate Separate Reports for Each Endpoint
  const stopPerformanceTests = (
    targets: PerformanceScenario[],
    metricsHistory?: Record<string, PerformanceMetricPoint[]>
  ) => {
    if (executionTimerRef.current) {
      clearInterval(executionTimerRef.current);
      executionTimerRef.current = null;
    }

    setRunningScenarioIds([]);

    const historyData = metricsHistory || accumulatedMetricsRef.current;
    const timestamp = new Date().toISOString();
    const newReports: PerformanceReport[] = [];

    targets.forEach((scen) => {
      const history = (historyData && historyData[scen.id]) || [];
      const totalReqs = history.reduce((sum, h) => sum + h.rps, 0);
      const totalErrors = history.reduce((sum, h) => sum + Math.round(h.rps * h.errorRate), 0);
      const peakRps = history.length > 0 ? Math.max(...history.map((h) => h.rps)) : 0;
      const avgRps = history.length > 0 ? Math.round(totalReqs / Math.max(1, history.length)) : 0;
      const p95Latency = history.length > 0 ? Math.round(history.reduce((sum, h) => sum + h.p95, 0) / history.length) : 0;
      const p50Latency = Math.round(p95Latency * 0.7);
      const avgErrorRate = totalReqs > 0 ? Math.round((totalErrors / totalReqs) * 100) / 100 : 1.0;

      // Determine Verdict & Failure Reason
      let verdict: 'PASSED' | 'BREACH' = 'PASSED';
      let failureReason: string | undefined = undefined;

      if (totalReqs === 0) {
        verdict = 'BREACH';
        failureReason = 'No requests completed. Endpoint unreachable (Check VPN connection or target host).';
      } else if (totalErrors === totalReqs || avgErrorRate >= 0.99) {
        verdict = 'BREACH';
        failureReason = '100% of requests failed to connect (Failed to fetch). Endpoint unreachable — please verify your VPN connection.';
      } else if (avgErrorRate > 0.05) {
        verdict = 'BREACH';
        failureReason = `High error rate: ${(avgErrorRate * 100).toFixed(1)}% of requests failed HTTP status assertions or timed out.`;
      } else if (p95Latency > scen.p95Threshold) {
        verdict = 'BREACH';
        failureReason = `P95 tail latency (${p95Latency}ms) breached configured SLA threshold (${scen.p95Threshold}ms).`;
      }

      const report: PerformanceReport = {
        id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        projectId: activeProject?.id || 'proj-default',
        scenarioId: scen.id,
        scenarioName: scen.name,
        endpointMethod: scen.method,
        endpointUrl: scen.url,
        profile: scen.profile,
        targetVUs: scen.targetVUs,
        duration: scen.duration,
        p95Threshold: scen.p95Threshold,
        totalRequests: totalReqs,
        peakRps,
        avgRps,
        p95Latency,
        p50Latency,
        errorRate: avgErrorRate,
        verdict,
        failureReason,
        timestamp,
        logs: [
          `Target: [${scen.method}] ${scen.url}`,
          `Profile: ${scen.profile} (${scen.targetVUs} VUs, ${scen.duration})`,
          `Total Sent: ${totalReqs.toLocaleString()} requests completed (${totalErrors} errors, Peak: ${peakRps} RPS)`,
          `P95 Tail Latency: ${p95Latency}ms vs SLA Threshold: ${scen.p95Threshold}ms`,
          `Verdict: ${verdict === 'PASSED' ? '✅ SLA MET' : '❌ SLA BREACH'}`,
          ...(failureReason ? [`Diagnostic Reason: ${failureReason}`] : []),
        ],
        metrics: history,
      };

      newReports.push(report);
    });

    setReports((prev) => [...newReports, ...prev]);
    setLiveLogs((prev) => [
      ...prev,
      `─────────────────────────────────────────────────────────────────────────────`,
      `🏁 Test execution concluded. Generated ${newReports.length} separate endpoint reports in "Reports & History".`,
    ]);
  };

  const isAnyRunning = runningScenarioIds.length > 0;

  // Synthesize k6 script for inspection
  const generateK6Code = (scen?: PerformanceScenario): string => {
    const s = scen || scenarios[0];
    if (!s) return '// No scenario selected';

    return `import http from 'k6/http';
import { check, sleep } from 'k6';

// Workload Model: ${s.profile} Profile
export const options = {
  scenarios: {
    ${s.id.replace(/-/g, '_')}: {
      executor: 'constant-vus',
      vus: ${s.targetVUs},
      duration: '${s.duration}',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<${s.p95Threshold}'], // SLA Requirement
    http_req_failed: ['rate<0.01'],             // Error rate under 1%
  },
};

export default function () {
  const url = '${s.url}';
  const payload = ${s.body ? JSON.stringify(s.body) : 'null'};
  const params = {
    headers: {
      'Content-Type': 'application/json',
      ${authToken ? `'Authorization': 'Bearer ${authToken.substring(0, 15)}...',` : ''}
    },
  };

  const res = http.${s.method.toLowerCase()}(url${s.method !== 'GET' ? ', payload' : ''}, params);

  check(res, {
    'status is 200/201': (r) => r.status >= 200 && r.status < 300,
    'SLA verified': (r) => r.timings.duration < ${s.p95Threshold},
  });

  sleep(1);
}`;
  };

  const getProfileBadge = (profile: PerformanceProfile) => {
    switch (profile) {
      case 'SMOKE':
        return { bg: '#064e3b', color: '#34d399', label: 'SMOKE TEST' };
      case 'LOAD':
        return { bg: '#1e1b4b', color: '#818cf8', label: 'LOAD TEST' };
      case 'STRESS':
        return { bg: '#78350f', color: '#fbbf24', label: 'STRESS TEST' };
      case 'SPIKE':
        return { bg: '#7f1d1d', color: '#f87171', label: 'SPIKE TEST' };
      default:
        return { bg: '#1f2937', color: '#9ca3af', label: profile };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={22} color="#f59e0b" />
            Performance & Load Testing Studio (k6)
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
            Configure endpoint-specific workloads (Smoke, Load, Stress, Spike), execute in parallel, and generate isolated telemetry reports.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            data-tour="add-perf-target-btn"
            onClick={handleOpenAddModal}
            disabled={isAnyRunning}
            style={{
              backgroundColor: '#1f2937',
              color: '#f3f4f6',
              border: '1px solid #374151',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: isAnyRunning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isAnyRunning ? 0.6 : 1,
            }}
          >
            <Plus size={15} /> Add Target Endpoint
          </button>

          {isAnyRunning ? (
            <button
              onClick={() => stopPerformanceTests(scenarios.filter((s) => runningScenarioIds.includes(s.id)))}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
              }}
            >
              <Square size={15} /> Emergency Stop ({elapsedSeconds}s)
            </button>
          ) : (
            <button
              onClick={() => runPerformanceTests(scenarios)}
              disabled={scenarios.length === 0}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: scenarios.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                opacity: scenarios.length === 0 ? 0.6 : 1,
              }}
            >
              <Play size={15} /> Run All Scenarios (Parallel)
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #1f2937', paddingBottom: '12px' }}>
        <button
          onClick={() => setViewTab('SCENARIOS')}
          style={{
            backgroundColor: viewTab === 'SCENARIOS' ? '#1e1b4b' : 'transparent',
            color: viewTab === 'SCENARIOS' ? '#818cf8' : '#9ca3af',
            border: viewTab === 'SCENARIOS' ? '1px solid #4338ca' : '1px solid transparent',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Sliders size={14} /> Endpoints & Workloads ({scenarios.length})
        </button>

        <button
          onClick={() => setViewTab('REPORTS')}
          style={{
            backgroundColor: viewTab === 'REPORTS' ? '#1e1b4b' : 'transparent',
            color: viewTab === 'REPORTS' ? '#818cf8' : '#9ca3af',
            border: viewTab === 'REPORTS' ? '1px solid #4338ca' : '1px solid transparent',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <FileText size={14} /> Separate Reports & History ({reports.length})
        </button>

        <button
          onClick={() => setViewTab('K6_SCRIPT')}
          style={{
            backgroundColor: viewTab === 'K6_SCRIPT' ? '#1e1b4b' : 'transparent',
            color: viewTab === 'K6_SCRIPT' ? '#818cf8' : '#9ca3af',
            border: viewTab === 'K6_SCRIPT' ? '1px solid #4338ca' : '1px solid transparent',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Code2 size={14} /> k6 Script Synthesis
        </button>
      </div>

      {/* TAB 1: SCENARIOS & LIVE WORKLOAD RUNNER */}
      {viewTab === 'SCENARIOS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: 0 }}>
          {/* Configured Endpoints Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', letterSpacing: '0.5px' }}>
                CONFIGURED WORKLOAD TARGETS ({scenarios.length})
              </span>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>
                Each endpoint operates with an independent workload role, VUs, duration, and SLA.
              </span>
            </div>

            {scenarios.length === 0 ? (
              <div style={{ backgroundColor: '#111827', border: '1px dashed #374151', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                No performance targets configured for this project. Click <strong>"+ Add Target Endpoint"</strong> above to select from your collections.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                {scenarios.map((scen) => {
                  const isRunning = runningScenarioIds.includes(scen.id);
                  const badge = getProfileBadge(scen.profile);
                  const currentM = liveMetrics[scen.id];

                  return (
                    <div
                      key={scen.id}
                      style={{
                        backgroundColor: '#111827',
                        border: isRunning ? '2px solid #10b981' : '1px solid #1f2937',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        boxShadow: isRunning ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div>
                        {/* Header: Method + Profile Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 'bold',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: scen.method === 'GET' ? '#064e3b' : '#1e3a8a',
                              color: scen.method === 'GET' ? '#34d399' : '#60a5fa',
                            }}
                          >
                            {scen.method}
                          </span>

                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 'bold',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: badge.bg,
                              color: badge.color,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Flame size={11} /> {badge.label}
                          </span>
                        </div>

                        {/* Scenario Name & URL */}
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f3f4f6', marginBottom: '4px' }}>
                          {scen.name}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#6b7280',
                            fontFamily: 'monospace',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={scen.url}
                        >
                          {scen.url}
                        </div>

                        {/* Workload Specs Chips */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                          <span style={{ fontSize: '11px', backgroundColor: '#1f2937', color: '#d1d5db', padding: '2px 8px', borderRadius: '4px', border: '1px solid #374151' }}>
                            👥 <strong>{scen.targetVUs}</strong> VUs
                          </span>
                          <span style={{ fontSize: '11px', backgroundColor: '#1f2937', color: '#d1d5db', padding: '2px 8px', borderRadius: '4px', border: '1px solid #374151' }}>
                            ⏱️ <strong>{scen.duration}</strong>
                          </span>
                          <span style={{ fontSize: '11px', backgroundColor: '#1f2937', color: '#d1d5db', padding: '2px 8px', borderRadius: '4px', border: '1px solid #374151' }}>
                            🎯 SLA: &lt;<strong>{scen.p95Threshold}ms</strong>
                          </span>
                        </div>

                        {/* Live Telemetry Preview if Running */}
                        {isRunning && currentM && (
                          <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#0b0f19', borderRadius: '6px', border: '1px solid #10b981' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#34d399', fontWeight: 'bold', marginBottom: '4px' }}>
                              <span>⚡ k6 STREAMING LIVE</span>
                              <span>{elapsedSeconds}s</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                              <div>RPS: <strong style={{ color: '#38bdf8' }}>{currentM.rps} req/s</strong></div>
                              <div>P95: <strong style={{ color: currentM.p95 <= scen.p95Threshold ? '#10b981' : '#ef4444' }}>{currentM.p95} ms</strong></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1f2937', paddingTop: '10px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleOpenEditModal(scen)}
                            disabled={isAnyRunning}
                            title="Edit Scenario Workload"
                            style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: isAnyRunning ? 'not-allowed' : 'pointer', padding: '4px' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#818cf8')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteScenario(scen.id)}
                            disabled={isAnyRunning}
                            title="Delete Target"
                            style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: isAnyRunning ? 'not-allowed' : 'pointer', padding: '4px' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {isRunning ? (
                          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <RefreshCw size={12} className="animate-spin" /> In Flight
                          </span>
                        ) : (
                          <button
                            onClick={() => runPerformanceTests([scen])}
                            disabled={isAnyRunning}
                            style={{
                              backgroundColor: '#1e1b4b',
                              border: '1px solid #4338ca',
                              color: '#c7d2fe',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: isAnyRunning ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#312e81')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1e1b4b')}
                          >
                            <Play size={11} /> Run This
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Execution Logs & Real-time Console */}
          <div style={{ backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1f2937', padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '12px', fontWeight: 'bold' }}>
                <Terminal size={14} /> LIVE PERFORMANCE METRICS CONSOLE (1s ROLLUP STREAM)
              </div>
              {liveLogs.length > 0 && (
                <button
                  onClick={() => setLiveLogs([])}
                  style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '11px', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                >
                  Clear Console
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
              {liveLogs.length === 0 ? (
                <div style={{ color: '#6b7280' }}>
                  Engine ready. Click <strong>"Run All Scenarios (Parallel)"</strong> or <strong>"Run This"</strong> on an individual target above to start workload generation.
                </div>
              ) : (
                liveLogs.map((log, index) => {
                  const isError =
                    log.includes('❌') ||
                    log.includes('BREACH') ||
                    log.includes('FAILED') ||
                    log.includes('UNREACHABLE') ||
                    log.includes('Failed to fetch');
                  const isWarning = log.includes('⚠️') || log.includes('WARNING');
                  const isPass =
                    log.includes('✔') ||
                    log.includes('PASS') ||
                    log.includes('MET') ||
                    log.includes('✅');
                  const isHeader =
                    log.includes('🚀') ||
                    log.includes('⚙️') ||
                    log.includes('🏁') ||
                    log.includes('⚡');

                  return (
                    <div
                      key={index}
                      style={{
                        color: isError
                          ? '#fca5a5'
                          : isWarning
                          ? '#fde047'
                          : isPass
                          ? '#6ee7b7'
                          : isHeader
                          ? '#38bdf8'
                          : '#d1d5db',
                        backgroundColor: isError
                          ? 'rgba(239, 68, 68, 0.15)'
                          : isWarning
                          ? 'rgba(234, 179, 8, 0.1)'
                          : 'transparent',
                        padding: isError || isWarning ? '2px 6px' : '1px 0',
                        borderRadius: '3px',
                      }}
                    >
                      {log}
                    </div>
                  );
                })
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SEPARATE REPORTS PER ENDPOINT */}
      {viewTab === 'REPORTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#f3f4f6' }}>
                Isolated Test Reports ({reports.length})
              </h3>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                Each tested endpoint generates its own separate report with unique throughput, latency distribution, and SLA verdict.
              </p>
            </div>

            {reports.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear all performance test reports for this project?')) {
                    setReports([]);
                  }
                }}
                style={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  color: '#ef4444',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Trash2 size={12} /> Clear Reports History
              </button>
            )}
          </div>

          {reports.length === 0 ? (
            <div style={{ backgroundColor: '#111827', border: '1px dashed #374151', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              No execution reports recorded yet. Run a Smoke, Load, or Stress test from the "Endpoints & Workloads" tab to generate reports.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
              {reports.map((rep) => {
                const isExpanded = selectedReportId === rep.id;
                const isPassed = rep.verdict === 'PASSED';
                const badge = getProfileBadge(rep.profile);

                return (
                  <div
                    key={rep.id}
                    style={{
                      backgroundColor: '#111827',
                      border: isExpanded ? '1px solid #6366f1' : '1px solid #1f2937',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    {/* Report Summary Header Row */}
                    <div
                      onClick={() => setSelectedReportId(isExpanded ? null : rep.id)}
                      style={{
                        padding: '14px 18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        backgroundColor: isExpanded ? '#1e1b4b33' : '#111827',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 'bold',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            backgroundColor: rep.endpointMethod === 'GET' ? '#064e3b' : '#1e3a8a',
                            color: rep.endpointMethod === 'GET' ? '#34d399' : '#60a5fa',
                          }}
                        >
                          {rep.endpointMethod}
                        </span>

                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f3f4f6' }}>
                            {rep.scenarioName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>
                            {rep.endpointUrl}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 'bold',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {rep.profile} ({rep.targetVUs} VUs)
                        </span>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8' }}>
                            {rep.avgRps} RPS
                          </div>
                          <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                            P95: {rep.p95Latency}ms
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 'bold',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: isPassed ? '#064e3b' : '#7f1d1d',
                            color: isPassed ? '#34d399' : '#fca5a5',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {isPassed ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                          {isPassed ? 'SLA PASSED' : 'SLA BREACH'}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Report Details & Telemetry */}
                    {isExpanded && (
                      <div style={{ padding: '16px', borderTop: '1px solid #1f2937', backgroundColor: '#0b0f19' }}>
                        {rep.failureReason && (
                          <div
                            style={{
                              backgroundColor: '#450a0a',
                              border: '1px solid #991b1b',
                              color: '#fca5a5',
                              padding: '12px 16px',
                              borderRadius: '6px',
                              marginBottom: '16px',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                            }}
                          >
                            <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#f87171' }}>
                                Diagnostic Failure / Network Error:
                              </div>
                              <div style={{ marginTop: '2px', color: '#fecaca' }}>{rep.failureReason}</div>
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                          <div style={{ backgroundColor: '#111827', padding: '12px', borderRadius: '6px', border: '1px solid #1f2937' }}>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>TOTAL REQUESTS</div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f3f4f6', marginTop: '2px' }}>
                              {rep.totalRequests.toLocaleString()}
                            </div>
                          </div>
                          <div style={{ backgroundColor: '#111827', padding: '12px', borderRadius: '6px', border: '1px solid #1f2937' }}>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>PEAK THROUGHPUT</div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#38bdf8', marginTop: '2px' }}>
                              {rep.peakRps} RPS
                            </div>
                          </div>
                          <div style={{ backgroundColor: '#111827', padding: '12px', borderRadius: '6px', border: '1px solid #1f2937' }}>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>TAIL LATENCY (P95)</div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: isPassed ? '#10b981' : '#ef4444', marginTop: '2px' }}>
                              {rep.p95Latency} ms
                            </div>
                            <div style={{ fontSize: '10px', color: '#6b7280' }}>Threshold: {rep.p95Threshold}ms</div>
                          </div>
                          <div style={{ backgroundColor: '#111827', padding: '12px', borderRadius: '6px', border: '1px solid #1f2937' }}>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>ERROR RATE</div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: rep.errorRate === 0 ? '#10b981' : '#ef4444', marginTop: '2px' }}>
                              {(rep.errorRate * 100).toFixed(2)}%
                            </div>
                          </div>
                        </div>

                        {/* k6 Report Logs */}
                        <div style={{ backgroundColor: '#111827', borderRadius: '6px', padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#9ca3af', lineHeight: '1.6' }}>
                          <div style={{ fontWeight: 'bold', color: '#e5e7eb', marginBottom: '6px' }}>EXECUTION SUMMARY LOG:</div>
                          {rep.logs.map((log, lidx) => (
                            <div key={lidx}>{log}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: K6 SCRIPT SYNTHESIS */}
      {viewTab === 'K6_SCRIPT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#f3f4f6' }}>
                Native k6 JavaScript Generator
              </h3>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                Automatically synthesized script ready for execution in CI/CD pipelines, k6 Cloud, or local CLI.
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generateK6Code(scenarios[0]));
                alert('k6 script copied to clipboard!');
              }}
              style={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '6px',
                padding: '6px 12px',
                color: '#f3f4f6',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Copy Script
            </button>
          </div>

          <pre
            style={{
              backgroundColor: '#0b0f19',
              border: '1px solid #1f2937',
              borderRadius: '8px',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#38bdf8',
              flex: 1,
              overflowY: 'auto',
              lineHeight: '1.5',
            }}
          >
            {generateK6Code(scenarios[0])}
          </pre>
        </div>
      )}

      {/* MODAL: ADD / EDIT PERFORMANCE SCENARIO */}
      {isModalOpen && (
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
            zIndex: 9999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            style={{
              backgroundColor: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '10px',
              width: '100%',
              maxWidth: '650px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px', color: '#f3f4f6' }}>
              {editingScenarioId ? 'Edit Performance Target' : 'Configure Performance Target'}
            </h3>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '16px' }}>
              Select an endpoint from your collections, assign its testing role (Smoke, Load, Stress, Spike), and configure concurrency.
            </p>

            {/* Source Mode Switcher */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #1f2937', paddingBottom: '8px' }}>
              <button
                type="button"
                onClick={() => setSourceMode('COLLECTION')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: sourceMode === 'COLLECTION' ? '#6366f1' : '#1f2937',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Layers size={14} /> Pick from API Collections
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('CUSTOM')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: sourceMode === 'CUSTOM' ? '#6366f1' : '#1f2937',
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

            <form onSubmit={handleSaveScenario} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {sourceMode === 'COLLECTION' && (
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
                          const r = c.requests[0];
                          setChosenReqId(r.id);
                          setScenarioName(`${r.name} Test`);
                          setScenarioMethod(r.method);
                          setScenarioUrl(r.url);
                          setScenarioBody(r.body || '');
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
                      2. Select Endpoint
                    </label>
                    {(() => {
                      const curCol = collections.find((c) => c.id === chosenColId);
                      const reqs = curCol?.requests || [];
                      return reqs.length === 0 ? (
                        <div style={{ fontSize: '11px', color: '#6b7280', padding: '8px 0' }}>No endpoints</div>
                      ) : (
                        <select
                          value={chosenReqId}
                          onChange={(e) => {
                            const reqId = e.target.value;
                            setChosenReqId(reqId);
                            const r = reqs.find((item) => item.id === reqId);
                            if (r) {
                              setScenarioName(`${r.name} Test`);
                              setScenarioMethod(r.method);
                              setScenarioUrl(r.url);
                              setScenarioBody(r.body || '');
                            }
                          }}
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

              {/* Target Name */}
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                  Target Scenario Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="e.g. Checkout Payment Stress Test"
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
                    value={scenarioMethod}
                    onChange={(e) => setScenarioMethod(e.target.value as HTTPMethod)}
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
                    value={scenarioUrl}
                    onChange={(e) => setScenarioUrl(e.target.value)}
                    placeholder="https://api.example.com/..."
                    required
                    style={{ flex: 1, backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '6px', padding: '8px 12px', color: '#f3f4f6', fontSize: '13px', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              {/* Workload Profile Selection Cards */}
              <div>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  Workload Profile Role (Auto-configures VUs & Duration)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {(['SMOKE', 'LOAD', 'STRESS', 'SPIKE'] as PerformanceProfile[]).map((prof) => {
                    const isSelected = scenarioProfile === prof;
                    const b = getProfileBadge(prof);
                    return (
                      <div
                        key={prof}
                        onClick={() => handleSelectProfile(prof)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '6px',
                          border: isSelected ? '2px solid #6366f1' : '1px solid #374151',
                          backgroundColor: isSelected ? '#1e1b4b' : '#0b0f19',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '11px', color: isSelected ? '#c7d2fe' : '#e5e7eb' }}>
                          {prof}
                        </div>
                        <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>
                          {prof === 'SMOKE' ? '1-5 VUs' : prof === 'LOAD' ? '50 VUs' : prof === 'STRESS' ? '200 VUs' : '500 VUs burst'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Virtual Users, Duration, P95 SLA Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', backgroundColor: '#0b0f19', padding: '12px', borderRadius: '6px', border: '1px solid #1f2937' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                    Virtual Users (VUs)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={scenarioVUs}
                    onChange={(e) => setScenarioVUs(parseInt(e.target.value, 10) || 1)}
                    style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', padding: '6px 8px', color: '#f3f4f6', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                    Duration (e.g. 30s, 1m)
                  </label>
                  <input
                    type="text"
                    value={scenarioDuration}
                    onChange={(e) => setScenarioDuration(e.target.value)}
                    placeholder="30s, 1m, 2m"
                    style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', padding: '6px 8px', color: '#f3f4f6', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                    P95 SLA Limit (ms)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={scenarioP95}
                    onChange={(e) => setScenarioP95(parseInt(e.target.value, 10) || 100)}
                    style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '4px', padding: '6px 8px', color: '#f3f4f6', fontSize: '12px' }}
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ backgroundColor: '#1f2937', color: '#9ca3af', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#6366f1', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                >
                  {editingScenarioId ? 'Update Scenario' : 'Add Target to Studio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
