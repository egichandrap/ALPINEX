import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Edit2,
  Search,
  X,
  Minimize2,
  Maximize2,
  Download
} from 'lucide-react';
import { CollectionItem, RequestItem } from '../types/collection';

interface CollectionTreeProps {
  collections: CollectionItem[];
  selectedRequestId: string | null;
  onSelectRequest: (req: RequestItem) => void;
  onOpenAddCollection: () => void;
  onDeleteCollection: (e: React.MouseEvent, colId: string) => void;
  onOpenAddRequest: (colId: string) => void;
  onOpenEditRequest: (colId: string, req: RequestItem) => void;
  onDeleteRequest: (colId: string, reqId: string) => void;
  onExportCollection?: (col: CollectionItem) => void;
  getMethodBadgeStyle: (method: string) => { bg: string; color: string };
}

interface FolderNode {
  name: string;
  fullPath: string;
  subfolders: Record<string, FolderNode>;
  requests: RequestItem[];
}

function buildFolderTree(requests: RequestItem[]): FolderNode {
  const root: FolderNode = {
    name: 'root',
    fullPath: '',
    subfolders: {},
    requests: [],
  };

  for (const req of requests) {
    if (!req.folder || !req.folder.trim()) {
      root.requests.push(req);
      continue;
    }

    const segments = req.folder.split(/\s*\/\s*/).map((s) => s.trim()).filter(Boolean);
    let current = root;
    let accumulated = '';

    for (const seg of segments) {
      accumulated = accumulated ? `${accumulated} / ${seg}` : seg;
      if (!current.subfolders[seg]) {
        current.subfolders[seg] = {
          name: seg,
          fullPath: accumulated,
          subfolders: {},
          requests: [],
        };
      }
      current = current.subfolders[seg];
    }

    current.requests.push(req);
  }

  return root;
}

function countFolderRequests(node: FolderNode): number {
  let count = node.requests.length;
  for (const sub of Object.values(node.subfolders)) {
    count += countFolderRequests(sub);
  }
  return count;
}

export const CollectionTree: React.FC<CollectionTreeProps> = ({
  collections,
  selectedRequestId,
  onSelectRequest,
  onOpenAddCollection,
  onDeleteCollection,
  onOpenAddRequest,
  onOpenEditRequest,
  onDeleteRequest,
  onExportCollection,
  getMethodBadgeStyle,
}) => {
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCollection = (colId: string) => {
    setExpandedCollections((prev) => ({
      ...prev,
      [colId]: prev[colId] === undefined ? false : !prev[colId],
    }));
  };

  const toggleFolder = (folderKey: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderKey]: prev[folderKey] === undefined ? false : !prev[folderKey],
    }));
  };

  const handleToggleAllFolders = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    const nextCols: Record<string, boolean> = {};
    collections.forEach((col) => {
      nextCols[col.id] = expand;
      const tree = buildFolderTree(col.requests);
      const walk = (node: FolderNode) => {
        if (node.fullPath) {
          next[`${col.id}::${node.fullPath}`] = expand;
        }
        Object.values(node.subfolders).forEach(walk);
      };
      walk(tree);
    });
    setExpandedCollections(nextCols);
    setExpandedFolders(next);
  };

  const renderRequestItem = (colId: string, req: RequestItem, depth: number) => {
    const isSelected = selectedRequestId === req.id;
    const badge = getMethodBadgeStyle(req.method);

    return (
      <div
        key={req.id}
        onClick={() => onSelectRequest(req)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          padding: '5px 8px',
          paddingLeft: `${Math.max(depth * 14 + 8, 8)}px`,
          borderRadius: '4px',
          cursor: 'pointer',
          backgroundColor: isSelected ? '#1e293b' : 'transparent',
          border: isSelected ? '1px solid #3b82f6' : '1px solid transparent',
          transition: 'background-color 0.15s',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = '#161e2e';
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span
          style={{
            fontWeight: 'bold',
            fontSize: '9px',
            padding: '1px 4px',
            borderRadius: '3px',
            backgroundColor: badge.bg,
            color: badge.color,
            minWidth: '28px',
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          {req.method}
        </span>
        <span
          title={req.name}
          style={{
            color: isSelected ? '#f3f4f6' : '#d1d5db',
            fontWeight: isSelected ? '600' : '400',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
            minWidth: 0,
          }}
        >
          {req.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenEditRequest(colId, req);
            }}
            title="Configure endpoint"
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
              onDeleteRequest(colId, req.id);
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
  };

  const renderFolderNode = (colId: string, node: FolderNode, depth: number): React.ReactNode => {
    const folderKey = `${colId}::${node.fullPath}`;
    const isExpanded = expandedFolders[folderKey] ?? true;
    const subfolderKeys = Object.keys(node.subfolders);
    const totalCount = countFolderRequests(node);

    return (
      <div key={node.fullPath || 'root'} style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Folder Header (if not virtual root) */}
        {node.fullPath && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              toggleFolder(folderKey);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '5px 8px',
              paddingLeft: `${depth * 14 + 6}px`,
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: isExpanded ? '#141d2f' : '#0e1524',
              border: '1px solid #1f2937',
              userSelect: 'none',
              fontSize: '12px',
              fontWeight: '600',
              color: '#e5e7eb',
              margin: '2px 0',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isExpanded ? '#141d2f' : '#0e1524')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
              {isExpanded ? (
                <ChevronDown size={13} color="#9ca3af" />
              ) : (
                <ChevronRight size={13} color="#9ca3af" />
              )}
              {isExpanded ? (
                <FolderOpen size={14} color="#f59e0b" />
              ) : (
                <Folder size={14} color="#f59e0b" />
              )}
              <span
                title={node.name}
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: '#f3f4f6',
                }}
              >
                {node.name}
              </span>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#9ca3af',
                backgroundColor: '#1e293b',
                padding: '1px 5px',
                borderRadius: '8px',
                flexShrink: 0,
              }}
            >
              {totalCount}
            </span>
          </div>
        )}

        {/* Children: Subfolders then Requests */}
        {(node.fullPath === '' || isExpanded) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {subfolderKeys.map((subName) =>
              renderFolderNode(colId, node.subfolders[subName], node.fullPath ? depth + 1 : 0)
            )}
            {node.requests.map((req) =>
              renderRequestItem(colId, req, node.fullPath ? depth + 1 : 0)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        width: '320px',
        height: '100%',
        minHeight: 0,
        backgroundColor: '#111827',
        borderRadius: '8px',
        border: '1px solid #1f2937',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', letterSpacing: '0.5px' }}>
          API COLLECTIONS
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => handleToggleAllFolders(true)}
            title="Expand All Folders"
            style={{
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '4px',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '3px 6px',
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f3f4f6')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
          >
            <Maximize2 size={12} />
          </button>
          <button
            onClick={() => handleToggleAllFolders(false)}
            title="Collapse All Folders"
            style={{
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '4px',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '3px 6px',
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f3f4f6')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
          >
            <Minimize2 size={12} />
          </button>
          <button
            data-tour="add-collection-btn"
            onClick={onOpenAddCollection}
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
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1f2937')}
          >
            <Plus size={13} /> Add
          </button>
        </div>
      </div>

      {/* Quick Search Filter */}
      <div style={{ position: 'relative', marginBottom: '10px' }}>
        <Search size={13} style={{ position: 'absolute', left: '8px', top: '7px', color: '#6b7280' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter requests or folders..."
          style={{
            width: '100%',
            backgroundColor: '#0b0f19',
            border: '1px solid #1f2937',
            borderRadius: '4px',
            padding: '5px 8px 5px 26px',
            fontSize: '11px',
            color: '#f3f4f6',
            outline: 'none',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '6px',
              top: '5px',
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '2px',
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Collections & Folders Tree List */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingRight: '4px',
        }}
      >
        {collections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 12px', color: '#6b7280' }}>
            <Folder size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
            <div style={{ fontSize: '12px', marginBottom: '12px' }}>No collections yet</div>
            <button
              onClick={onOpenAddCollection}
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
            const isColExpanded = expandedCollections[col.id] ?? true;

            // Apply filter query if any
            const q = searchQuery.toLowerCase().trim();
            const filteredRequests = q
              ? col.requests.filter(
                  (r) =>
                    r.name.toLowerCase().includes(q) ||
                    r.url.toLowerCase().includes(q) ||
                    (r.folder && r.folder.toLowerCase().includes(q))
                )
              : col.requests;

            const folderTree = buildFolderTree(filteredRequests);

            if (q && filteredRequests.length === 0) {
              return null; // hide collection if no matching requests
            }

            return (
              <div
                key={col.id}
                style={{
                  backgroundColor: '#0b0f19',
                  borderRadius: '6px',
                  border: '1px solid #1f2937',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {/* Collection Header */}
                <div
                  onClick={() => toggleCollection(col.id)}
                  style={{
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: '#161e2e',
                    userSelect: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                    {isColExpanded ? (
                      <ChevronDown size={14} color="#9ca3af" />
                    ) : (
                      <ChevronRight size={14} color="#9ca3af" />
                    )}
                    <Folder size={15} color="#818cf8" />
                    <span
                      title={col.name}
                      style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#f3f4f6',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {col.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
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
                      {filteredRequests.length}
                    </span>
                    {onExportCollection && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onExportCollection(col);
                        }}
                        title="Export collection as JSON"
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
                          e.currentTarget.style.color = '#38bdf8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#1f2937';
                          e.currentTarget.style.color = '#f3f4f6';
                        }}
                      >
                        <Download size={11} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddRequest(col.id);
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
                      <Plus size={11} />
                    </button>
                    <button
                      onClick={(e) => onDeleteCollection(e, col.id)}
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
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Collection Content: Hierarchical Folders & Requests */}
                {isColExpanded && (
                  <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {filteredRequests.length === 0 ? (
                      <div style={{ fontSize: '11px', color: '#6b7280', padding: '6px 8px', fontStyle: 'italic' }}>
                        No requests inside
                      </div>
                    ) : (
                      renderFolderNode(col.id, folderTree, 0)
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
