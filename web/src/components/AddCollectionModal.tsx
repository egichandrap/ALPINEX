import React, { useState, useRef } from 'react';
import {
  X,
  Layers,
  Upload,
  FileCode,
  FolderPlus,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { CollectionItem } from '../types/collection';
import { parsePostmanCollection, parseSwaggerOpenAPI } from '../utils/importers';

interface AddCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCollection: (collection: CollectionItem) => void;
}

export const AddCollectionModal: React.FC<AddCollectionModalProps> = ({
  isOpen,
  onClose,
  onAddCollection,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'postman' | 'swagger'>('create');

  // Manual Create State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  // Importer States
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedPreview, setParsedPreview] = useState<CollectionItem | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Tab Change
  const handleTabChange = (tab: 'create' | 'postman' | 'swagger') => {
    setActiveTab(tab);
    setRawText('');
    setFileName('');
    setParsedPreview(null);
    setParseError(null);
  };

  // Trigger file parser
  const handleParseContent = (content: string, type: 'postman' | 'swagger') => {
    setParseError(null);
    if (!content.trim()) {
      setParsedPreview(null);
      return;
    }

    try {
      if (type === 'postman') {
        const result = parsePostmanCollection(content);
        setParsedPreview(result);
      } else {
        const result = parseSwaggerOpenAPI(content);
        setParsedPreview(result);
      }
    } catch (err: any) {
      setParsedPreview(null);
      setParseError(err.message || 'Failed to parse collection.');
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(`${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      setRawText(text);
      handleParseContent(text, activeTab as 'postman' | 'swagger');
    };
    reader.onerror = () => {
      setParseError('Failed to read file from disk.');
    };
    reader.readAsText(file);
  };

  // Handle Raw Text Change
  const handleTextChange = (text: string) => {
    setRawText(text);
    handleParseContent(text, activeTab as 'postman' | 'swagger');
  };

  // Handle Submit Manual Create
  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCollection: CollectionItem = {
      id: `col-${Math.random().toString(36).substring(2, 9)}`,
      name: name.trim(),
      description: description.trim(),
      baseUrl: baseUrl.trim(),
      requests: [],
      createdAt: new Date().toISOString(),
    };

    onAddCollection(newCollection);
    resetAndClose();
  };

  // Handle Submit Importer
  const handleImport = () => {
    if (!parsedPreview) return;
    onAddCollection(parsedPreview);
    resetAndClose();
  };

  const resetAndClose = () => {
    setName('');
    setDescription('');
    setBaseUrl('');
    setRawText('');
    setFileName('');
    setParsedPreview(null);
    setParseError(null);
    onClose();
  };

  return (
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
        if (e.target === e.currentTarget) resetAndClose();
      }}
    >
      <div
        style={{
          width: '680px',
          maxHeight: '90vh',
          backgroundColor: '#111827',
          border: '1px solid #1f2937',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
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
                backgroundColor: '#1e1b4b',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f3f4f6', margin: 0 }}>
                Add API Collection
              </h2>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0 0' }}>
                Create a new collection or import from Postman and Swagger/OpenAPI.
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
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
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            padding: '0 24px',
            borderBottom: '1px solid #1f2937',
            backgroundColor: '#0b0f19',
          }}
        >
          <button
            onClick={() => handleTabChange('create')}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'create' ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === 'create' ? '#f3f4f6' : '#9ca3af',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FolderPlus size={15} />
            Create New
          </button>
          <button
            onClick={() => handleTabChange('postman')}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'postman' ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === 'postman' ? '#f3f4f6' : '#9ca3af',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Upload size={15} />
            Import Postman Collection
          </button>
          <button
            onClick={() => handleTabChange('swagger')}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'swagger' ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === 'swagger' ? '#f3f4f6' : '#9ca3af',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FileCode size={15} />
            Import Swagger / OpenAPI
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: CREATE NEW */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateManual} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#e5e7eb', marginBottom: '6px' }}>
                  Collection Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Payment Gateway API"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0b0f19',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    color: '#f3f4f6',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#e5e7eb', marginBottom: '6px' }}>
                  Base URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://api.example.com/v1 or {{base_url}}"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0b0f19',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    color: '#f3f4f6',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#e5e7eb', marginBottom: '6px' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe what this collection tests..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0b0f19',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    color: '#f3f4f6',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={resetAndClose}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#e5e7eb',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: name.trim() ? '#6366f1' : '#4338ca',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: name.trim() ? 'pointer' : 'not-allowed',
                    opacity: name.trim() ? 1 : 0.6,
                  }}
                >
                  Create Collection
                </button>
              </div>
            </form>
          )}

          {/* TAB 2 & 3: IMPORTERS (POSTMAN & SWAGGER) */}
          {(activeTab === 'postman' || activeTab === 'swagger') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* File Dropzone */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept={activeTab === 'postman' ? '.json' : '.json,.yaml,.yml'}
                onChange={handleFileUpload}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #374151',
                  borderRadius: '8px',
                  padding: '24px',
                  textAlign: 'center',
                  backgroundColor: '#0b0f19',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#1e293b',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                  }}
                >
                  <Upload size={20} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#f3f4f6' }}>
                  Click to select file or drag & drop here
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                  {activeTab === 'postman'
                    ? 'Supports Postman Collection v2.0 or v2.1 (.json)'
                    : 'Supports OpenAPI 3.x and Swagger 2.0 (.json, .yaml, .yml)'}
                </div>
                {fileName && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '12px',
                      padding: '4px 10px',
                      backgroundColor: '#1e293b',
                      borderRadius: '16px',
                      fontSize: '12px',
                      color: '#34d399',
                      border: '1px solid #059669',
                    }}
                  >
                    <FileText size={14} />
                    <span>{fileName}</span>
                  </div>
                )}
              </div>

              {/* Or Paste Raw Text */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', marginBottom: '6px' }}>
                  OR PASTE SPECIFICATION DIRECTLY ({activeTab === 'postman' ? 'JSON' : 'JSON / YAML'})
                </label>
                <textarea
                  rows={6}
                  placeholder={
                    activeTab === 'postman'
                      ? '{\n  "info": { "name": "My Postman Collection" },\n  "item": [...]\n}'
                      : 'openapi: 3.0.0\ninfo:\n  title: My Service API\npaths:\n  /users:\n    get:\n      summary: List Users'
                  }
                  value={rawText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0b0f19',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    color: '#a5f3fc',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Error Message */}
              {parseError && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#450a0a',
                    border: '1px solid #991b1b',
                    borderRadius: '6px',
                    color: '#f87171',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Preview Box if Valid */}
              {parsedPreview && (
                <div
                  style={{
                    backgroundColor: '#0b0f19',
                    border: '1px solid #059669',
                    borderRadius: '8px',
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', marginBottom: '8px' }}>
                    <CheckCircle2 size={16} />
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                      Ready to import: {parsedPreview.name}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '10px' }}>
                    Detected <strong>{parsedPreview.requests.length}</strong> endpoints
                    {parsedPreview.baseUrl ? ` • Base URL: ${parsedPreview.baseUrl}` : ''}
                  </div>

                  {/* Sample endpoints list */}
                  <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {parsedPreview.requests.slice(0, 8).map((req, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '11px',
                          padding: '4px 6px',
                          backgroundColor: '#111827',
                          borderRadius: '4px',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 'bold',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            backgroundColor:
                              req.method === 'GET'
                                ? '#064e3b'
                                : req.method === 'POST'
                                ? '#1e3a8a'
                                : req.method === 'DELETE'
                                ? '#450a0a'
                                : '#78350f',
                            color:
                              req.method === 'GET'
                                ? '#34d399'
                                : req.method === 'POST'
                                ? '#60a5fa'
                                : req.method === 'DELETE'
                                ? '#f87171'
                                : '#fbbf24',
                          }}
                        >
                          {req.method}
                        </span>
                        <span style={{ color: '#f3f4f6', fontWeight: '500' }}>{req.name}</span>
                        <span style={{ color: '#6b7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {req.url}
                        </span>
                      </div>
                    ))}
                    {parsedPreview.requests.length > 8 && (
                      <div style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center', marginTop: '4px' }}>
                        + {parsedPreview.requests.length - 8} more endpoints
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={resetAndClose}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    color: '#e5e7eb',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={!parsedPreview}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: parsedPreview ? '#10b981' : '#065f46',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: parsedPreview ? 'pointer' : 'not-allowed',
                    opacity: parsedPreview ? 1 : 0.6,
                  }}
                >
                  Import Collection ({parsedPreview ? parsedPreview.requests.length : 0} Requests)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
