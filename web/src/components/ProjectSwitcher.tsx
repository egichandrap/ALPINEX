import React, { useState, useRef, useEffect } from 'react';
import { Briefcase, ChevronDown, Check, Plus, X, FolderPlus } from 'lucide-react';
import { ProjectItem } from '../types/auth';

interface ProjectSwitcherProps {
  activeProject: ProjectItem;
  projects: ProjectItem[];
  onSelectProject: (project: ProjectItem) => void;
  onCreateProject: (name: string, description: string) => Promise<void>;
}

export const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({
  activeProject,
  projects,
  onSelectProject,
  onCreateProject,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  return (
    <>
      {/* Project Switcher Box in Sidebar */}
      <div ref={dropdownRef} style={{ position: 'relative', margin: '12px' }}>
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
            <ChevronDown size={14} color="#9ca3af" />
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
            <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', borderBottom: '1px solid #1f2937' }}>
              SELECT PROJECT
            </div>

            <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '4px' }}>
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
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#161e2e';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: isSelected ? '600' : '400', color: '#f3f4f6' }}>
                        {proj.name}
                      </div>
                      {proj.description && (
                        <div style={{ fontSize: '10px', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {proj.description}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check size={14} color="#10b981" />}
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
    </>
  );
};
