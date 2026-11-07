import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Sparkles, Layers, Sliders, FileText } from 'lucide-react';
import { HTTPMethod, HeaderItem, RequestItem } from '../types/collection';

interface RequestConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
  collectionName: string;
  initialRequest?: RequestItem | null;
  onSave: (collectionId: string, request: RequestItem) => void;
}

const HTTP_METHODS: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

export const RequestConfigModal: React.FC<RequestConfigModalProps> = ({
  isOpen,
  onClose,
  collectionId,
  collectionName,
  initialRequest,
  onSave,
}) => {
  const isEditing = Boolean(initialRequest);

  const [name, setName] = useState('');
  const [method, setMethod] = useState<HTTPMethod>('GET');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [headers, setHeaders] = useState<HeaderItem[]>([]);
  const [bodyType, setBodyType] = useState<'NONE' | 'JSON' | 'RAW'>('NONE');
  const [body, setBody] = useState('');
  const [activeTab, setActiveTab] = useState<'headers' | 'body' | 'settings'>('headers');
  const [error, setError] = useState<string | null>(null);

  // Sync state when opening or when initialRequest changes
  useEffect(() => {
    if (isOpen) {
      if (initialRequest) {
        setName(initialRequest.name || '');
        setMethod(initialRequest.method || 'GET');
        setUrl(initialRequest.url || '');
        setDescription(initialRequest.description || '');
        setHeaders(
          initialRequest.headers && initialRequest.headers.length > 0
            ? initialRequest.headers.map((h) => ({ ...h }))
            : [{ key: 'Content-Type', value: 'application/json', enabled: true }]
        );
        const bType = (initialRequest.bodyType as any) || (initialRequest.body ? 'JSON' : 'NONE');
        setBodyType(bType === 'FORM' ? 'RAW' : bType);
        setBody(initialRequest.body || '');
      } else {
        // Reset defaults for a new request
        setName('');
        setMethod('GET');
        setUrl('{{base_url}}/api/v1/resource');
        setDescription('');
        setHeaders([{ key: 'Content-Type', value: 'application/json', enabled: true }]);
        setBodyType('NONE');
        setBody('{\n  "key": "value"\n}');
      }
      setActiveTab('headers');
      setError(null);
    }
  }, [isOpen, initialRequest]);

  if (!isOpen) return null;

  // Header management
  const handleAddHeader = () => {
    setHeaders((prev) => [...prev, { key: '', value: '', enabled: true }]);
  };

  const handleUpdateHeader = (index: number, field: keyof HeaderItem, value: any) => {
    setHeaders((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveHeader = (index: number) => {
    setHeaders((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyPreset = (key: string, value: string) => {
    setHeaders((prev) => {
      const existing = prev.findIndex((h) => h.key.toLowerCase() === key.toLowerCase());
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = { key, value, enabled: true };
        return copy;
      }
      return [...prev, { key, value, enabled: true }];
    });
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(body);
      setBody(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Endpoint URL is required');
      return;
    }

    const finalName = name.trim() || `${method} ${url.replace(/^https?:\/\/[^/]+/, '') || '/'}`;

    const requestItem: RequestItem = {
      id: initialRequest?.id || `req-${Math.random().toString(36).substring(2, 9)}`,
      name: finalName,
      method,
      url: url.trim(),
      description: description.trim() || undefined,
      headers: headers.filter((h) => h.key.trim() !== ''),
      body: bodyType === 'NONE' ? undefined : body,
      bodyType: bodyType === 'NONE' ? 'NONE' : bodyType,
    };

    onSave(collectionId, requestItem);
    onClose();
  };

  const getMethodColor = (m: HTTPMethod) => {
    switch (m) {
      case 'GET':
        return '#10b981';
      case 'POST':
        return '#3b82f6';
      case 'PUT':
        return '#f59e0b';
      case 'DELETE':
        return '#ef4444';
      case 'PATCH':
        return '#8b5cf6';
      default:
        return '#9ca3af';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
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
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
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
            backgroundColor: '#0f172a',
          }}
        >
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#6366f1" />
              {isEditing ? 'Configure Endpoint' : 'Add New Endpoint / Request'}
            </h2>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              Collection: <strong style={{ color: '#818cf8' }}>{collectionName}</strong>
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f3f4f6';
              e.currentTarget.style.backgroundColor = '#1f2937';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9ca3af';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div
                style={{
                  backgroundColor: '#7f1d1d33',
                  border: '1px solid #dc2626',
                  color: '#fca5a5',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                {error}
              </div>
            )}

            {/* Request Name */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>
                Request Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Get User Profile, Create Order, Search Items"
                style={{
                  width: '100%',
                  backgroundColor: '#0b0f19',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  padding: '9px 12px',
                  color: '#f3f4f6',
                  fontSize: '13px',
                }}
              />
            </div>

            {/* Method and URL Bar */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>
                HTTP Method & Endpoint URL <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={method}
                  onChange={(e) => {
                    const m = e.target.value as HTTPMethod;
                    setMethod(m);
                    if ((m === 'POST' || m === 'PUT' || m === 'PATCH') && bodyType === 'NONE') {
                      setBodyType('JSON');
                    }
                  }}
                  style={{
                    backgroundColor: '#1f2937',
                    color: getMethodColor(method),
                    fontWeight: 'bold',
                    fontSize: '13px',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    padding: '0 12px',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '100px',
                  }}
                >
                  {HTTP_METHODS.map((m) => (
                    <option key={m} value={m} style={{ backgroundColor: '#111827', color: getMethodColor(m), fontWeight: 'bold' }}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.example.com/v1/orders or {{base_url}}/orders"
                  required
                  style={{
                    flex: 1,
                    backgroundColor: '#0b0f19',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    padding: '9px 12px',
                    color: '#f3f4f6',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                Tip: Use <code>{`{{base_url}}`}</code> for environment base path replacement.
              </div>
            </div>

            {/* Config Tabs: Headers | Body | Settings */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #1f2937', paddingBottom: '2px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('headers')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: activeTab === 'headers' ? '2px solid #6366f1' : '2px solid transparent',
                    color: activeTab === 'headers' ? '#f3f4f6' : '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Sliders size={13} />
                  Headers ({headers.filter((h) => h.enabled && h.key).length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('body')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: activeTab === 'body' ? '2px solid #6366f1' : '2px solid transparent',
                    color: activeTab === 'body' ? '#f3f4f6' : '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <FileText size={13} />
                  Body {bodyType !== 'NONE' && <span style={{ fontSize: '10px', color: '#10b981' }}>({bodyType})</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: activeTab === 'settings' ? '2px solid #6366f1' : '2px solid transparent',
                    color: activeTab === 'settings' ? '#f3f4f6' : '#9ca3af',
                  }}
                >
                  Description & Info
                </button>
              </div>

              {/* Tab: Headers */}
              {activeTab === 'headers' && (
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af', alignSelf: 'center', marginRight: '4px' }}>Presets:</span>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('Content-Type', 'application/json')}
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#1f2937',
                          color: '#d1d5db',
                          border: '1px solid #374151',
                          cursor: 'pointer',
                        }}
                      >
                        + JSON
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('Authorization', 'Bearer {{auth_token}}')}
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#1f2937',
                          color: '#d1d5db',
                          border: '1px solid #374151',
                          cursor: 'pointer',
                        }}
                      >
                        + Bearer Token
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('Accept', 'application/json')}
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#1f2937',
                          color: '#d1d5db',
                          border: '1px solid #374151',
                          cursor: 'pointer',
                        }}
                      >
                        + Accept JSON
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddHeader}
                      style={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '4px',
                        color: '#f3f4f6',
                        cursor: 'pointer',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Plus size={13} /> Add Header
                    </button>
                  </div>

                  {headers.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280', fontSize: '12px', border: '1px dashed #374151', borderRadius: '6px' }}>
                      No custom headers configured. Click "Add Header" or use a preset above.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {headers.map((h, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={h.enabled}
                            onChange={(e) => handleUpdateHeader(idx, 'enabled', e.target.checked)}
                            title="Enable or disable header"
                            style={{ cursor: 'pointer', accentColor: '#6366f1' }}
                          />
                          <input
                            type="text"
                            value={h.key}
                            onChange={(e) => handleUpdateHeader(idx, 'key', e.target.value)}
                            placeholder="Header Key (e.g. Content-Type)"
                            style={{
                              flex: 1,
                              backgroundColor: '#0b0f19',
                              border: '1px solid #374151',
                              borderRadius: '4px',
                              padding: '6px 10px',
                              color: '#f3f4f6',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              opacity: h.enabled ? 1 : 0.5,
                            }}
                          />
                          <input
                            type="text"
                            value={h.value}
                            onChange={(e) => handleUpdateHeader(idx, 'value', e.target.value)}
                            placeholder="Value"
                            style={{
                              flex: 1.5,
                              backgroundColor: '#0b0f19',
                              border: '1px solid #374151',
                              borderRadius: '4px',
                              padding: '6px 10px',
                              color: '#a5f3fc',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              opacity: h.enabled ? 1 : 0.5,
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveHeader(idx)}
                            title="Delete header row"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#6b7280',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '4px',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Body */}
              {activeTab === 'body' && (
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>Body Type:</span>
                      {(['NONE', 'JSON', 'RAW'] as const).map((type) => (
                        <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: bodyType === type ? '#6366f1' : '#9ca3af' }}>
                          <input
                            type="radio"
                            name="bodyType"
                            checked={bodyType === type}
                            onChange={() => setBodyType(type)}
                            style={{ accentColor: '#6366f1', cursor: 'pointer' }}
                          />
                          {type}
                        </label>
                      ))}
                    </div>

                    {bodyType === 'JSON' && (
                      <button
                        type="button"
                        onClick={handleFormatJson}
                        style={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '4px',
                          color: '#d1d5db',
                          cursor: 'pointer',
                          padding: '4px 10px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Sparkles size={12} color="#a5f3fc" /> Beautify JSON
                      </button>
                    )}
                  </div>

                  {bodyType === 'NONE' ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: '12px', border: '1px dashed #374151', borderRadius: '6px' }}>
                      This request does not have a body payload. Select <strong>JSON</strong> or <strong>RAW</strong> above to add one.
                    </div>
                  ) : (
                    <div>
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={8}
                        placeholder={bodyType === 'JSON' ? '{\n  "name": "Widget",\n  "price": 99.99\n}' : 'Raw request payload...'}
                        style={{
                          width: '100%',
                          backgroundColor: '#0b0f19',
                          border: '1px solid #374151',
                          borderRadius: '6px',
                          padding: '10px 12px',
                          color: '#a5f3fc',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          lineHeight: '1.5',
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Settings */}
              {activeTab === 'settings' && (
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', display: 'block', marginBottom: '6px' }}>
                      Endpoint Documentation / Notes
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      placeholder="Explain what this endpoint does, parameter descriptions, expected responses, etc."
                      style={{
                        width: '100%',
                        backgroundColor: '#0b0f19',
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        color: '#f3f4f6',
                        fontSize: '12px',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid #1f2937',
              backgroundColor: '#0f172a',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#1f2937',
                color: '#d1d5db',
                border: '1px solid #374151',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Check size={16} />
              {isEditing ? 'Save Changes' : 'Create Endpoint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
