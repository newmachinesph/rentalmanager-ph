'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Settings, Check } from 'lucide-react';
import {
  REPORT_SECTIONS_ORDER,
  getReportsBySection,
  loadReportSettings,
  saveReportSettings,
} from '@/lib/reportConfig';
import { usePropertyStore } from '@/stores/propertyStore';
import { Modal } from '@/components/ui/Modal';
import { ModalFooter } from '@/components/ui/ModalFooter';
import { FormField } from '@/components/ui/FormField';
import { INPUT_CLASS } from '@/lib/utils';

export default function ReportsPage() {
  const [showSettings, setShowSettings] = useState(false);
  const [saved, setSaved] = useState(false);
  const properties = usePropertyStore((s) => s.properties);

  // Load settings when modal opens
  const [settings, setSettings] = useState(loadReportSettings);
  const [prevOpen, setPrevOpen] = useState(false);
  if (showSettings && !prevOpen) {
    setPrevOpen(true);
    setSettings(loadReportSettings());
    setSaved(false);
  } else if (!showSettings && prevOpen) {
    setPrevOpen(false);
  }

  function handleSaveSettings() {
    saveReportSettings(settings);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setShowSettings(false);
    }, 800);
  }

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
        <button
          onClick={() => setShowSettings(true)}
          className="border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-md px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors"
        >
          <Settings size={14} />
          Report settings
        </button>
      </div>

      {/* ===== Report Settings Modal ===== */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Report Settings"
        size="sm"
      >
        <div className="space-y-4">
          <FormField label="Default date range">
            <select
              value={settings.defaultDateRange}
              onChange={(e) =>
                setSettings((s) => ({ ...s, defaultDateRange: e.target.value }))
              }
              className={INPUT_CLASS}
            >
              <option value="last-30">Last 30 days</option>
              <option value="last-90">Last 90 days</option>
              <option value="this-year">This year</option>
              <option value="last-year">Last year</option>
            </select>
          </FormField>

          <FormField label="Default property">
            <select
              value={settings.defaultPropertyId}
              onChange={(e) =>
                setSettings((s) => ({ ...s, defaultPropertyId: e.target.value }))
              }
              className={INPUT_CLASS}
            >
              <option value="all">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </FormField>

          {saved && (
            <div className="flex items-center gap-1.5 text-sm text-green-600">
              <Check size={14} /> Settings saved
            </div>
          )}

          <ModalFooter
            onCancel={() => setShowSettings(false)}
            onSubmit={handleSaveSettings}
            submitLabel="Save"
          />
        </div>
      </Modal>

      {/* ===== Sections ===== */}
      <div className="space-y-8">
        {REPORT_SECTIONS_ORDER.map((section) => {
          const items = getReportsBySection(section.title);
          return (
            <div key={section.title}>
              {/* Section heading */}
              <h2 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-3">
                {section.title}
              </h2>

              {/* 2-column grid of report items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 rounded-lg overflow-hidden border border-slate-200">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.slug}
                      href={`/reports/${item.slug}`}
                      className="flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      {/* Colored circle icon */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${section.circleBg}`}
                      >
                        <Icon size={18} className={section.circleText} />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 text-sm">
                            {item.title}
                          </span>
                          {item.badge && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded-full uppercase">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {item.description}
                        </p>
                      </div>

                      {/* Chevron */}
                      <ChevronRight size={16} className="text-slate-400 shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
