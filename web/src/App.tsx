import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Layers,
  CheckCircle2,
  Zap,
  Activity,
  FileBarChart,
  Send,
  Play,
  Square,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Folder,
  Plus,
  Trash2,
  RefreshCw,
  LogOut,
  User as UserIcon,
  Edit2,
  Save,
  Sliders,
  Check,
  Sparkles,
  FileText
} from 'lucide-react';
import { CollectionItem, RequestItem, HeaderItem, HTTPMethod } from './types/collection';
import { UserProfile, ProjectItem } from './types/auth';
import { AddCollectionModal } from './components/AddCollectionModal';
import { RequestConfigModal } from './components/RequestConfigModal';
import { LoginPage } from './components/LoginPage';
import { ProjectSwitcher } from './components/ProjectSwitcher';
import { FunctionalSuitesView } from './components/FunctionalSuitesView';
import { ReportsView } from './components/ReportsView';

interface MetricPoint {
  time: string;
  vus: number;
  rps: number;
  p95: number;
  errorRate: number;
}

const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-sample',
    workspaceId: 'ws-default',
    name: 'E-Commerce Demo',
    description: 'Core storefront and e-commerce endpoints',
  },
];

const DEFAULT_COLLECTIONS: CollectionItem[] = [
  {
    id: 'col-storefront',
    name: 'Storefront API',
    description: 'Core e-commerce storefront endpoints',
    baseUrl: 'http://localhost:8080',
    createdAt: new Date().toISOString(),
    requests: [
      {
        id: 'req-health',
        name: 'Healthcheck',
        method: 'GET',
        url: 'http://localhost:8080/health',
        bodyType: 'NONE',
        body: '',
        description: 'System health probe and telemetry endpoint',
      },
      {
        id: 'req-auth',
        name: 'Auth Login',
        method: 'POST',
        url: 'http://localhost:8080/api/v1/auth/login',
        bodyType: 'JSON',
        body: '{\n  "email": "admin",\n  "password": "admin"\n}',
        description: 'Authentication token issuer',
      },
      {
        id: 'req-projects',
        name: 'Projects',
        method: 'GET',
        url: 'http://localhost:8080/api/v1/workspaces/ws-default/projects',
        bodyType: 'NONE',
        body: '',
        description: 'List user projects and collections',
      },
    ],
  },
];

const getMethodBadgeStyle = (method: string) => {
  switch (method) {
    case 'GET':
      return { bg: '#064e3b', color: '#34d399' };
    case 'POST':
      return { bg: '#1e3a8a', color: '#60a5fa' };
    case 'PUT':
      return { bg: '#78350f', color: '#fbbf24' };
    case 'DELETE':
      return { bg: '#450a0a', color: '#f87171' };
    case 'PATCH':
      return { bg: '#3b0764', color: '#c084fc' };
    default:
      return { bg: '#1f2937', color: '#9ca3af' };
  }
};

const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.location.port === '5173') {
    return 'http://localhost:8080';
  }
  return '';
};

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('alpinex_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('alpinex_auth_token');
  });

  // Projects State
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    try {
      const saved = localStorage.getItem('alpinex_projects');
      return saved ? JSON.parse(saved) : DEFAULT_PROJECTS;
    } catch {
      return DEFAULT_PROJECTS;
    }
  });

  const [activeProject, setActiveProject] = useState<ProjectItem>(() => {
    try {
      const saved = localStorage.getItem('alpinex_active_project');
      return saved ? JSON.parse(saved) : DEFAULT_PROJECTS[0];
    } catch {
      return DEFAULT_PROJECTS[0];
    }
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'api' | 'functional' | 'performance' | 'executions' | 'reports'>('api');
  
  // Collections State
  const [collections, setCollections] = useState<CollectionItem[]>(() => {
    try {
      const saved = localStorage.getItem('alpinex_collections');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load collections from localStorage', e);
    }
    return DEFAULT_COLLECTIONS;
  });

  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({
    'col-storefront': true,
  });
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>('req-health');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Sync projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('alpinex_projects', JSON.stringify(projects));
      localStorage.setItem('alpinex_active_project', JSON.stringify(activeProject));
    } catch (e) {
      console.error('Failed to persist projects to localStorage', e);
    }
  }, [projects, activeProject]);

  // Sync collections to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('alpinex_collections', JSON.stringify(collections));
    } catch (e) {
      console.error('Failed to persist collections to localStorage', e);
    }
  }, [collections]);

  // Fetch dynamic projects from API if logged in
  useEffect(() => {
    if (!authToken) return;
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/v1/workspaces/ws-default/projects`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const json = await res.json();
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped: ProjectItem[] = json.data.map((p: any) => ({
            id: p.ID || p.id,
            workspaceId: p.WorkspaceID || p.workspace_id,
            name: p.Name || p.name,
            description: p.Description || p.description || '',
          }));
          setProjects(mapped);
          if (!mapped.some((p) => p.id === activeProject.id)) {
            setActiveProject(mapped[0]);
          }
        }
      } catch (err) {
        console.warn('Using cached projects', err);
      }
    };
    fetchProjects();
  }, [authToken]);

  // API Builder State
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('http://localhost:8080/health');
  const [requestBody, setRequestBody] = useState('{\n  "name": "Test Payload"\n}');
  const [activeHeaders, setActiveHeaders] = useState<HeaderItem[]>([
    { key: 'Content-Type', value: 'application/json', enabled: true },
  ]);
  const [builderTab, setBuilderTab] = useState<'headers' | 'body'>('headers');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [env, setEnv] = useState('Development');

  // Request Config Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestModalColId, setRequestModalColId] = useState<string | null>(null);
  const [editingRequest, setEditingRequest] = useState<RequestItem | null>(null);

  // Performance Test State
  const [perfTestType, setPerfTestType] = useState('LOAD');
  const [targetVUs, setTargetVUs] = useState(50);
  const [duration, setDuration] = useState('1m');
  const [p95Threshold, setP95Threshold] = useState('500');
  const [isRunningPerf, setIsRunningPerf] = useState(false);
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);

  // Auth Handlers
  const handleLoginSuccess = (user: UserProfile, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('alpinex_user', JSON.stringify(user));
    localStorage.setItem('alpinex_auth_token', token);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('alpinex_user');
    localStorage.removeItem('alpinex_auth_token');
  };

  // Create Project Handler
  const handleCreateProject = async (name: string, description: string) => {
    const newProj: ProjectItem = {
      id: `proj-${Math.random().toString(36).substring(2, 9)}`,
      workspaceId: 'ws-default',
      name,
      description,
    };

    if (authToken) {
      try {
        const res = await fetch(`${getApiUrl()}/api/v1/projects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            workspace_id: 'ws-default',
            name,
            description,
          }),
        });
        const json = await res.json();
        if (json?.success && json.data?.ID) {
          newProj.id = json.data.ID;
        }
      } catch (err) {
        console.warn('Backend project creation fallback to local', err);
      }
    }

    setProjects((prev) => [...prev, newProj]);
    setActiveProject(newProj);
  };

  // Find active request and its containing collection
  const activeContext = React.useMemo(() => {
    for (const col of collections) {
      const found = col.requests.find((r) => r.id === selectedRequestId);
      if (found) return { collection: col, request: found };
    }
    return null;
  }, [collections, selectedRequestId]);

  const targetModalCollection = collections.find((c) => c.id === requestModalColId) || collections[0] || {
    id: 'col-default',
    name: 'Collection',
    requests: [],
    createdAt: new Date().toISOString(),
  };

  // Open modal to add new request to collection
  const handleOpenAddRequestModal = (colId: string) => {
    setRequestModalColId(colId);
    setEditingRequest(null);
    setIsRequestModalOpen(true);
  };

  // Open modal to edit existing request
  const handleOpenEditRequestModal = (colId: string, req: RequestItem) => {
    setRequestModalColId(colId);
    setEditingRequest(req);
    setIsRequestModalOpen(true);
  };

  // Save request from modal (create or update)
  const handleSaveRequestFromModal = (colId: string, savedReq: RequestItem) => {
    setCollections((prev) =>
      prev.map((col) => {
        if (col.id === colId) {
          const exists = col.requests.some((r) => r.id === savedReq.id);
          const updatedRequests = exists
            ? col.requests.map((r) => (r.id === savedReq.id ? savedReq : r))
            : [...col.requests, savedReq];
          return { ...col, requests: updatedRequests };
        }
        return col;
      })
    );
    // Expand collection and select the request
    setExpandedCollections((prev) => ({ ...prev, [colId]: true }));
    handleSelectRequest(savedReq);
  };

  // Delete a request from a collection
  const handleDeleteRequest = (colId: string, reqId: string) => {
    if (!confirm('Are you sure you want to delete this endpoint?')) return;
    setCollections((prev) =>
      prev.map((col) => {
        if (col.id === colId) {
          return {
            ...col,
            requests: col.requests.filter((r) => r.id !== reqId),
          };
        }
        return col;
      })
    );
    if (selectedRequestId === reqId) {
      setSelectedRequestId(null);
    }
  };

  // Save modifications made directly in Request Builder
  const handleSaveCurrentRequest = () => {
    if (!selectedRequestId || !activeContext) return;
    setCollections((prev) =>
      prev.map((col) => {
        if (col.id === activeContext.collection.id) {
          return {
            ...col,
            requests: col.requests.map((r) => {
              if (r.id === selectedRequestId) {
                return {
                  ...r,
                  method: method as HTTPMethod,
                  url,
                  body: requestBody,
                  headers: activeHeaders,
                };
              }
              return r;
            }),
          };
        }
        return col;
      })
    );
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Builder Header helpers
  const handleAddHeaderToBuilder = () => {
    setActiveHeaders((prev) => [...prev, { key: '', value: '', enabled: true }]);
  };

  const handleUpdateHeaderInBuilder = (index: number, field: keyof HeaderItem, value: any) => {
    setActiveHeaders((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveHeaderFromBuilder = (index: number) => {
    setActiveHeaders((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyPresetInBuilder = (key: string, value: string) => {
    setActiveHeaders((prev) => {
      const existing = prev.findIndex((h) => h.key.toLowerCase() === key.toLowerCase());
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = { key, value, enabled: true };
        return copy;
      }
      return [...prev, { key, value, enabled: true }];
    });
  };

  const handleBeautifyJson = () => {
    try {
      const parsed = JSON.parse(requestBody);
      setRequestBody(JSON.stringify(parsed, null, 2));
    } catch {
      // ignore invalid json
    }
  };

  // Select request from collection tree
  const handleSelectRequest = (req: RequestItem) => {
    setSelectedRequestId(req.id);
    setMethod(req.method);
    setUrl(req.url);
    setRequestBody(req.body || '');
    if (req.headers && req.headers.length > 0) {
      setActiveHeaders(req.headers.map((h) => ({ ...h })));
    } else {
      setActiveHeaders([{ key: 'Content-Type', value: 'application/json', enabled: true }]);
    }
  };

  // Toggle collection expand/collapse
  const toggleExpand = (colId: string) => {
    setExpandedCollections((prev) => ({
      ...prev,
      [colId]: !prev[colId],
    }));
  };

  // Add new collection from modal
  const handleAddCollection = (newCol: CollectionItem) => {
    setCollections((prev) => [newCol, ...prev]);
    setExpandedCollections((prev) => ({
      ...prev,
      [newCol.id]: true,
    }));
    if (newCol.requests.length > 0) {
      handleSelectRequest(newCol.requests[0]);
    }
  };

  // Delete a collection
  const handleDeleteCollection = (e: React.MouseEvent, colId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this collection?')) {
      setCollections((prev) => prev.filter((c) => c.id !== colId));
    }
  };

  // Send Single API Request
  const handleSendRequest = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      let resolvedUrl = url.trim();
      if (resolvedUrl.includes('{{base_url}}')) {
        const base = activeContext?.collection.baseUrl || 'http://localhost:8080';
        resolvedUrl = resolvedUrl.replace(/\{\{base_url\}\}/g, base.replace(/\/$/, ''));
      }

      const headers: Record<string, string> = {};
      activeHeaders.forEach((h) => {
        if (h.enabled && h.key.trim()) {
          headers[h.key.trim()] = h.value;
        }
      });

      if (!headers['Content-Type'] && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        headers['Content-Type'] = 'application/json';
      }
      if (authToken && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(resolvedUrl, {
        method,
        headers,
        body: method !== 'GET' && method !== 'HEAD' && requestBody.trim() ? requestBody : undefined,
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

  // Auth Gate: Render Login Page if user is not authenticated
  if (!currentUser || !authToken) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#0b0f19', color: '#f3f4f6' }}>
      {/* Add Collection Modal */}
      <AddCollectionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCollection={handleAddCollection}
      />

      {/* Request Config Modal (Add / Edit) */}
      <RequestConfigModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        collectionId={targetModalCollection.id}
        collectionName={targetModalCollection.name}
        initialRequest={editingRequest}
        onSave={handleSaveRequestFromModal}
      />

      {/* Sidebar */}
      <aside style={{ width: '260px', backgroundColor: '#111827', borderRight: '1px solid #1f2937', display: 'flex', flexDirection: 'column' }}>
        {/* Brand Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
            ▲
          </div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '0.5px' }}>ALPINEX</h1>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>v1.0.2 • Community</span>
          </div>
        </div>

        {/* Dynamic Project Switcher */}
        <ProjectSwitcher
          activeProject={activeProject}
          projects={projects}
          onSelectProject={setActiveProject}
          onCreateProject={handleCreateProject}
        />

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

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '4px 10px', backgroundColor: '#1e293b', borderRadius: '12px', color: '#38bdf8' }}>
              <ShieldCheck size={14} />
              <span>SSRF Protected</span>
            </div>

            {/* Authenticated User Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid #1f2937', paddingLeft: '14px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#6366f1',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                {currentUser.full_name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase() || 'AD'}
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#f3f4f6' }}>
                  {currentUser.full_name}
                </div>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                  {currentUser.email}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                title="Log Out"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '4px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.backgroundColor = '#1f2937';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#9ca3af';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Views */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {activeTab === 'api' && (
            <div style={{ display: 'flex', height: '100%', gap: '20px' }}>
              {/* Collection Tree Pane */}
              <div style={{ width: '280px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1f2937', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', letterSpacing: '0.5px' }}>COLLECTIONS</span>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    title="Add Collection (Manual, Postman, Swagger)"
                    style={{
                      background: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '4px',
                      color: '#f3f4f6',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#374151';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1f2937';
                    }}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>

                {/* Collections List */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {collections.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 12px', color: '#6b7280' }}>
                      <Folder size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                      <div style={{ fontSize: '12px', marginBottom: '12px' }}>No collections yet</div>
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        style={{
                          backgroundColor: '#6366f1',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Create or Import
                      </button>
                    </div>
                  ) : (
                    collections.map((col) => {
                      const isExpanded = expandedCollections[col.id] ?? true;
                      return (
                        <div
                          key={col.id}
                          style={{
                            backgroundColor: '#0b0f19',
                            borderRadius: '6px',
                            border: '1px solid #1f2937',
                            overflow: 'hidden',
                          }}
                        >
                          {/* Collection Header */}
                          <div
                            onClick={() => toggleExpand(col.id)}
                            style={{
                              padding: '10px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              backgroundColor: '#161e2e',
                              userSelect: 'none',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                              {isExpanded ? <ChevronDown size={14} color="#9ca3af" /> : <ChevronRight size={14} color="#9ca3af" />}
                              <Folder size={15} color="#818cf8" />
                              <span
                                style={{
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: '#f3f4f6',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {col.name}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  padding: '1px 5px',
                                  borderRadius: '10px',
                                  backgroundColor: '#1e293b',
                                  color: '#9ca3af',
                                }}
                              >
                                {col.requests.length}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAddRequestModal(col.id);
                                }}
                                title="Add endpoint to collection"
                                style={{
                                  background: '#1f2937',
                                  border: '1px solid #374151',
                                  color: '#f3f4f6',
                                  cursor: 'pointer',
                                  padding: '2px 5px',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '11px',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#374151';
                                  e.currentTarget.style.color = '#818cf8';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#1f2937';
                                  e.currentTarget.style.color = '#f3f4f6';
                                }}
                              >
                                <Plus size={12} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteCollection(e, col.id)}
                                title="Delete collection"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#6b7280',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Requests List */}
                          {isExpanded && (
                            <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {col.requests.length === 0 ? (
                                <div style={{ fontSize: '11px', color: '#6b7280', padding: '6px 8px', fontStyle: 'italic' }}>
                                  No requests inside
                                </div>
                              ) : (
                                col.requests.map((req) => {
                                  const isSelected = selectedRequestId === req.id;
                                  const badge = getMethodBadgeStyle(req.method);
                                  return (
                                    <div
                                      key={req.id}
                                      onClick={() => handleSelectRequest(req)}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '12px',
                                        padding: '6px 8px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        backgroundColor: isSelected ? '#1e293b' : 'transparent',
                                        border: isSelected ? '1px solid #3b82f6' : '1px solid transparent',
                                        transition: 'background-color 0.15s',
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontWeight: 'bold',
                                          fontSize: '9px',
                                          padding: '2px 4px',
                                          borderRadius: '3px',
                                          backgroundColor: badge.bg,
                                          color: badge.color,
                                          minWidth: '28px',
                                          textAlign: 'center',
                                        }}
                                      >
                                        {req.method}
                                      </span>
                                      <span
                                        style={{
                                          color: isSelected ? '#f3f4f6' : '#d1d5db',
                                          fontWeight: isSelected ? '600' : '400',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          flex: 1,
                                        }}
                                      >
                                        {req.name}
                                      </span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenEditRequestModal(col.id, req);
                                          }}
                                          title="Configure / Edit endpoint"
                                          style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#6b7280',
                                            cursor: 'pointer',
                                            padding: '2px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            borderRadius: '3px',
                                          }}
                                          onMouseEnter={(e) => (e.currentTarget.style.color = '#818cf8')}
                                          onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                                        >
                                          <Edit2 size={12} />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteRequest(col.id, req.id);
                                          }}
                                          title="Delete endpoint"
                                          style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#6b7280',
                                            cursor: 'pointer',
                                            padding: '2px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            borderRadius: '3px',
                                          }}
                                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                                          onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Request Builder & Response Pane */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Active Request Info Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', padding: '10px 16px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    {activeContext?.collection && (
                      <span style={{ fontSize: '11px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Folder size={12} color="#818cf8" /> {activeContext.collection.name} <ChevronRight size={12} />
                      </span>
                    )}
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#f3f4f6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activeContext?.request.name || 'Ad-hoc Request'}
                    </span>
                    {activeContext?.request.description && (
                      <span style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        — {activeContext.request.description}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {activeContext && (
                      <button
                        onClick={() => handleOpenEditRequestModal(activeContext.collection.id, activeContext.request)}
                        title="Configure endpoint settings (headers, body, params)"
                        style={{
                          backgroundColor: '#1f2937',
                          color: '#d1d5db',
                          border: '1px solid #374151',
                          borderRadius: '4px',
                          padding: '5px 10px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#374151';
                          e.currentTarget.style.color = '#818cf8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#1f2937';
                          e.currentTarget.style.color = '#d1d5db';
                        }}
                      >
                        <Sliders size={13} />
                        Configure Endpoint
                      </button>
                    )}
                    {activeContext && (
                      <button
                        onClick={handleSaveCurrentRequest}
                        title="Save changes to collection"
                        style={{
                          backgroundColor: saveSuccess ? '#065f46' : '#1f2937',
                          color: saveSuccess ? '#34d399' : '#f3f4f6',
                          border: `1px solid ${saveSuccess ? '#059669' : '#374151'}`,
                          borderRadius: '4px',
                          padding: '5px 12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {saveSuccess ? <Check size={13} /> : <Save size={13} />}
                        {saveSuccess ? 'Saved!' : 'Save'}
                      </button>
                    )}
                  </div>
                </div>

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
                    <option>HEAD</option>
                    <option>OPTIONS</option>
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

                {/* Request Tabs (Headers | Body) */}
                <div style={{ backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1f2937', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #1f2937', paddingBottom: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => setBuilderTab('headers')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: builderTab === 'headers' ? '2px solid #6366f1' : '2px solid transparent',
                        color: builderTab === 'headers' ? '#f3f4f6' : '#9ca3af',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Sliders size={13} />
                      Headers ({activeHeaders.filter((h) => h.enabled && h.key).length})
                    </button>
                    <button
                      onClick={() => setBuilderTab('body')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: builderTab === 'body' ? '2px solid #6366f1' : '2px solid transparent',
                        color: builderTab === 'body' ? '#f3f4f6' : '#9ca3af',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <FileText size={13} />
                      Body (JSON/Raw)
                    </button>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                      {builderTab === 'headers' ? (
                        <>
                          <button
                            onClick={() => handleApplyPresetInBuilder('Content-Type', 'application/json')}
                            style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#1f2937', color: '#d1d5db', border: '1px solid #374151', cursor: 'pointer' }}
                          >
                            + JSON
                          </button>
                          <button
                            onClick={() => handleApplyPresetInBuilder('Authorization', 'Bearer {{auth_token}}')}
                            style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#1f2937', color: '#d1d5db', border: '1px solid #374151', cursor: 'pointer' }}
                          >
                            + Bearer
                          </button>
                          <button
                            onClick={handleAddHeaderToBuilder}
                            style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#374151', color: '#f3f4f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                          >
                            <Plus size={11} /> Add Header
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleBeautifyJson}
                          style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#1f2937', color: '#a5f3fc', border: '1px solid #374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Sparkles size={11} /> Format JSON
                        </button>
                      )}
                    </div>
                  </div>

                  {builderTab === 'headers' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                      {activeHeaders.length === 0 ? (
                        <div style={{ fontSize: '11px', color: '#6b7280', padding: '8px 0', textAlign: 'center' }}>
                          No headers configured. Click "+ Add Header" to include headers in this request.
                        </div>
                      ) : (
                        activeHeaders.map((h, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="checkbox"
                              checked={h.enabled}
                              onChange={(e) => handleUpdateHeaderInBuilder(idx, 'enabled', e.target.checked)}
                              style={{ cursor: 'pointer', accentColor: '#6366f1' }}
                            />
                            <input
                              type="text"
                              value={h.key}
                              onChange={(e) => handleUpdateHeaderInBuilder(idx, 'key', e.target.value)}
                              placeholder="Header Name"
                              style={{ flex: 1, backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '4px', padding: '5px 8px', color: '#f3f4f6', fontSize: '12px', fontFamily: 'monospace' }}
                            />
                            <input
                              type="text"
                              value={h.value}
                              onChange={(e) => handleUpdateHeaderInBuilder(idx, 'value', e.target.value)}
                              placeholder="Value"
                              style={{ flex: 1.5, backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '4px', padding: '5px 8px', color: '#a5f3fc', fontSize: '12px', fontFamily: 'monospace' }}
                            />
                            <button
                              onClick={() => handleRemoveHeaderFromBuilder(idx)}
                              title="Delete header"
                              style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px' }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div>
                      <textarea
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        rows={5}
                        placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}"
                        style={{ width: '100%', backgroundColor: '#0b0f19', border: '1px solid #374151', borderRadius: '4px', padding: '10px', color: '#a5f3fc', fontFamily: 'monospace', fontSize: '12px' }}
                      />
                    </div>
                  )}
                </div>

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

          {activeTab === 'functional' && (
            <FunctionalSuitesView
              authToken={authToken}
              activeProjectName={activeProject.name}
              collections={collections}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView />
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
