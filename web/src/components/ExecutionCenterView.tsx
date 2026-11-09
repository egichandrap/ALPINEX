import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Server,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Terminal,
  Zap,
  Play
} from 'lucide-react';
import { ProjectItem } from '../types/auth';

interface ExecutionRecord {
  id: string;
  projectId: string;
  testType: 'FUNCTIONAL' | 'PERFORMANCE';
  targetName: string;
  engine: 'NATIVE_HTTP' | 'k6';
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  duration: string;
  trigger: 'USER_UI' | 'CI_CD' | 'SCHEDULED';
  verdict: 'PASSED' | 'FAILED' | 'BREACH';
  timestamp: string;
  logs?: string[];
}

interface ExecutionCenterViewProps {
  activeProject?: ProjectItem;
  onNavigateTab?: (tab: 'functional' | 'performance') => void;
}

export const ExecutionCenterView: React.FC<ExecutionCenterViewProps> = ({
  activeProject,
  onNavigateTab,
}) => {
  const getExecKey = (projId: string) => `alpinex_executions_${projId}`;

  const [executions, setExecutions] = useState<ExecutionRecord[]>(() => {
    try {
      const key = getExecKey(activeProject?.id || 'proj-default');
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load executions', e);
    }
    return [];
  });

  const [filterType, setFilterType] = useState<'ALL' | 'FUNCTIONAL' | 'PERFORMANCE'>('ALL');
  const [selectedExecId, setSelectedExecId] = useState<string | null>(null);

  // Sync when activeProject changes
  useEffect(() => {
    try {
      const key = getExecKey(activeProject?.id || 'proj-default');
      const saved = localStorage.getItem(key);
      if (saved) {
        setExecutions(JSON.parse(saved));
      } else {
        setExecutions([]);
      }
    } catch (e) {
      console.error('Failed to load executions for project', e);
      setExecutions([]);
    }
  }, [activeProject?.id]);

  const filtered = executions.filter((ex) => {
    if (filterType === 'ALL') return true;
    return ex.testType === filterType;
  });

  const totalRuns = executions.length;
  const passedRuns = executions.filter((ex) => ex.verdict === 'PASSED').length;
  const passRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>
      {/* Top Header & Architectural Description */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={22} color="#6366f1" />
            Execution Center & Distributed Queue
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px', maxWidth: '750px', lineHeight: '1.5' }}>
            Centralized monitoring hub for asynchronous test executions. Jobs triggered from the UI, CLI, or CI/CD pipelines
            are dispatched via Redis broker and processed by distributed Go worker nodes (<code>alpinex-worker</code>).
          </p>
        </div>

        {totalRuns > 0 && (
          <button
            onClick={() => {
              if (confirm('Clear execution history for this project?')) {
                setExecutions([]);
                localStorage.removeItem(getExecKey(activeProject?.id || 'proj-default'));
              }
            }}
            style={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px',
              padding: '6px 12px',
              color: '#9ca3af',
              fontSize: '12px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
          >
            Clear History
          </button>
        )}
      </div>

      {/* Cluster & Worker Status KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '14px', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={14} color="#6366f1" /> WORKER NODE
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6', marginTop: '4px' }}>
            alpinex-worker
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            Go Engine Online
          </div>
        </div>

        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '14px', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Server size={14} color="#38bdf8" /> TASK BROKER
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6', marginTop: '4px' }}>
            Redis Cluster
          </div>
          <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
            Queue Ready (0 in queue)
          </div>
        </div>

        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '14px', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={14} color="#a855f7" /> TOTAL EXECUTIONS
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f3f4f6', marginTop: '2px' }}>
            {totalRuns} Runs
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
            {activeProject?.name || 'Active Project'}
          </div>
        </div>

        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '14px', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} color="#10b981" /> SUCCESS RATE
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: passRate >= 90 ? '#10b981' : '#f59e0b', marginTop: '2px' }}>
            {totalRuns > 0 ? `${passRate}%` : '—'}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
            {totalRuns > 0 ? `${passedRuns}/${totalRuns} passed` : 'No test runs yet'}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #1f2937', paddingBottom: '8px' }}>
        {(['ALL', 'FUNCTIONAL', 'PERFORMANCE'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            style={{
              backgroundColor: filterType === t ? '#1f2937' : 'transparent',
              color: filterType === t ? '#f3f4f6' : '#9ca3af',
              border: filterType === t ? '1px solid #374151' : '1px solid transparent',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {t === 'ALL' ? `All (${executions.length})` : t === 'FUNCTIONAL' ? 'Functional Suites' : 'Performance (k6)'}
          </button>
        ))}
      </div>

      {/* Execution Table or Empty State */}
      {filtered.length === 0 ? (
        <div
          style={{
            backgroundColor: '#111827',
            border: '1px dashed #374151',
            borderRadius: '8px',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <Activity size={40} color="#6366f1" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6' }}>
            No Background Executions in History
          </h3>
          <p style={{ fontSize: '13px', color: '#9ca3af', maxWidth: '520px', margin: '8px auto 0', lineHeight: '1.6' }}>
            Automated test suites and performance load jobs executed in <strong>Functional Suites</strong> or{' '}
            <strong>Performance Studio</strong> will appear here along with background jobs triggered via CI/CD pipelines.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
            {onNavigateTab && (
              <>
                <button
                  onClick={() => onNavigateTab('functional')}
                  style={{
                    backgroundColor: '#1e1b4b',
                    border: '1px solid #4338ca',
                    color: '#c7d2fe',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Play size={13} /> Open Functional Suites
                </button>
                <button
                  onClick={() => onNavigateTab('performance')}
                  style={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    color: '#f3f4f6',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Zap size={13} color="#f59e0b" /> Open Performance Studio
                </button>
              </>
            )}
          </div>

          <div
            style={{
              backgroundColor: '#0b0f19',
              borderRadius: '6px',
              border: '1px solid #1f2937',
              maxWidth: '600px',
              margin: '24px auto 0',
              padding: '12px 16px',
              textAlign: 'left',
              fontFamily: 'monospace',
              fontSize: '11px',
              color: '#9ca3af',
            }}
          >
            <div style={{ color: '#6366f1', fontWeight: 'bold', marginBottom: '4px' }}>
              # Trigger async execution via CI/CD Webhook / API:
            </div>
            <code>
              curl -X POST http://localhost:8080/api/v1/executions \<br />
              &nbsp;&nbsp;-H "Authorization: Bearer &lt;TOKEN&gt;" \<br />
              &nbsp;&nbsp;-d '&#123;"projectID": "{activeProject?.id || 'proj-default'}", "testType": "PERFORMANCE", "engineName": "k6"&#125;'
            </code>
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1f2937', color: '#9ca3af', backgroundColor: '#0b0f19' }}>
                <th style={{ padding: '12px 14px' }}>Execution ID</th>
                <th>Type</th>
                <th>Target</th>
                <th>Engine</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Trigger</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ex) => (
                <tr
                  key={ex.id}
                  style={{
                    borderBottom: '1px solid #1f2937',
                    cursor: 'pointer',
                    backgroundColor: selectedExecId === ex.id ? '#1e1b4b33' : 'transparent',
                  }}
                  onClick={() => setSelectedExecId(selectedExecId === ex.id ? null : ex.id)}
                >
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#818cf8', fontWeight: 'bold' }}>
                    {ex.id}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backgroundColor: ex.testType === 'FUNCTIONAL' ? '#064e3b' : '#78350f',
                        color: ex.testType === 'FUNCTIONAL' ? '#34d399' : '#f59e0b',
                      }}
                    >
                      {ex.testType}
                    </span>
                  </td>
                  <td style={{ color: '#f3f4f6', fontWeight: '500' }}>{ex.targetName}</td>
                  <td style={{ color: '#9ca3af', fontFamily: 'monospace', fontSize: '12px' }}>{ex.engine}</td>
                  <td>
                    <span
                      style={{
                        backgroundColor: ex.status === 'COMPLETED' ? '#064e3b' : ex.status === 'RUNNING' ? '#1e3a8a' : '#7f1d1d',
                        color: ex.status === 'COMPLETED' ? '#34d399' : ex.status === 'RUNNING' ? '#60a5fa' : '#fca5a5',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}
                    >
                      {ex.status}
                    </span>
                  </td>
                  <td style={{ color: '#9ca3af' }}>{ex.duration}</td>
                  <td style={{ color: '#6b7280', fontSize: '11px' }}>{ex.trigger}</td>
                  <td>
                    <span
                      style={{
                        color: ex.verdict === 'PASSED' ? '#10b981' : '#ef4444',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {ex.verdict === 'PASSED' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      {ex.verdict}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
