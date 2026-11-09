import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  HelpCircle,
  Play,
  Lightbulb,
  Compass
} from 'lucide-react';

interface TutorialTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'dashboard' | 'api' | 'functional' | 'performance' | 'executions' | 'reports') => void;
}

interface TourStep {
  id: string;
  targetSelector?: string;
  tab?: 'dashboard' | 'api' | 'functional' | 'performance' | 'executions' | 'reports';
  placement: 'bottom' | 'top' | 'right' | 'left' | 'center';
  badge: string;
  title: string;
  description: string;
  tip?: string;
}

const STEPS: TourStep[] = [
  {
    id: 'welcome',
    placement: 'center',
    badge: 'SELAMAT DATANG',
    title: 'Selamat Datang di AlpineX Studio!',
    description:
      'AlpineX adalah platform pengujian API terpadu yang menggabungkan API Client, Functional End-to-End Automation, dan Distributed Load Testing Engine berbasis k6. Mari ikuti panduan interaktif singkat ini untuk mempelajari fungsi tombol dan alur kerja utama aplikasi.',
    tip: 'Tur ini akan menyorot langsung tombol yang sedang dijelaskan dengan bubble tooltip interaktif.',
  },
  {
    id: 'project-switcher',
    targetSelector: '[data-tour="project-switcher"]',
    tab: 'api',
    placement: 'bottom',
    badge: 'LANGKAH 1 DARI 7 • PROJECT SWITCHER',
    title: 'Project Switcher & Workspace',
    description:
      'Tombol ini adalah pengelola active project Anda. Anda dapat berpindah project, membuat project baru (+ New Project), atau menghapus project aktif beserta datanya.',
    tip: 'Setiap active project memiliki API Collections, Test Suites, Performance Targets, dan Reports yang terisolasi secara mandiri.',
  },
  {
    id: 'nav-sidebar',
    targetSelector: '[data-tour="nav-sidebar"]',
    tab: 'api',
    placement: 'right',
    badge: 'LANGKAH 2 DARI 7 • MENU NAVIGASI',
    title: 'Menu Sidebar Modul Utama',
    description:
      'Gunakan menu sidebar ini untuk berpindah modul: API Collections (Studio interaktif), Functional Suites (automasi alur bisnis berantai), Performance Studio (uji beban k6), Execution Center (antrian worker), dan Reports.',
    tip: 'Klik pada modul yang ingin Anda gunakan untuk langsung membuka workspace pengujian terkait.',
  },
  {
    id: 'add-collection',
    targetSelector: '[data-tour="add-collection-btn"]',
    tab: 'api',
    placement: 'right',
    badge: 'LANGKAH 3 DARI 7 • API COLLECTIONS',
    title: 'Tombol "+ Add Collection"',
    description:
      'Klik tombol ini untuk membuat collection baru secara manual atau mengimpor file Postman Collection v2.1 dan OpenAPI / Swagger JSON.',
    tip: 'Struktur folder bertingkat (nested folders) dari file Postman akan dipertahankan secara rapi dan scrollable di panel ini.',
  },
  {
    id: 'send-request',
    targetSelector: '[data-tour="send-request-btn"]',
    tab: 'api',
    placement: 'left',
    badge: 'LANGKAH 4 DARI 7 • REQUEST BUILDER',
    title: 'Tombol "Send" Request',
    description:
      'Pilih method (GET, POST, PUT, DELETE), masukkan URL endpoint, konfigurasikan headers atau body payload, lalu klik "Send" untuk mengeksekusi request HTTP langsung dan melihat responsenya.',
    tip: 'Gunakan variabel {{base_url}} untuk menyesuaikan target server secara dinamis sesuai environment.',
  },
  {
    id: 'functional-suites',
    targetSelector: '[data-tour="new-suite-btn"]',
    tab: 'functional',
    placement: 'bottom',
    badge: 'LANGKAH 5 DARI 7 • FUNCTIONAL SUITES',
    title: 'Tombol "+ New Test Suite"',
    description:
      'Rangkai pengujian skenario fungsional berantai antar endpoint. Anda dapat menghubungkan Step 1 (misal Login Admin) ke Step 2 (misal Transfer Loan), mengekstrak token respon secara otomatis, dan memvalidasi assertions.',
    tip: 'Respon JSON dari endpoint pertama otomatis dapat disuntikkan ke endpoint berikutnya menggunakan sintaks {{variable_name}}.',
  },
  {
    id: 'performance-studio',
    targetSelector: '[data-tour="add-perf-target-btn"]',
    tab: 'performance',
    placement: 'bottom',
    badge: 'LANGKAH 6 DARI 7 • PERFORMANCE STUDIO',
    title: 'Tombol "+ Add Target Endpoint"',
    description:
      'Tambahkan endpoint yang ingin diuji bebannya. Anda dapat memilih 4 profil workload: Smoke (Sanity), Load (Kapasitas), Stress (Batas Maksimal), atau Spike (Lonjakan Tiba-tiba), lalu jalankan secara paralel.',
    tip: 'Engine k6 di AlpineX melakukan HTTP request riil. Jika VPN kantor terputus atau firewall memblokir, sistem akan langsung mencatat 100% SLA Breach.',
  },
  {
    id: 'tutorial-btn',
    targetSelector: '[data-tour="tutorial-btn"]',
    tab: 'api',
    placement: 'bottom',
    badge: 'LANGKAH 7 DARI 7 • TUTORIAL MODE',
    title: 'Tombol "Tutorial Mode"',
    description:
      'Tur panduan interaktif telah selesai! Kapan pun Anda membutuhkan panduan ulang atau ingin mengenalkan fitur ini ke rekan tim, cukup klik tombol "Tutorial Mode" ini di navbar atas.',
    tip: 'Selamat menguji API Anda dengan cepat, terstruktur, dan andal di AlpineX Studio!',
  },
];

export const TutorialTour: React.FC<TutorialTourProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const current = STEPS[stepIndex];
    if (current.tab && onNavigateTab) {
      onNavigateTab(current.tab);
    }

    const updatePosition = () => {
      if (!current.targetSelector) {
        setTargetRect(null);
        return;
      }

      const el = document.querySelector(current.targetSelector);
      if (el) {
        const r = el.getBoundingClientRect();
        setTargetRect({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
        });
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();
    const t1 = setTimeout(updatePosition, 100);
    const t2 = setTimeout(updatePosition, 280);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [stepIndex, isOpen]);

  if (!isOpen) return null;

  const currentStep = STEPS[stepIndex];
  const isWelcome = currentStep.id === 'welcome';
  const isLast = stepIndex === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('alpinex_tutorial_completed', 'true');
    } catch (e) {
      console.error('Failed to save tutorial status', e);
    }
    onClose();
  };

  // Calculate Tooltip Coordinates
  const getTooltipStyle = (): { top: number; left: number; arrowPlacement: string } => {
    const tooltipWidth = 360;
    const padding = 14;

    if (!targetRect || isWelcome) {
      return {
        top: Math.max(20, window.innerHeight / 2 - 180),
        left: Math.max(20, window.innerWidth / 2 - tooltipWidth / 2),
        arrowPlacement: 'none',
      };
    }

    const { top, left, width, height } = targetRect;

    if (currentStep.placement === 'right') {
      const calcLeft = left + width + padding;
      const calcTop = Math.max(16, Math.min(window.innerHeight - 280, top + height / 2 - 100));
      return { top: calcTop, left: calcLeft, arrowPlacement: 'left' };
    }

    if (currentStep.placement === 'left') {
      const calcLeft = Math.max(16, left - tooltipWidth - padding);
      const calcTop = Math.max(16, Math.min(window.innerHeight - 280, top + height / 2 - 100));
      return { top: calcTop, left: calcLeft, arrowPlacement: 'right' };
    }

    if (currentStep.placement === 'top') {
      const calcTop = Math.max(16, top - 260 - padding);
      const calcLeft = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, left + width / 2 - tooltipWidth / 2));
      return { top: calcTop, left: calcLeft, arrowPlacement: 'bottom' };
    }

    // Default 'bottom'
    const calcTop = top + height + padding;
    const calcLeft = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, left + width / 2 - tooltipWidth / 2));
    return { top: calcTop, left: calcLeft, arrowPlacement: 'top' };
  };

  const tooltipCoords = getTooltipStyle();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99990,
        pointerEvents: 'auto',
      }}
    >
      {/* Spotlight Cutout Overlay */}
      {targetRect && !isWelcome ? (
        <div
          style={{
            position: 'fixed',
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: '8px',
            border: '2px solid #6366f1',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.78), 0 0 25px rgba(99, 102, 241, 0.9)',
            zIndex: 99991,
            pointerEvents: 'none',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      ) : (
        /* Full Backdrop for Welcome Modal */
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(3px)',
            zIndex: 99991,
          }}
        />
      )}

      {/* Floating Bubble Tooltip / Modal */}
      <div
        style={{
          position: 'fixed',
          top: tooltipCoords.top,
          left: tooltipCoords.left,
          width: isWelcome ? '480px' : '360px',
          maxWidth: 'calc(100vw - 32px)',
          backgroundColor: '#111827',
          border: '1px solid #4338ca',
          borderRadius: '10px',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.9), 0 0 20px rgba(99, 102, 241, 0.3)',
          zIndex: 99995,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'top 0.25s ease, left 0.25s ease',
        }}
      >
        {/* Progress Line */}
        <div style={{ height: '3px', backgroundColor: '#1f2937', width: '100%' }}>
          <div
            style={{
              height: '100%',
              backgroundColor: '#6366f1',
              width: `${((stepIndex + 1) / STEPS.length) * 100}%`,
              transition: 'width 0.25s ease',
            }}
          />
        </div>

        {/* Bubble Header */}
        <div
          style={{
            padding: '14px 18px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1f2937',
            backgroundColor: '#0b0f19',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Compass size={13} color="#818cf8" />
            <span
              style={{
                fontSize: '10px',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                color: '#a5b4fc',
              }}
            >
              {currentStep.badge}
            </span>
          </div>

          <button
            onClick={handleComplete}
            title="Tutup / Lewati Tur"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Bubble Content */}
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#f3f4f6', margin: 0 }}>
              {currentStep.title}
            </h4>
            <p style={{ fontSize: '12px', color: '#d1d5db', lineHeight: '1.55', marginTop: '6px', margin: '6px 0 0 0' }}>
              {currentStep.description}
            </p>
          </div>

          {currentStep.tip && (
            <div
              style={{
                backgroundColor: '#1e1b4b33',
                border: '1px solid #3730a3',
                borderRadius: '6px',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginTop: '4px',
              }}
            >
              <Lightbulb size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '11px', color: '#c7d2fe', lineHeight: '1.4' }}>
                {currentStep.tip}
              </span>
            </div>
          )}
        </div>

        {/* Bubble Footer & Step Controls */}
        <div
          style={{
            padding: '10px 18px',
            backgroundColor: '#0b0f19',
            borderTop: '1px solid #1f2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={handleComplete}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6b7280',
              fontSize: '11px',
              fontWeight: '500',
              cursor: 'pointer',
              padding: '4px 6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
          >
            Lewati Tur
          </button>

          {/* Dots Indicator */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {STEPS.map((_, idx) => (
              <span
                key={idx}
                onClick={() => setStepIndex(idx)}
                style={{
                  width: idx === stepIndex ? '12px' : '5px',
                  height: '5px',
                  borderRadius: '3px',
                  backgroundColor: idx === stepIndex ? '#6366f1' : '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {stepIndex > 0 && (
              <button
                onClick={handlePrev}
                style={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  color: '#e5e7eb',
                  padding: '5px 10px',
                  borderRadius: '5px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ArrowLeft size={11} /> Prev
              </button>
            )}

            <button
              onClick={handleNext}
              style={{
                backgroundColor: isLast ? '#10b981' : '#4f46e5',
                border: 'none',
                color: 'white',
                padding: '5px 14px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: isLast ? '0 0 10px rgba(16, 185, 129, 0.4)' : '0 0 10px rgba(99, 102, 241, 0.4)',
              }}
            >
              {isWelcome ? (
                <>
                  Mulai Tur <ArrowRight size={11} />
                </>
              ) : isLast ? (
                <>
                  <CheckCircle2 size={12} /> Selesai
                </>
              ) : (
                <>
                  Next <ArrowRight size={11} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
