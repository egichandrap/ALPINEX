import React, { useState } from 'react';
import { X, Sliders, Plus, Trash2, Check, RefreshCw, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';
import { EnvironmentConfig, DEFAULT_ENVIRONMENTS } from '../types/environment';

interface EnvironmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  environments: EnvironmentConfig[];
  activeEnvId: 'dev' | 'staging' | 'prod';
  onSelectActiveEnv: (id: 'dev' | 'staging' | 'prod') => void;
  onSaveEnvironments: (envs: EnvironmentConfig[]) => void;
}

export const EnvironmentModal: React.FC<EnvironmentModalProps> = ({
  isOpen,
  onClose,
  environments,
  activeEnvId,
  onSelectActiveEnv,
  onSaveEnvironments,
}) => {
  const [localEnvs, setLocalEnvs] = useState<EnvironmentConfig[]>(environments);
  const [selectedTab, setSelectedTab] = useState<'dev' | 'staging' | 'prod'>(activeEnvId);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalEnvs(environments);
      setSelectedTab(activeEnvId);
      setSaveSuccess(false);
    }
  }, [isOpen, environments, activeEnvId]);

  if (!isOpen) return null;

  const currentEnv = localEnvs.find((e) => e.id === selectedTab) || localEnvs[0];

  const handleBaseUrlChange = (newBaseUrl: string) => {
    setLocalEnvs((prev) =>
      prev.map((e) => {
        if (e.id === selectedTab) {
          const updatedVars = e.variables.map((v) =>
            v.key === 'base_url' ? { ...v, value: newBaseUrl } : v
          );
          if (!updatedVars.some((v) => v.key === 'base_url')) {
            updatedVars.unshift({ key: 'base_url', value: newBaseUrl, enabled: true });
          }
          return { ...e, baseUrl: newBaseUrl, variables: updatedVars };
        }
        return e;
      })
    );
  };

  const handleAddVariable = () => {
    setLocalEnvs((prev) =>
      prev.map((e) => {
        if (e.id === selectedTab) {
          return {
            ...e,
            variables: [
              ...e.variables,
              { key: `var_${Date.now().toString(36).substring(4)}`, value: '', enabled: true },
            ],
          };
        }
        return e;
      })
    );
  };

  const handleUpdateVariable = (idx: number, field: 'key' | 'value' | 'enabled', val: any) => {
    setLocalEnvs((prev) =>
      prev.map((e) => {
        if (e.id === selectedTab) {
          const updatedVars = [...e.variables];
          updatedVars[idx] = { ...updatedVars[idx], [field]: val };
          if (updatedVars[idx].key === 'base_url' && field === 'value') {
            return { ...e, baseUrl: val, variables: updatedVars };
          }
          return { ...e, variables: updatedVars };
        }
        return e;
      })
    );
  };

  const handleDeleteVariable = (idx: number) => {
    setLocalEnvs((prev) =>
      prev.map((e) => {
        if (e.id === selectedTab) {
          return {
            ...e,
            variables: e.variables.filter((_, i) => i !== idx),
          };
        }
        return e;
      })
    );
  };

  const handleSave = () => {
    onSaveEnvironments(localEnvs);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all environments and variables to default configuration?')) {
      setLocalEnvs(DEFAULT_ENVIRONMENTS);
      onSaveEnvironments(DEFAULT_ENVIRONMENTS);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#111827',
          border: '1px solid #1f2937',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '750px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1f2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sliders size={18} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6', margin: 0 }}>
                Environment & Variable Manager
              </h3>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0, marginTop: '2px' }}>
                Manage target endpoints, base URLs, and contextual variables across environments.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f3f4f6')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Environment Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 20px',
            backgroundColor: '#0b0f19',
            borderBottom: '1px solid #1f2937',
          }}
        >
          {localEnvs.map((envItem) => {
            const isTabActive = selectedTab === envItem.id;
            const isCurrentGlobal = activeEnvId === envItem.id;

            return (
              <button
                key={envItem.id}
                onClick={() => setSelectedTab(envItem.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: isTabActive ? `1px solid ${envItem.color}` : '1px solid #1f2937',
                  backgroundColor: isTabActive ? `${envItem.color}15` : '#111827',
                  color: isTabActive ? '#f3f4f6' : '#9ca3af',
                  fontSize: '13px',
                  fontWeight: isTabActive ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: envItem.color,
                  }}
                />
                <span>{envItem.name}</span>
                {isCurrentGlobal && (
                  <span
                    style={{
                      fontSize: '10px',
                      backgroundColor: 'rgba(99, 102, 241, 0.25)',
                      color: '#a5b4fc',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                    }}
                  >
                    ACTIVE
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Environment Details Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Context Banner */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: `${currentEnv.color}10`,
              border: `1px solid ${currentEnv.color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {currentEnv.id === 'prod' ? (
                <Lock size={18} color="#ef4444" />
              ) : currentEnv.id === 'staging' ? (
                <ShieldCheck size={18} color="#f59e0b" />
              ) : (
                <ShieldCheck size={18} color="#10b981" />
              )}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: currentEnv.color }}>
                  {currentEnv.name} Environment
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                  {currentEnv.description}
                </div>
              </div>
            </div>

            {activeEnvId !== currentEnv.id && (
              <button
                onClick={() => onSelectActiveEnv(currentEnv.id)}
                style={{
                  backgroundColor: currentEnv.color,
                  color: currentEnv.id === 'staging' ? '#111827' : '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Check size={14} />
                Set as Active
              </button>
            )}
          </div>

          {/* Base URL Configuration */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#d1d5db', display: 'block', marginBottom: '6px' }}>
              Base URL <span style={{ color: '#818cf8', fontFamily: 'monospace' }}>{'({{base_url}})'}</span>
            </label>
            <input
              type="text"
              value={currentEnv.baseUrl}
              onChange={(e) => handleBaseUrlChange(e.target.value)}
              placeholder="e.g. http://localhost:8080 or https://staging.example.com"
              style={{
                width: '100%',
                backgroundColor: '#0b0f19',
                border: '1px solid #374151',
                borderRadius: '6px',
                padding: '9px 12px',
                color: '#f3f4f6',
                fontFamily: 'monospace',
                fontSize: '13px',
              }}
            />
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              Requests using <code style={{ color: '#38bdf8' }}>{'{{base_url}}'}</code> will automatically resolve to this URL when {currentEnv.name} is active.
            </div>
          </div>

          {/* Variables Table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#d1d5db' }}>
                Environment Variables ({currentEnv.variables.length})
              </label>
              <button
                onClick={handleAddVariable}
                style={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  color: '#e5e7eb',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1f2937')}
              >
                <Plus size={13} />
                Add Variable
              </button>
            </div>

            <div
              style={{
                backgroundColor: '#0b0f19',
                border: '1px solid #1f2937',
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#111827', borderBottom: '1px solid #1f2937', color: '#9ca3af' }}>
                    <th style={{ padding: '8px 12px', width: '36px' }}>On</th>
                    <th style={{ padding: '8px 12px', width: '35%' }}>Variable Key</th>
                    <th style={{ padding: '8px 12px' }}>Value</th>
                    <th style={{ padding: '8px 12px', width: '40px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {currentEnv.variables.map((v, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: idx === currentEnv.variables.length - 1 ? 'none' : '1px solid #1f2937',
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={v.enabled}
                          onChange={(e) => handleUpdateVariable(idx, 'enabled', e.target.checked)}
                          style={{ cursor: 'pointer', accentColor: '#6366f1' }}
                        />
                      </td>

                      {/* Key */}
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          value={v.key}
                          onChange={(e) => handleUpdateVariable(idx, 'key', e.target.value)}
                          placeholder="e.g. api_key"
                          style={{
                            width: '100%',
                            backgroundColor: '#161e2e',
                            border: '1px solid #374151',
                            borderRadius: '4px',
                            padding: '6px 8px',
                            color: '#a5b4fc',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                          }}
                        />
                      </td>

                      {/* Value */}
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="text"
                          value={v.value}
                          onChange={(e) => handleUpdateVariable(idx, 'value', e.target.value)}
                          placeholder="value"
                          style={{
                            width: '100%',
                            backgroundColor: '#161e2e',
                            border: '1px solid #374151',
                            borderRadius: '4px',
                            padding: '6px 8px',
                            color: '#f3f4f6',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                          }}
                        />
                      </td>

                      {/* Delete */}
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeleteVariable(idx)}
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
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#0b0f19',
            borderTop: '1px solid #1f2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={handleResetDefaults}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#9ca3af',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f3f4f6')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
          >
            <RefreshCw size={13} />
            Reset Defaults
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                color: '#d1d5db',
                borderRadius: '6px',
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                backgroundColor: saveSuccess ? '#059669' : '#6366f1',
                border: 'none',
                color: 'white',
                borderRadius: '6px',
                padding: '7px 18px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background-color 0.2s',
              }}
            >
              {saveSuccess ? <Check size={15} /> : null}
              {saveSuccess ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
