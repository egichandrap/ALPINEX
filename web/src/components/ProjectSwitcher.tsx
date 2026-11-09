import React, { useState, useRef, useEffect } from 'react';
import { Briefcase, ChevronDown, Check, Plus, X, FolderPlus, Trash2, AlertTriangle } from 'lucide-react';
import { ProjectItem } from '../types/auth';

interface ProjectSwitcherProps {
  activeProject: ProjectItem;
  projects: ProjectItem[];
  onSelectProject: (project: ProjectItem) => void;
  onCreateProject: (name: string, description: string) => Promise<void>;
  onDeleteProject?: (projectId: string) => Promise<void>;
}

export const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({
  activeProject,
  projects,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    try {
      await onCreateProject(newName.trim(), newDesc.trim());
      setNewName('');
      setNewDesc('');
      setIsModalOpen(false);
      setIsOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete || !onDeleteProject) return;
    setDeleting(true);
    try {
      await onDeleteProject(projectToDelete.id);
      setProjectToDelete(null);
      setIsOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Project Switcher Box in Sidebar */}
      <div ref={dropdownRef} data-tour="project-switcher" style={{ position: 'relative', margin: '12px' }}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            padding: '10px 14px',
            backgroundColor: '#161e2e',
            borderRadius: '6px',
            border: isOpen ? '1px solid #6366f1' : '1px solid #1f2937',
            cursor: 'pointer',
            transition: 'border-color 0.2s, background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#161e2e')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 'bold' }}>
              Active Project
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {onDeleteProject && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProjectToDelete(activeProject);
                  }}
                  title="Delete active project"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                >
                  <Trash2 size={12} />
                </button>
              )}
              <ChevronDown size={14} color="#9ca3af" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <Briefcase size={14} color="#6366f1" />
            <span
              style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#e5e7eb',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {activeProject.name}
            </span>
          </div>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '100%',
              marginTop: '6px',
              backgroundColor: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
              zIndex: 1000,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>SELECT PROJECT</span>
              <span style={{ fontSize: '10px', color: '#6b7280' }}>{projects.length} available</span>
            </div>

            <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '4px' }}>
              {projects.map((proj) => {
                const isSelected = proj.id === activeProject.id;
                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      onSelectProject(proj);
                      setIsOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#1e293b' : 'transparent',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#161e2e';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: isSelected ? '600' : '400', color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {proj.name}
                        </span>
                        {isSelected && (
                          <span style={{ fontSize: '9px', backgroundColor: '#064e3b', color: '#34d399', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' }}>
                            Active
                          </span>
                        )}
                      </div>
                      {proj.description && (
                        <div style={{ fontSize: '10px', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {proj.description}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {isSelected && <Check size={14} color="#10b981" />}
                      {onDeleteProject && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToDelete(proj);
                          }}
                          title={`Delete project "${proj.name}"`}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#6b7280',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid #1f2937', padding: '4px' }}>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsModalOpen(true);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#818cf8',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e1b4b')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Plus size={14} />
                <span>Create New Project</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create New Project Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
              width: '460px',
              backgroundColor: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '10px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderPlus size={18} color="#6366f1" />
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6', margin: 0 }}>
                  Create New Project
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', marginBottom: '6px' }}>
                  PROJECT NAME <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Payment Gateway Service"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0b0f19',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#f3f4f6',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', marginBottom: '6px' }}>
                  DESCRIPTION
                </label>
                <textarea
                  rows={3}
                  placeholder="What service or API does this project contain?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0b0f19',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#f3f4f6',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#e5e7eb',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  style={{
                    padding: '8px 18px',
                    backgroundColor: '#6366f1',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: creating || !newName.trim() ? 'not-allowed' : 'pointer',
                    opacity: creating || !newName.trim() ? 0.6 : 1,
                  }}
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {projectToDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) setProjectToDelete(null);
          }}
        >
          <div
            style={{
              width: '440px',
              backgroundColor: '#111827',
              border: '1px solid #374151',
              borderRadius: '10px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#7f1d1d33',
                  border: '1px solid #991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={18} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#f3f4f6', margin: 0 }}>
                  Delete Project
                </h3>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  This action cannot be undone
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#d1d5db', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              Are you sure you want to delete project <strong style={{ color: '#f87171' }}>"{projectToDelete.name}"</strong>?
              All associated API collections, folders, and functional test suites scoped to this project will be permanently removed.
            </p>

            {projectToDelete.id === activeProject.id && (
              <div style={{ backgroundColor: '#1e1b4b', border: '1px solid #4338ca', borderRadius: '6px', padding: '10px 12px', marginBottom: '16px', fontSize: '12px', color: '#c7d2fe' }}>
                ℹ️ This is currently your <strong>Active Project</strong>. Deleting it will automatically switch your workspace to another project.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setProjectToDelete(null)}
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#e5e7eb',
                  fontSize: '12px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#dc2626',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                <Trash2 size={13} />
                <span>{deleting ? 'Deleting...' : 'Yes, Delete Project'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
