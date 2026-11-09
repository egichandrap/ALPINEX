import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  FolderTree,
  ListPlus,
  Zap,
  Activity,
  FileBarChart,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  HelpCircle,
  Folder,
  Send,
  Sliders,
  ShieldAlert
} from 'lucide-react';

interface TutorialTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'dashboard' | 'api' | 'functional' | 'performance' | 'executions' | 'reports') => void;
}

interface TourStep {
  id: string;
  tab: 'dashboard' | 'api' | 'functional' | 'performance' | 'executions' | 'reports';
  badge: string;
  badgeColor: { bg: string; text: string };
  title: string;
  subtitle: string;
  description: string;
  features: { icon: React.ReactNode; title: string; desc: string }[];
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    tab: 'api',
    badge: 'LANGKAH 1 DARI 6 • PENGENALAN',
    badgeColor: { bg: '#312e81', text: '#c7d2fe' },
    title: 'Selamat Datang di AlpineX Studio!',
    subtitle: 'Enterprise API Development, Functional Automation & k6 Performance Engine',
    description:
      'AlpineX adalah platform terpadu untuk pengujian API secara komprehensif. Mari ikuti tur singkat ini untuk memahami fungsi tiap menu dan tombol utama.',
    features: [
      {
        icon: <Send size={15} color="#38bdf8" />,
        title: 'Interactive API Studio',
        desc: 'Eksplorasi endpoint HTTP secara cepat dengan dukungan autotoken, body, dan header.',
      },
      {
        icon: <ListPlus size={15} color="#10b981" />,
        title: 'Chained Functional Suites',
        desc: 'Rangkai pengujian end-to-end berantai antar endpoint (misal auth token → transfer loan).',
      },
      {
        icon: <Zap size={15} color="#f59e0b" />,
        title: 'Performance Studio (k6)',
        desc: 'Uji beban paralel (Smoke, Load, Stress, Spike) dengan deteksi kegagalan VPN / firewall nyata.',
      },
    ],
  },
  {
    id: 'project-switcher',
    tab: 'api',
    badge: 'LANGKAH 2 DARI 6 • MULTI-PROJECT',
    badgeColor: { bg: '#064e3b', text: '#34d399' },
    title: 'Project Switcher & Workspace Isolation',
    subtitle: 'Isolasi data antar project pada pojok kiri atas',
    description:
      'Di bagian atas header, Anda dapat mengelola active project Anda. Setiap project memiliki data yang sepenuhnya terpisah.',
    features: [
      {
        icon: <Layers size={15} color="#6366f1" />,
        title: 'Isolasi Data Penuh',
        desc: 'API Collections, Test Suites, Performance Targets, dan Report milik satu project tidak akan tercampur dengan project lain.',
      },
      {
        icon: <FolderTree size={15} color="#38bdf8" />,
        title: 'Tombol + New Project',
        desc: 'Klik tombol "+ New Project" di dropdown untuk membuat project atau workspace baru kapan saja.',
      },
      {
        icon: <X size={15} color="#ef4444" />,
        title: 'Tombol Hapus Project',
        desc: 'Ikon tong sampah merah pada project aktif memungkinkan Anda menghapus project yang sudah tidak terpakai beserta datanya.',
      },
    ],
  },
  {
    id: 'collections-import',
    tab: 'api',
    badge: 'LANGKAH 3 DARI 6 • API COLLECTIONS',
    badgeColor: { bg: '#1e3a8a', text: '#60a5fa' },
    title: 'API Collections & Multi-Folder Importer',
    subtitle: 'Panel koleksi API dengan folder hierarki tak terbatas',
    description:
      'Di panel kiri API Studio, Anda dapat mengatur endpoint API ke dalam folder terstruktur atau mengimpor file Postman / OpenAPI.',
    features: [
      {
        icon: <Folder size={15} color="#fbbf24" />,
        title: 'Tombol "+ Add Collection"',
        desc: 'Gunakan tombol ini untuk membuat collection baru secara manual atau mengimpor file.',
      },
      {
        icon: <FolderTree size={15} color="#34d399" />,
        title: 'Impor Postman & Swagger / OpenAPI',
        desc: 'Mendukung Postman v2.1 (termasuk folder bersarang bertingkat yang rapi & scrollable) dan OpenAPI JSON.',
      },
      {
        icon: <Send size={15} color="#38bdf8" />,
        title: 'Tombol "+ Add Request"',
        desc: 'Tambahkan endpoint baru ke dalam folder koleksi dengan method GET, POST, PUT, DELETE, dsb.',
      },
    ],
  },
  {
    id: 'functional-suites',
    tab: 'functional',
    badge: 'LANGKAH 4 DARI 6 • FUNCTIONAL SUITES',
    badgeColor: { bg: '#3b0764', text: '#c084fc' },
    title: 'Functional Automation Suites (End-to-End)',
    subtitle: 'Pengujian alur bisnis berantai dengan ekstraksi variabel',
    description:
      'Menu Functional Suites dirancang untuk menguji alur bisnis secara otomatis dari satu endpoint ke endpoint berikutnya.',
    features: [
      {
        icon: <ListPlus size={15} color="#a855f7" />,
        title: 'Tombol "+ New Test Suite"',
        desc: 'Buat skenario test baru, pilih koleksi API mana yang menjadi sumber endpoint.',
      },
      {
        icon: <Zap size={15} color="#f59e0b" />,
        title: 'Variable Extraction & Chaining',
        desc: 'Respon dari Step 1 (misal token login) otomatis disimpan dan disuntikkan ke URL atau body di Step 2 (misal {{auth_token}}).',
      },
      {
        icon: <CheckCircle2 size={15} color="#10b981" />,
        title: 'Assertions Engine',
        desc: 'Verifikasi HTTP Status code, Response Time SLA, dan JSONPath otomatis saat test dijalankan.',
      },
    ],
  },
  {
    id: 'performance-studio',
    tab: 'performance',
    badge: 'LANGKAH 5 DARI 6 • PERFORMANCE & LOAD TESTING',
    badgeColor: { bg: '#7c2d12', text: '#fdba74' },
    title: 'Performance & Load Testing Studio (k6)',
    subtitle: 'Uji beban konkurensi paralel & deteksi koneksi VPN nyata',
    description:
      'Jalankan uji beban riil untuk mengukur kapasitas throughput (RPS), batas latency tail (P95), dan deteksi kegagalan jaringan.',
    features: [
      {
        icon: <Sliders size={15} color="#f97316" />,
        title: '4 Profil Workload (Smoke, Load, Stress, Spike)',
        desc: 'Tiap endpoint bisa diberi peran berbeda (misal endpoint login di-smoke test, endpoint catalog di-stress test).',
      },
      {
        icon: <ShieldAlert size={15} color="#ef4444" />,
        title: 'Deteksi VPN & Firewall Riil',
        desc: 'Panggilan HTTP sungguhan dikirim. Jika VPN mati atau firewall memblokir, sistem langsung mencatat 100% SLA Breach.',
      },
      {
        icon: <Zap size={15} color="#38bdf8" />,
        title: 'Parallel Concurrent Run',
        desc: 'Jalankan seluruh target sekaligus secara paralel atau uji satu target terisolasi dengan tombol "Run This".',
      },
    ],
  },
  {
    id: 'execution-reports',
    tab: 'reports',
    badge: 'LANGKAH 6 DARI 6 • MONITORING & REPORT',
    badgeColor: { bg: '#134e4a', text: '#5eead4' },
    title: 'Execution Center & Regression Reports',
    subtitle: 'Pemantauan background worker dan perbandingan SLA',
    description:
      'Dua menu pelengkap untuk memantau performa jangka panjang dan antrian eksekusi background worker.',
    features: [
      {
        icon: <Activity size={15} color="#6366f1" />,
        title: 'Execution Center (Queue)',
        desc: 'Memantau task asinkron yang diantrikan ke Redis worker (Go engine) untuk automasi CI/CD atau scheduled runs.',
      },
      {
        icon: <FileBarChart size={15} color="#10b981" />,
        title: 'Reports & Regression Compare',
        desc: 'Bandingkan metrik baseline vs candidate untuk mendeteksi degradasi performa atau peningkatan kapasitas.',
      },
      {
        icon: <HelpCircle size={15} color="#f59e0b" />,
        title: 'Tombol "Tutorial Mode"',
        desc: 'Tombol ini selalu ada di pojok kanan atas header jika sewaktu-waktu Anda ingin membuka panduan ini kembali.',
      },
    ],
  },
];

export const TutorialTour: React.FC<TutorialTourProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      const first = TOUR_STEPS[0];
      if (first && onNavigateTab) {
        onNavigateTab(first.tab);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const nextStep = TOUR_STEPS[nextIdx];
      if (nextStep && onNavigateTab) {
        onNavigateTab(nextStep.tab);
      }
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      const prevStep = TOUR_STEPS[prevIdx];
      if (prevStep && onNavigateTab) {
        onNavigateTab(prevStep.tab);
      }
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('alpinex_tutorial_completed', 'true');
    } catch (e) {
      console.error('Failed to set tutorial flag', e);
    }
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
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#111827',
          border: '1px solid #4338ca',
          borderRadius: '12px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 25px rgba(99, 102, 241, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Progress Bar */}
        <div style={{ height: '4px', backgroundColor: '#1f2937', width: '100%' }}>
          <div
            style={{
              height: '100%',
              backgroundColor: '#6366f1',
              width: `${((currentStepIndex + 1) / TOUR_STEPS.length) * 100}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1f2937',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: currentStep.badgeColor.bg,
                color: currentStep.badgeColor.text,
              }}
            >
              {currentStep.badge}
            </span>
          </div>

          <button
            onClick={handleComplete}
            title="Lewati Tutorial"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto', maxHeight: '420px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#f3f4f6', margin: 0 }}>
            {currentStep.title}
          </h3>
          <p style={{ fontSize: '12px', color: '#818cf8', marginTop: '2px', fontWeight: '500' }}>
            {currentStep.subtitle}
          </p>

          <p style={{ fontSize: '13px', color: '#d1d5db', lineHeight: '1.6', marginTop: '12px', marginBottom: '16px' }}>
            {currentStep.description}
          </p>

          {/* Feature Highlights List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {currentStep.features.map((feat, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  backgroundColor: '#0b0f19',
                  border: '1px solid #1f2937',
                  borderRadius: '8px',
                  padding: '10px 14px',
                }}
              >
                <div style={{ marginTop: '2px', flexShrink: 0 }}>{feat.icon}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#f3f4f6' }}>
                    {feat.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px', lineHeight: '1.4' }}>
                    {feat.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            padding: '14px 24px',
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
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              padding: '6px 10px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
          >
            Lewati Tutorial
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            {!isFirst && (
              <button
                onClick={handlePrev}
                style={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  color: '#e5e7eb',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ArrowLeft size={13} /> Sebelumnya
              </button>
            )}

            <button
              onClick={handleNext}
              style={{
                backgroundColor: isLast ? '#10b981' : '#4f46e5',
                border: 'none',
                color: 'white',
                padding: '7px 18px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isLast ? '0 0 12px rgba(16, 185, 129, 0.4)' : '0 0 12px rgba(99, 102, 241, 0.4)',
              }}
            >
              {isLast ? (
                <>
                  <CheckCircle2 size={14} /> Selesai & Mulai!
                </>
              ) : (
                <>
                  Lanjut <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
