import React, { useEffect } from 'react';

/**
 * Toast Notification Component
 */
export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const alertClass = type === 'error' ? 'alert-danger' : type === 'success' ? 'alert-success' : 'alert-warning';

  return (
    <div className={`alert ${alertClass}`} style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      minWidth: '280px',
      maxWidth: '400px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{ flex: 1 }}>{message}</div>
      <button 
        onClick={onClose} 
        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
      >
        ✕
      </button>
    </div>
  );
}
