'use client';

/**
 * @purpose Gestiona y renderiza la interfaz de usuario para configurar los umbrales de alertas, incluyendo crear, editar, activar/desactivar y eliminar umbrales.
 * @purpose_en Manages and renders the UI for configuring alert thresholds, including creating, editing, enabling/disabling, and deleting thresholds.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:1aggj86
 * @lastUpdated 2026-06-22T06:31:31.494Z
 */

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Settings2, Plus, Trash2, ToggleLeft, ToggleRight, Loader2, AlertTriangle,
} from 'lucide-react';

interface Threshold {
  _id: string;
  name: string;
  description?: string;
  enabled: boolean;
  appId?: string;
  field: string;
  operator: string;
  value: string;
  windowMinutes: number;
  threshold: number;
  severity: string;
  cooldownMinutes: number;
}

interface AlertThresholdManagerProps {
  tenantId: string;
}

const FIELDS = [
  { value: 'action', label: 'Action' },
  { value: 'appId', label: 'Source App' },
  { value: 'entityType', label: 'Entity Type' },
  { value: 'userId', label: 'User ID' },
  { value: 'entityId', label: 'Entity ID' },
];

const OPERATORS = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '≠' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
];

const SEVERITIES = [
  { value: 'INFO', label: 'Info', class: 'text-blue-400 bg-blue-500/10' },
  { value: 'WARNING', label: 'Warning', class: 'text-amber-400 bg-amber-500/10' },
  { value: 'CRITICAL', label: 'Critical', class: 'text-red-400 bg-red-500/10' },
];

const APP_IDS = [
  { value: '', label: 'All Apps' },
  { value: 'AUTH', label: 'ABDAuth' },
  { value: 'QUIZ', label: 'ABDQuiz' },
  { value: 'GOBERNANZA', label: 'Gobernanza' },
];

const PRESETS = [
  {
    name: 'Failed Login Spike',
    description: 'Alerts when too many failed logins occur in a short window',
    field: 'action',
    operator: 'eq',
    value: 'USER_LOGIN_FAILED',
    threshold: 5,
    windowMinutes: 5,
    severity: 'CRITICAL',
    cooldownMinutes: 10,
  },
  {
    name: 'Suspicious Activity',
    description: 'Alerts on repeated security-sensitive actions',
    field: 'action',
    operator: 'eq',
    value: 'SSO_HANDSHAKE_FAILED',
    threshold: 3,
    windowMinutes: 10,
    severity: 'WARNING',
    cooldownMinutes: 15,
  },
  {
    name: 'High Volume App Activity',
    description: 'Alerts when an app generates unusually high log volume',
    field: 'appId',
    operator: 'eq',
    value: '',
    threshold: 100,
    windowMinutes: 5,
    severity: 'WARNING',
    cooldownMinutes: 30,
  },
];

export function AlertThresholdManager({ tenantId }: AlertThresholdManagerProps) {
  const t = useTranslations('admin');
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    field: 'action',
    operator: 'eq',
    value: '',
    threshold: 10,
    windowMinutes: 5,
    severity: 'WARNING',
    appId: '',
    cooldownMinutes: 15,
  });

  const fetchThresholds = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/alerts/thresholds?tenantId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setThresholds(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    startTransition(() => { void fetchThresholds(); });
  }, [fetchThresholds, startTransition]);

  const applyPreset = (presetName: string) => {
    const preset = PRESETS.find(p => p.name === presetName);
    if (!preset) return;
    setForm({
      name: preset.name,
      description: preset.description,
      field: preset.field,
      operator: preset.operator,
      value: preset.value,
      threshold: preset.threshold,
      windowMinutes: preset.windowMinutes,
      severity: preset.severity,
      appId: '',
      cooldownMinutes: preset.cooldownMinutes,
    });
    setSelectedPreset(presetName);
  };

  const handleSave = async () => {
    if (!form.name || !form.value) {
      toast.error(t('threshold_validation_error'));
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/alerts/thresholds?tenantId=${tenantId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });

        if (res.ok) {
          toast.success(t('threshold_saved', { name: form.name }));
          setShowForm(false);
          setForm({
            name: '', description: '', field: 'action', operator: 'eq',
            value: '', threshold: 10, windowMinutes: 5, severity: 'WARNING',
            appId: '', cooldownMinutes: 15,
          });
          setSelectedPreset('');
          fetchThresholds();
        } else {
          const err = await res.json();
          toast.error(err.error || t('threshold_save_error'));
        }
      } catch {
        toast.error(t('network_error'));
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/alerts/thresholds?tenantId=${tenantId}&id=${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          toast.success(t('threshold_deleted'));
          fetchThresholds();
        }
      } catch {
        toast.error(t('threshold_delete_error'));
      }
    });
  };

  const handleToggle = async (threshold: Threshold) => {
    startTransition(async () => {
      try {
        await fetch(`/api/admin/alerts/thresholds?tenantId=${tenantId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...threshold, enabled: !threshold.enabled }),
        });
        fetchThresholds();
      } catch {
        toast.error(t('threshold_toggle_error'));
      }
    });
  };

  return (
    <div className="p-5 border border-border bg-card/60 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {t('alert_thresholds_title')}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {t('alert_thresholds_desc')}
            </p>
          </div>
        </div>
        <button
          aria-label={showForm ? t('cancel') : t('add_threshold')}
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          {showForm ? t('cancel') : t('add_threshold')}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-5 p-4 rounded-lg border border-border bg-secondary/10 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map(p => (
              <button
                key={p.name}
                aria-label={p.name}
                onClick={() => applyPreset(p.name)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  selectedPreset === p.name
                    ? 'bg-primary/20 border-primary/50 text-primary'
                    : 'bg-foreground/5 border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('threshold_form_name')}</label>
              <input
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder={t('threshold_form_name_placeholder')}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('threshold_form_app_filter')}</label>
              <select
                value={form.appId}
                onChange={e => setForm(prev => ({ ...prev, appId: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {APP_IDS.map(a => (
                  <option key={a.value} value={a.value}>{a.value === '' ? t('threshold_form_all_apps') : a.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('threshold_form_field')}</label>
              <select
                value={form.field}
                onChange={e => setForm(prev => ({ ...prev, field: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {FIELDS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('threshold_form_operator')}</label>
              <select
                value={form.operator}
                onChange={e => setForm(prev => ({ ...prev, operator: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {OPERATORS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('threshold_form_value')}</label>
              <input
                value={form.value}
                onChange={e => setForm(prev => ({ ...prev, value: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder={t('threshold_form_value_placeholder')}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('threshold_form_severity')}</label>
              <select
                value={form.severity}
                onChange={e => setForm(prev => ({ ...prev, severity: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {SEVERITIES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('threshold_form_threshold')}
              </label>
              <input
                type="number"
                value={form.threshold}
                onChange={e => setForm(prev => ({ ...prev, threshold: parseInt(e.target.value) || 1 }))}
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                min={1}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('threshold_form_window')}
              </label>
              <input
                type="number"
                value={form.windowMinutes}
                onChange={e => setForm(prev => ({ ...prev, windowMinutes: parseInt(e.target.value) || 1 }))}
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                min={1}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('threshold_form_cooldown')}
              </label>
              <input
                type="number"
                value={form.cooldownMinutes}
                onChange={e => setForm(prev => ({ ...prev, cooldownMinutes: parseInt(e.target.value) || 1 }))}
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                min={1}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('threshold_form_desc')}</label>
            <input
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder={t('threshold_form_desc_placeholder')}
            />
          </div>

          <button
            aria-label={t('save_threshold')}
            onClick={handleSave}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {t('save_threshold')}
          </button>
        </div>
      )}

      {/* Threshold List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 w-full rounded-lg bg-secondary/10 border border-border animate-pulse" />
          ))}
        </div>
      ) : thresholds.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-40" />
          <p className="text-xs">
            {t('no_thresholds')}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {thresholds.map(th => (
            <div
              key={th._id}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border bg-background/50 hover:bg-foreground/5 transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                  th.severity === 'CRITICAL' ? 'text-red-400 bg-red-500/10' :
                  th.severity === 'WARNING' ? 'text-amber-400 bg-amber-500/10' :
                  'text-blue-400 bg-blue-500/10'
                }`}>
                  {th.severity}
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-foreground">{th.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">
                    {t('threshold_summary', { field: th.field, operator: th.operator, value: th.value, threshold: th.threshold, window: th.windowMinutes })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggle(th)}
                  className="p-1 rounded-md hover:bg-foreground/5 text-muted-foreground transition-all cursor-pointer"
                  aria-label={th.enabled ? t('disable_threshold') : t('enable_threshold')}
                >
                  {th.enabled
                    ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                    : <ToggleLeft className="w-4 h-4 text-muted-foreground/50" />
                  }
                </button>
                <button
                  onClick={() => handleDelete(th._id)}
                  className="p-1 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all cursor-pointer"
                  aria-label={t('delete_threshold')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
