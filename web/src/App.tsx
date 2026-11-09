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
  FileText,
  AlertTriangle
} from 'lucide-react';
import { CollectionItem, RequestItem, HeaderItem, HTTPMethod } from './types/collection';
import { UserProfile, ProjectItem } from './types/auth';
import { AddCollectionModal } from './components/AddCollectionModal';
import { RequestConfigModal } from './components/RequestConfigModal';
import { LoginPage } from './components/LoginPage';
import { ProjectSwitcher } from './components/ProjectSwitcher';
import { CollectionTree } from './components/CollectionTree';
import { FunctionalSuitesView } from './components/FunctionalSuitesView';
import { ReportsView } from './components/ReportsView';
import { PerformanceTestView } from './components/PerformanceTestView';
import { ExecutionCenterView } from './components/ExecutionCenterView';
import { TutorialTour } from './components/TutorialTour';

interface MetricPoint {
  time: string;
  vus: number;
  rps: number;
  p95: number;
  errorRate: number;
}

const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-default',
    workspaceId: 'ws-default',
    name: 'Default Project',
    description: 'Primary workspace project',
  },
];

const DEFAULT_COLLECTIONS: CollectionItem[] = [];

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
  
  const getProjectCollectionsKey = (projId: string) => `alpinex_collections_${projId}`;

  const loadCollectionsForProject = (projId: string): CollectionItem[] => {
    try {
      const specific = localStorage.getItem(getProjectCollectionsKey(projId));
      if (specific) return JSON.parse(specific);
    } catch (e) {
      console.error('Failed to load collections for project', projId, e);
    }
    return [];
  };

  // Collections State (Scoped to activeProject)
  const [collections, setCollections] = useState<CollectionItem[]>(() => {
    return loadCollectionsForProject(activeProject.id);
  });

  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // Sync projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('alpinex_projects', JSON.stringify(projects));
      localStorage.setItem('alpinex_active_project', JSON.stringify(activeProject));
    } catch (e) {
      console.error('Failed to persist projects to localStorage', e);
    }
  }, [projects, activeProject]);

  // When activeProject changes, reload collections for that project
  useEffect(() => {
    const loaded = loadCollectionsForProject(activeProject.id);
    setCollections(loaded);
    if (loaded.length > 0 && loaded[0].requests.length > 0) {
      handleSelectRequest(loaded[0].requests[0]);
    } else {
      setSelectedRequestId(null);
    }
  }, [activeProject.id]);

  // Sync collections to localStorage scoped to current activeProject
  useEffect(() => {
    try {
      localStorage.setItem(getProjectCollectionsKey(activeProject.id), JSON.stringify(collections));
    } catch (e) {
      console.error('Failed to persist collections to localStorage', e);
    }
  }, [collections, activeProject.id]);

  // Auto-launch tutorial on initial login if not completed yet
  useEffect(() => {
    if (currentUser && authToken) {
      const isCompleted = localStorage.getItem('alpinex_tutorial_completed');
      if (!isCompleted) {
        setIsTutorialOpen(true);
      }
    }
  }, [currentUser, authToken]);

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
  const [url, setUrl] = useState('');
  const [requestBody, setRequestBody] = useState('');
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

  // Auth Handlers
  const handleLoginSuccess = (user: UserProfile, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('alpinex_user', JSON.stringify(user));
    localStorage.setItem('alpinex_auth_token', token);
    const isCompleted = localStorage.getItem('alpinex_tutorial_completed');
    if (!isCompleted) {
      setIsTutorialOpen(true);
    }
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

  // Delete Project Handler
  const handleDeleteProject = async (projectId: string) => {
    if (authToken) {
      try {
        await fetch(`${getApiUrl()}/api/v1/projects/${projectId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
      } catch (err) {
        console.warn('Backend project deletion fallback to local', err);
      }
    }

    // Clean up project-scoped data from localStorage
    try {
      localStorage.removeItem(getProjectCollectionsKey(projectId));
      localStorage.removeItem(`alpinex_functional_suites_${projectId}`);
      localStorage.removeItem(`alpinex_perf_scenarios_${projectId}`);
      localStorage.removeItem(`alpinex_perf_reports_${projectId}`);
      localStorage.removeItem(`alpinex_executions_${projectId}`);
    } catch (e) {
      console.error('Failed to clean up project data from localStorage', e);
    }

    const remaining = projects.filter((p) => p.id !== projectId);
    const nextProjects = remaining.length > 0 ? remaining : DEFAULT_PROJECTS;
    setProjects(nextProjects);

    // If active project was deleted, switch to the next available project
    if (activeProject.id === projectId) {
      const nextActive = nextProjects[0];
      setActiveProject(nextActive);
    }
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    let resolvedUrl = url.trim();

    try {
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
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => res.text());
      const durationMs = Math.round(performance.now() - start);

      setResponse({
        status: res.status,
        statusText: res.statusText || 'OK',
        time: durationMs,
        size: typeof data === 'string' ? data.length : JSON.stringify(data).length,
        body: data,
        headers: Object.fromEntries(res.headers.entries()),
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      const durationMs = Math.round(performance.now() - start);
      const isTimeout = err.name === 'AbortError';

      let errorTitle = isTimeout ? 'Connection Timeout (8000ms Exceeded)' : 'Connection Failed (Target Unreachable)';
      let errorDetail = isTimeout
        ? 'Target host did not respond within 8000ms (silent packet drop or host offline).'
        : (err.message === 'Failed to fetch' || err.name === 'TypeError'
            ? 'Failed to fetch (Unable to establish TCP/TLS connection with host).'
            : (err.message || 'Network Failure'));

      setResponse({
        status: 0,
        statusText: isTimeout ? 'Timeout Error' : 'Connection / CORS Error',
        time: durationMs,
        size: 0,
        headers: {},
        isDiagnosticError: true,
        diagnostic: {
          title: errorTitle,
          reason: errorDetail,
          targetUrl: resolvedUrl,
          checklist: [
            '🔒 VPN Connection: If this endpoint is on an internal/private network (e.g., 10.x.x.x, 192.168.x.x, *.internal), ensure your VPN client is active and connected.',
            '🛡️ Firewall / Whitelist: The destination IP or port may be blocked by a corporate firewall, security group, or WAF.',
            '⚡ Server Status: Verify the backend service is currently running and listening on the designated port.',
            '🌐 CORS Policy: Web browsers block cross-origin requests unless the server responds with Access-Control-Allow-Origin headers.',
            '🔗 Protocol & Host: Double check if the URL scheme should be http vs https or if the domain name resolves.'
          ]
        },
        body: {
          error: errorTitle,
          message: errorDetail,
          targetUrl: resolvedUrl,
          diagnosticChecklist: [
            '1. VPN Connection: Ensure VPN is connected if targeting private/intranet hosts.',
            '2. Firewall: Verify corporate firewall / security group allows inbound traffic.',
            '3. Service Health: Check if the server process is alive and healthy.',
            '4. CORS Header: Server must allow Cross-Origin Resource Sharing from this origin.'
          ]
        },
      });
    } finally {
      setLoading(false);
    }
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
        {/* Brand Header with Official AlpineX Logo */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="/favicon-alpinex.png"
            alt="AlpineX Symbol"
            style={{ width: '32px', height: '32px', objectFit: 'contain', flexShrink: 0 }}
          />
          <div>
            <div className="alpinex-logo" style={{ fontSize: '18px', letterSpacing: '-0.8px' }}>
              ALPINE<span className="x">X</span>
            </div>
            <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px', fontWeight: '500' }}>
              v1.0.9 • API & Load Platform
            </div>
          </div>
        </div>

        {/* Dynamic Project Switcher */}
        <ProjectSwitcher
          activeProject={activeProject}
          projects={projects}
          onSelectProject={setActiveProject}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
        />

        {/* Navigation Items */}
        <nav data-tour="nav-sidebar" style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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

            {/* Tutorial Tour Trigger Button */}
            <button
              data-tour="tutorial-btn"
              onClick={() => setIsTutorialOpen(true)}
              style={{
                backgroundColor: '#1e1b4b',
                border: '1px solid #4338ca',
                color: '#c7d2fe',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
              title="Buka Mode Panduan & Tutorial Interaktif"
            >
              <Sparkles size={14} color="#a5b4fc" />
              <span>Tutorial Mode</span>
            </button>

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
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: activeTab === 'api' ? 'hidden' : 'auto',
            padding: activeTab === 'api' ? '16px 20px' : '24px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {activeTab === 'api' && (
            <div style={{ display: 'flex', flex: 1, height: '100%', minHeight: 0, gap: '16px', overflow: 'hidden' }}>
              {/* Collection Tree Pane with Hierarchical Folders & Search */}
              <CollectionTree
                collections={collections}
                selectedRequestId={selectedRequestId}
                onSelectRequest={handleSelectRequest}
                onOpenAddCollection={() => setIsAddModalOpen(true)}
                onDeleteCollection={handleDeleteCollection}
                onOpenAddRequest={handleOpenAddRequestModal}
                onOpenEditRequest={handleOpenEditRequestModal}
                onDeleteRequest={handleDeleteRequest}
                getMethodBadgeStyle={getMethodBadgeStyle}
              />

              {/* Request Builder & Response Pane */}
              <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', paddingRight: '4px' }}>
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
                    data-tour="send-request-btn"
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
                      <div>
                        {response.diagnostic && (
                          <div style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            padding: '14px',
                            marginBottom: '14px',
                            fontFamily: 'Inter, system-ui, sans-serif'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>
                              <AlertTriangle size={16} />
                              <span>{response.diagnostic.title}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#fca5a5', marginBottom: '10px' }}>
                              {response.diagnostic.reason}
                            </div>
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Troubleshooting Diagnostic Checklist:
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#d1d5db', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {response.diagnostic.checklist.map((item: string, idx: number) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <pre style={{ color: response.isDiagnosticError ? '#fca5a5' : '#a5f3fc', margin: 0 }}>
                          {JSON.stringify(response.body, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div style={{ color: '#6b7280', textAlign: 'center', marginTop: '40px' }}>Hit "Send" to execute request and inspect telemetry.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <PerformanceTestView
              authToken={authToken}
              activeProject={activeProject}
              collections={collections}
            />
          )}

          {activeTab === 'functional' && (
            <FunctionalSuitesView
              authToken={authToken}
              activeProject={activeProject}
              collections={collections}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView activeProject={activeProject} />
          )}

          {activeTab === 'dashboard' && (() => {
            const totalEndpoints = collections.reduce((acc, c) => acc + c.requests.length, 0);
            const suitesKey = `alpinex_functional_suites_${activeProject.id}`;
            const suitesCount = (() => {
              try {
                const raw = localStorage.getItem(suitesKey);
                return raw ? JSON.parse(raw).length : 0;
              } catch {
                return 0;
              }
            })();
            const reportsKey = `alpinex_perf_reports_${activeProject.id}`;
            const perfReports = (() => {
              try {
                const raw = localStorage.getItem(reportsKey);
                return raw ? JSON.parse(raw) : [];
              } catch {
                return [];
              }
            })();
            const passedReports = perfReports.filter((r: any) => r.verdict === 'PASSED').length;
            const slaPassRate = perfReports.length > 0 ? `${Math.round((passedReports / perfReports.length) * 100)}%` : '—';

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Platform Overview</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  <MetricCard title="ACTIVE COLLECTIONS" value={collections.length} unit="Collections" color="#6366f1" />
                  <MetricCard title="API ENDPOINTS" value={totalEndpoints} unit="Endpoints" color="#38bdf8" />
                  <MetricCard title="FUNCTIONAL SUITES" value={suitesCount} unit="Suites" color="#a855f7" />
                  <MetricCard
                    title="SLA PASS RATE"
                    value={slaPassRate}
                    unit={perfReports.length > 0 ? `${perfReports.length} test runs` : 'No runs yet'}
                    color="#10b981"
                  />
                </div>
              </div>
            );
          })()}

          {activeTab === 'executions' && (
            <ExecutionCenterView activeProject={activeProject} onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
        </div>
      </main>

      {/* Interactive Onboarding Tutorial Tour */}
      <TutorialTour
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />
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
