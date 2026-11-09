import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '380px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 3500);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const getStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          border: '1px solid #059669',
          bg: '#064e3b',
          color: '#34d399',
          icon: <CheckCircle2 size={16} color="#34d399" />,
        };
      case 'error':
        return {
          border: '1px solid #dc2626',
          bg: '#450a0a',
          color: '#f87171',
          icon: <AlertCircle size={16} color="#f87171" />,
        };
      case 'warning':
        return {
          border: '1px solid #d97706',
          bg: '#451a03',
          color: '#fbbf24',
          icon: <AlertTriangle size={16} color="#fbbf24" />,
        };
      case 'info':
      default:
        return {
          border: '1px solid #4f46e5',
          bg: '#1e1b4b',
          color: '#818cf8',
          icon: <Info size={16} color="#818cf8" />,
        };
    }
  };

  const style = getStyle();

  return (
    <div
      style={{
        pointerEvents: 'auto',
        backgroundColor: '#111827',
        border: style.border,
        borderLeft: `4px solid ${style.color}`,
        borderRadius: '8px',
        padding: '12px 14px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ flexShrink: 0 }}>{style.icon}</div>
      <div style={{ flex: 1, fontSize: '13px', color: '#f3f4f6', fontWeight: 500, lineHeight: 1.4 }}>
        {toast.message}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#9ca3af',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
      >
        <X size={14} />
      </button>
    </div>
  );
};
