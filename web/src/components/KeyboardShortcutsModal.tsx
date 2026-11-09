import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    { keys: [`${modKey}`, 'Enter'], description: 'Send active API Request' },
    { keys: [`${modKey}`, 'S'], description: 'Save current Request changes' },
    { keys: ['Esc'], description: 'Close modals & dialogs' },
    { keys: ['?'], description: 'Toggle this Shortcuts Guide' },
  ];

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
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#111827',
          border: '1px solid #374151',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1f2937',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Keyboard size={18} color="#818cf8" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f3f4f6' }}>
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: '#0b0f19',
                border: '1px solid #1f2937',
              }}
            >
              <span style={{ fontSize: '13px', color: '#d1d5db' }}>{sc.description}</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {sc.keys.map((k, kIdx) => (
                  <kbd
                    key={kIdx}
                    style={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #4b5563',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#a5f3fc',
                      fontFamily: 'monospace',
                    }}
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #1f2937',
            backgroundColor: '#0b0f19',
            fontSize: '12px',
            color: '#6b7280',
            textAlign: 'center',
          }}
        >
          Press <kbd style={{ padding: '1px 5px', background: '#1f2937', borderRadius: '3px' }}>Esc</kbd> anytime to dismiss.
        </div>
      </div>
    </div>
  );
};
