import React, { useState, useRef, useEffect } from 'react';
import { Compound, LogEntry, Cycle, BodyMetric, BloodPanel, MacroEntry, Activity, GarminConfig, StravaConfig, GitHubConfig } from '../types';
import { fmt, today, nowDT, parseDateStr, uid, getOptionLabel } from '../utils';
import { TYPE_OPTIONS, FREQ_OPTIONS, PHASE_OPTIONS, INJECTION_SITES, BLOOD_KEYS, NHS_RANGES } from '../types';

interface ModalsProps {
    modal: { type: string; [key: string]: any } | null;
    onClose: () => void;
    compounds: Compound[];
    cycles: Cycle[];
    onAddLog: (log: Omit<LogEntry, 'id' | 'datetime'> & { datetime?: string }) => void;
    onAddCompound: (compound: Omit<Compound, 'id'>) => void;
    onUpdateCompound: (id: string, updates: Partial<Compound>) => void;
    onAddCycle: (cycle: Omit<Cycle, 'id'>) => void;
    onUpdateCycle: (id: string, updates: Partial<Cycle>) => void;
    onAddBodyMetric: (metric: Omit<BodyMetric, 'id'>) => void;
    onAddBloodPanel: (panel: Omit<BloodPanel, 'id'>) => void;
    onAddMacro: (macro: Omit<MacroEntry, 'id'>) => void;
    onAddActivity: (activity: Omit<Activity, 'id'>) => void;
    onImportMfp: (file: File) => Promise<any[]>;
    stravaConfig: StravaConfig;
    garminConfig: GarminConfig;
    githubConfig: GitHubConfig;
    onSetStravaConfig: (config: Partial<StravaConfig>) => void;
    onSetGarminConfig: (config: Partial<GarminConfig>) => void;
    onSetGitHubConfig: (config: GitHubConfig) => void;
}

const modalStyles = {
    overlay: {
        position: 'fixed' as const,
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: 20,
    },
    container: {
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        maxWidth: 520,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative' as const,
    },
    header: {
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
        color: 'var(--accent)',
    },
    close: {
        background: 'none',
        border: 'none',
        color: 'var(--muted)',
        fontSize: 24,
        cursor: 'pointer',
        padding: 0,
        lineHeight: 1,
    },
    body: {
        padding: 20,
    },
    field: {
        marginBottom: 16,
    },
    label: {
        display: 'block',
        fontSize: 11,
        color: 'var(--muted)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
        marginBottom: 6,
    },
    input: {
        width: '100%',
        padding: '10px 12px',
        fontSize: 13,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        color: 'var(--text)',
        fontFamily: 'inherit',
    },
    select: {
        width: '100%',
        padding: '10px 12px',
        fontSize: 13,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        color: 'var(--text)',
        fontFamily: 'inherit',
        cursor: 'pointer',
    },
    textarea: {
        width: '100%',
        padding: '10px 12px',
        fontSize: 13,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        color: 'var(--text)',
        fontFamily: 'inherit',
        minHeight: 80,
        resize: 'vertical' as const,
    },
    actions: {
        display: 'flex',
        gap: 10,
        justifyContent: 'flex-end',
        paddingTop: 16,
        borderTop: '1px solid var(--border)',
        marginTop: 16,
    },
    btn: {
        padding: '10px 20px',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
        borderRadius: 8,
        cursor: 'pointer',
        border: 'none',
        fontFamily: 'inherit',
    },
    btnPrimary: {
        background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
        color: '#080c12',
    },
    btnSecondary: {
        background: 'rgba(255, 255, 255, 0.05)',
        color: 'var(--muted)',
        border: '1px solid var(--border)',
    },
    colorSwatch: {
        width: 24,
        height: 24,
        borderRadius: '50%' as const,
        cursor: 'pointer',
        border: '2px solid transparent',
        transition: 'transform 0.15s, border-color 0.15s',
    },
    colorSwatchSelected: {
        borderColor: 'var(--accent)',
        transform: 'scale(1.1)',
    },
    grid2: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
    },
};

const SWATCHES = ['#00d4ff', '#7fff6b', '#ff6b35', '#c77dff', '#ffd166', '#ff6b9d', '#ff5050', '#85d5ff'];

const Modals: React.FC<ModalsProps> = ({
    modal,
    onClose,
    compounds,
    cycles,
    onAddLog,
    onAddCompound,
    onUpdateCompound,
    onAddCycle,
    onUpdateCycle,
    onAddBodyMetric,
    onAddBloodPanel,
    onAddMacro,
    onAddActivity,
    onImportMfp,
    stravaConfig,
    garminConfig,
    githubConfig,
    onSetStravaConfig,
    onSetGarminConfig,
    onSetGitHubConfig,
}) => {
    const [formData, setFormData] = useState<any>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (modal) {
            if (modal.compound) {
                setFormData({
                    name: modal.compound.name || '',
                    type: modal.compound.type || 'trt',
                    unit: modal.compound.unit || 'mg',
                    defaultDose: modal.compound.defaultDose || '',
                    color: modal.compound.color || SWATCHES[0],
                    frequency: modal.compound.frequency || '2x_week',
                });
            } else if (modal.cycle) {
                setFormData({
                    name: modal.cycle.name || '',
                    phase: modal.cycle.phase || 'maintenance',
                    startDate: modal.cycle.startDate || today(),
                    endDate: modal.cycle.endDate || '',
                    notes: modal.cycle.notes || '',
                });
            } else if (modal.metric) {
                setFormData({
                    date: modal.metric.date || today(),
                    weight: modal.metric.weight || '',
                    bf: modal.metric.bf || '',
                    notes: modal.metric.notes || '',
                });
            } else if (modal.panel) {
                setFormData({
                    date: modal.panel.date || today(),
                    bp_sys: modal.panel.bp_sys || '',
                    bp_dia: modal.panel.bp_dia || '',
                    notes: modal.panel.notes || '',
                    ...Object.fromEntries(BLOOD_KEYS.map(k => [k, modal.panel[k] || ''])),
                });
            } else {
                setFormData({});
            }
            setErrors({});
        }
    }, [modal]);

    const handleClose = () => {
        setFormData({});
        setErrors({});
        onClose();
    };

    const handleChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        if (errors[key]) {
            setErrors(prev => ({ ...prev, [key]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        
        switch (modal?.type) {
            case 'log':
                if (!formData.compoundId) newErrors.compoundId = 'Required';
                if (formData.dose === undefined || formData.dose === '') newErrors.dose = 'Required';
                break;
            case 'compound':
                if (!formData.name) newErrors.name = 'Required';
                if (!formData.defaultDose) newErrors.defaultDose = 'Required';
                break;
            case 'cycle':
                if (!formData.name) newErrors.name = 'Required';
                if (!formData.startDate) newErrors.startDate = 'Required';
                break;
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        
        setIsSubmitting(true);
        
        try {
            switch (modal?.type) {
                case 'log':
                    onAddLog({
                        compoundId: formData.compoundId,
                        dose: Number(formData.dose),
                        site: formData.site || '',
                        notes: formData.notes || '',
                        datetime: formData.datetime || nowDT(),
                    });
                    break;
                case 'compound':
                    if (modal.compound) {
                        onUpdateCompound(modal.compound.id, {
                            name: formData.name,
                            type: formData.type,
                            unit: formData.unit,
                            defaultDose: Number(formData.defaultDose),
                            color: formData.color,
                            frequency: formData.frequency,
                        });
                    } else {
                        onAddCompound({
                            name: formData.name,
                            type: formData.type,
                            unit: formData.unit,
                            defaultDose: Number(formData.defaultDose),
                            color: formData.color,
                            frequency: formData.frequency,
                        });
                    }
                    break;
                case 'cycle':
                    if (modal.cycle) {
                        onUpdateCycle(modal.cycle.id, {
                            name: formData.name,
                            phase: formData.phase,
                            startDate: formData.startDate,
                            endDate: formData.endDate,
                            notes: formData.notes,
                        });
                    } else {
                        onAddCycle({
                            name: formData.name,
                            phase: formData.phase,
                            startDate: formData.startDate,
                            endDate: formData.endDate,
                            notes: formData.notes,
                        });
                    }
                    break;
                case 'body':
                    onAddBodyMetric({
                        date: formData.date,
                        weight: formData.weight ? Number(formData.weight) : null,
                        bf: formData.bf ? Number(formData.bf) : null,
                        notes: formData.notes || '',
                    });
                    break;
                case 'blood':
                    onAddBloodPanel({
                        date: formData.date,
                        bp_sys: formData.bp_sys ? Number(formData.bp_sys) : undefined,
                        bp_dia: formData.bp_dia ? Number(formData.bp_dia) : undefined,
                        notes: formData.notes || '',
                        ...Object.fromEntries(
                            BLOOD_KEYS.map(k => [k, formData[k] ? Number(formData[k]) : undefined])
                        ),
                    });
                    break;
            }
            handleClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        try {
            const results = await onImportMfp(file);
            results.forEach(r => onAddMacro(r));
            handleClose();
        } catch (err) {
            alert('Failed to import CSV: ' + (err as Error).message);
        }
    };

    if (!modal) return null;

    const renderLogModal = () => (
        <div style={modalStyles.container}>
            <div style={modalStyles.header}>
                <div style={modalStyles.title}>Log Dose</div>
                <button style={modalStyles.close} onClick={handleClose}>&times;</button>
            </div>
            <div style={modalStyles.body}>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Compound *</label>
                    <select
                        style={modalStyles.select}
                        value={formData.compoundId || ''}
                        onChange={e => handleChange('compoundId', e.target.value)}
                    >
                        <option value="">Select compound</option>
                        {compounds.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    {errors.compoundId && <div style={{ color: '#ff5050', fontSize: 11, marginTop: 4 }}>{errors.compoundId}</div>}
                </div>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Dose *</label>
                    <input
                        style={modalStyles.input}
                        type="number"
                        step="0.01"
                        value={formData.dose || ''}
                        onChange={e => handleChange('dose', e.target.value)}
                        placeholder="e.g., 125"
                    />
                    {errors.dose && <div style={{ color: '#ff5050', fontSize: 11, marginTop: 4 }}>{errors.dose}</div>}
                </div>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Injection Site</label>
                    <select
                        style={modalStyles.select}
                        value={formData.site || ''}
                        onChange={e => handleChange('site', e.target.value)}
                    >
                        <option value="">Optional</option>
                        {INJECTION_SITES.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Date & Time</label>
                    <input
                        style={modalStyles.input}
                        type="datetime-local"
                        value={formData.datetime || nowDT()}
                        onChange={e => handleChange('datetime', e.target.value)}
                    />
                </div>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Notes</label>
                    <textarea
                        style={modalStyles.textarea}
                        value={formData.notes || ''}
                        onChange={e => handleChange('notes', e.target.value)}
                        placeholder="Optional notes..."
                    />
                </div>
                <div style={modalStyles.actions}>
                    <button style={{ ...modalStyles.btn, ...modalStyles.btnSecondary }} onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button style={{ ...modalStyles.btn, ...modalStyles.btnPrimary }} onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderCompoundModal = () => (
        <div style={modalStyles.container}>
            <div style={modalStyles.header}>
                <div style={modalStyles.title}>{modal.compound ? 'Edit Compound' : 'Add Compound'}</div>
                <button style={modalStyles.close} onClick={handleClose}>&times;</button>
            </div>
            <div style={modalStyles.body}>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Name *</label>
                    <input
                        style={modalStyles.input}
                        value={formData.name || ''}
                        onChange={e => handleChange('name', e.target.value)}
                        placeholder="e.g., Testosterone Cypionate"
                    />
                    {errors.name && <div style={{ color: '#ff5050', fontSize: 11, marginTop: 4 }}>{errors.name}</div>}
                </div>
                <div style={modalStyles.grid2}>
                    <div style={modalStyles.field}>
                        <label style={modalStyles.label}>Type</label>
                        <select
                            style={modalStyles.select}
                            value={formData.type || 'trt'}
                            onChange={e => handleChange('type', e.target.value)}
                        >
                            {TYPE_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                    <div style={modalStyles.field}>
                        <label style={modalStyles.label}>Unit</label>
                        <select
                            style={modalStyles.select}
                            value={formData.unit || 'mg'}
                            onChange={e => handleChange('unit', e.target.value)}
                        >
                            {(['mg', 'mcg', 'IU', 'ml'] as const).map(u => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div style={modalStyles.grid2}>
                    <div style={modalStyles.field}>
                        <label style={modalStyles.label}>Default Dose *</label>
                        <input
                            style={modalStyles.input}
                            type="number"
                            step="0.01"
                            value={formData.defaultDose || ''}
                            onChange={e => handleChange('defaultDose', e.target.value)}
                            placeholder="e.g., 125"
                        />
                        {errors.defaultDose && <div style={{ color: '#ff5050', fontSize: 11, marginTop: 4 }}>{errors.defaultDose}</div>}
                    </div>
                    <div style={modalStyles.field}>
                        <label style={modalStyles.label}>Frequency</label>
                        <select
                            style={modalStyles.select}
                            value={formData.frequency || '2x_week'}
                            onChange={e => handleChange('frequency', e.target.value)}
                        >
                            {FREQ_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Color</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {SWATCHES.map(color => (
                            <div
                                key={color}
                                style={{
                                    ...modalStyles.colorSwatch,
                                    background: color,
                                    ...(formData.color === color ? modalStyles.colorSwatchSelected : {}),
                                }}
                                onClick={() => handleChange('color', color)}
                            />
                        ))}
                    </div>
                </div>
                <div style={modalStyles.actions}>
                    <button style={{ ...modalStyles.btn, ...modalStyles.btnSecondary }} onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button style={{ ...modalStyles.btn, ...modalStyles.btnPrimary }} onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderCycleModal = () => (
        <div style={modalStyles.container}>
            <div style={modalStyles.header}>
                <div style={modalStyles.title}>{modal.cycle ? 'Edit Cycle' : 'Add Cycle'}</div>
                <button style={modalStyles.close} onClick={handleClose}>&times;</button>
            </div>
            <div style={modalStyles.body}>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Name *</label>
                    <input
                        style={modalStyles.input}
                        value={formData.name || ''}
                        onChange={e => handleChange('name', e.target.value)}
                        placeholder="e.g., Summer Cut 2026"
                    />
                    {errors.name && <div style={{ color: '#ff5050', fontSize: 11, marginTop: 4 }}>{errors.name}</div>}
                </div>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Phase</label>
                    <select
                        style={modalStyles.select}
                        value={formData.phase || 'maintenance'}
                        onChange={e => handleChange('phase', e.target.value)}
                    >
                        {PHASE_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
                <div style={modalStyles.grid2}>
                    <div style={modalStyles.field}>
                        <label style={modalStyles.label}>Start Date *</label>
                        <input
                            style={modalStyles.input}
                            type="date"
                            value={formData.startDate || today()}
                            onChange={e => handleChange('startDate', e.target.value)}
                        />
                        {errors.startDate && <div style={{ color: '#ff5050', fontSize: 11, marginTop: 4 }}>{errors.startDate}</div>}
                    </div>
                    <div style={modalStyles.field}>
                        <label style={modalStyles.label}>End Date</label>
                        <input
                            style={modalStyles.input}
                            type="date"
                            value={formData.endDate || ''}
                            onChange={e => handleChange('endDate', e.target.value)}
                        />
                    </div>
                </div>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Notes</label>
                    <textarea
                        style={modalStyles.textarea}
                        value={formData.notes || ''}
                        onChange={e => handleChange('notes', e.target.value)}
                        placeholder="Cycle notes..."
                    />
                </div>
                <div style={modalStyles.actions}>
                    <button style={{ ...modalStyles.btn, ...modalStyles.btnSecondary }} onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button style={{ ...modalStyles.btn, ...modalStyles.btnPrimary }} onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderBodyModal = () => (
        <div style={modalStyles.container}>
            <div style={modalStyles.header}>
                <div style={modalStyles.title}>{modal.metric ? 'Edit Body Metric' : 'Add Body Metric'}</div>
                <button style={modalStyles.close} onClick={handleClose}>&times;</button>
            </div>
            <div style={modalStyles.body}>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Date</label>
                    <input
                        style={modalStyles.input}
                        type="date"
                        value={formData.date || today()}
                        onChange={e => handleChange('date', e.target.value)}
                    />
                </div>
                <div style={modalStyles.grid2}>
                    <div style={modalStyles.field}>
                        <label style={modalStyles.label}>Weight (kg)</label>
                        <input
                            style={modalStyles.input}
                            type="number"
                            step="0.1"
                            value={formData.weight || ''}
                            onChange={e => handleChange('weight', e.target.value)}
                            placeholder="e.g., 85.5"
                        />
                    </div>
                    <div style={modalStyles.field}>
                        <label style={modalStyles.label}>Body Fat (%)</label>
                        <input
                            style={modalStyles.input}
                            type="number"
                            step="0.1"
                            value={formData.bf || ''}
                            onChange={e => handleChange('bf', e.target.value)}
                            placeholder="e.g., 15.5"
                        />
                    </div>
                </div>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Notes</label>
                    <textarea
                        style={modalStyles.textarea}
                        value={formData.notes || ''}
                        onChange={e => handleChange('notes', e.target.value)}
                        placeholder="Optional notes..."
                    />
                </div>
                <div style={modalStyles.actions}>
                    <button style={{ ...modalStyles.btn, ...modalStyles.btnSecondary }} onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button style={{ ...modalStyles.btn, ...modalStyles.btnPrimary }} onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderBloodModal = () => (
        <div style={modalStyles.container}>
            <div style={modalStyles.header}>
                <div style={modalStyles.title}>{modal.panel ? 'Edit Blood Panel' : 'Add Blood Panel'}</div>
                <button style={modalStyles.close} onClick={handleClose}>&times;</button>
            </div>
            <div style={modalStyles.body}>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Date</label>
                    <input
                        style={modalStyles.input}
                        type="date"
                        value={formData.date || today()}
                        onChange={e => handleChange('date', e.target.value)}
                    />
                </div>
                <div style={modalStyles.grid2}>
                    <div style={modalStyles.field}>
                        <label style={modalStyles.label}>BP Systolic (mmHg)</label>
                        <input
                            style={modalStyles.input}
                            type="number"
                            value={formData.bp_sys || ''}
                            onChange={e => handleChange('bp_sys', e.target.value)}
                            placeholder="e.g., 120"
                        />
                    </div>
                    <div style={modalStyles.field}>
                        <label style={modalStyles.label}>BP Diastolic (mmHg)</label>
                        <input
                            style={modalStyles.input}
                            type="number"
                            value={formData.bp_dia || ''}
                            onChange={e => handleChange('bp_dia', e.target.value)}
                            placeholder="e.g., 80"
                        />
                    </div>
                </div>
                <div style={{ marginBottom: 12, fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Blood Markers (nmol/L unless specified)
                </div>
                <div style={modalStyles.grid2}>
                    {BLOOD_KEYS.slice(0, 6).map(key => {
                        const range = NHS_RANGES[key as keyof typeof NHS_RANGES];
                        return (
                            <div key={key} style={modalStyles.field}>
                                <label style={modalStyles.label}>{range.label}</label>
                                <input
                                    style={modalStyles.input}
                                    type="number"
                                    step="0.01"
                                    value={formData[key] || ''}
                                    onChange={e => handleChange(key, e.target.value)}
                                    placeholder={`${range.min !== null && range.max !== null ? `${range.min}-${range.max}` : ''}`}
                                />
                            </div>
                        );
                    })}
                </div>
                <div style={modalStyles.grid2}>
                    {BLOOD_KEYS.slice(6).map(key => {
                        const range = NHS_RANGES[key as keyof typeof NHS_RANGES];
                        return (
                            <div key={key} style={modalStyles.field}>
                                <label style={modalStyles.label}>{range.label}</label>
                                <input
                                    style={modalStyles.input}
                                    type="number"
                                    step="0.01"
                                    value={formData[key] || ''}
                                    onChange={e => handleChange(key, e.target.value)}
                                    placeholder={`${range.min !== null && range.max !== null ? `${range.min}-${range.max}` : ''}`}
                                />
                            </div>
                        );
                    })}
                </div>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Notes</label>
                    <textarea
                        style={modalStyles.textarea}
                        value={formData.notes || ''}
                        onChange={e => handleChange('notes', e.target.value)}
                        placeholder="Optional notes..."
                    />
                </div>
                <div style={modalStyles.actions}>
                    <button style={{ ...modalStyles.btn, ...modalStyles.btnSecondary }} onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button style={{ ...modalStyles.btn, ...modalStyles.btnPrimary }} onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderImportMfpModal = () => (
        <div style={modalStyles.container}>
            <div style={modalStyles.header}>
                <div style={modalStyles.title}>Import MyFitnessPal CSV</div>
                <button style={modalStyles.close} onClick={handleClose}>&times;</button>
            </div>
            <div style={modalStyles.body}>
                <div style={modalStyles.field}>
                    <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5 }}>
                        Export your nutrition data from MyFitnessPal as CSV and import it here.
                        The system will aggregate daily totals for calories, protein, carbs, and fat.
                    </p>
                </div>
                <div style={modalStyles.field}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileImport}
                        accept=".csv"
                        style={{ display: 'none' }}
                    />
                    <button
                        style={{ ...modalStyles.btn, ...modalStyles.btnPrimary, width: '100%' }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Select CSV File
                    </button>
                </div>
                <div style={modalStyles.actions}>
                    <button style={{ ...modalStyles.btn, ...modalStyles.btnSecondary }} onClick={handleClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );

    const renderStravaModal = () => (
        <div style={modalStyles.container}>
            <div style={modalStyles.header}>
                <div style={modalStyles.title}>Strava Configuration</div>
                <button style={modalStyles.close} onClick={handleClose}>&times;</button>
            </div>
            <div style={modalStyles.body}>
                <div style={modalStyles.field}>
                    <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5 }}>
                        To connect Strava, you need a Cloudflare Worker URL that handles OAuth.
                        This allows the app to sync your activities without exposing your credentials.
                    </p>
                </div>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Worker URL</label>
                    <input
                        style={modalStyles.input}
                        value={formData.workerUrl || stravaConfig.workerUrl || ''}
                        onChange={e => handleChange('workerUrl', e.target.value)}
                        placeholder="https://your-worker.workers.dev"
                    />
                </div>
                {stravaConfig.refreshToken && (
                    <div style={modalStyles.field}>
                        <div style={{ color: '#7fff6b', fontSize: 12 }}>Connected to Strava</div>
                    </div>
                )}
                <div style={modalStyles.actions}>
                    <button style={{ ...modalStyles.btn, ...modalStyles.btnSecondary }} onClick={handleClose}>
                        Cancel
                    </button>
                    <button
                        style={{ ...modalStyles.btn, ...modalStyles.btnPrimary }}
                        onClick={() => {
                            onSetStravaConfig({ workerUrl: formData.workerUrl || '' });
                            handleClose();
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );

    const renderGarminModal = () => (
        <div style={modalStyles.container}>
            <div style={modalStyles.header}>
                <div style={modalStyles.title}>Garmin Connect Configuration</div>
                <button style={modalStyles.close} onClick={handleClose}>&times;</button>
            </div>
            <div style={modalStyles.body}>
                <div style={modalStyles.field}>
                    <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5 }}>
                        To connect Garmin Connect, you need a Cloudflare Worker URL that handles OAuth.
                        This allows the app to sync your activities without exposing your credentials.
                    </p>
                </div>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Worker URL</label>
                    <input
                        style={modalStyles.input}
                        value={formData.workerUrl || garminConfig.workerUrl || ''}
                        onChange={e => handleChange('workerUrl', e.target.value)}
                        placeholder="https://your-worker.workers.dev"
                    />
                </div>
                {garminConfig.accessToken && (
                    <div style={modalStyles.field}>
                        <div style={{ color: '#c77dff', fontSize: 12 }}>Connected to Garmin Connect</div>
                    </div>
                )}
                <div style={modalStyles.actions}>
                    <button style={{ ...modalStyles.btn, ...modalStyles.btnSecondary }} onClick={handleClose}>
                        Cancel
                    </button>
                    <button
                        style={{ ...modalStyles.btn, ...modalStyles.btnPrimary }}
                        onClick={() => {
                            onSetGarminConfig({ workerUrl: formData.workerUrl || '' });
                            handleClose();
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );

    const renderGitHubModal = () => (
        <div style={modalStyles.container}>
            <div style={modalStyles.header}>
                <div style={modalStyles.title}>GitHub Configuration</div>
                <button style={modalStyles.close} onClick={handleClose}>&times;</button>
            </div>
            <div style={modalStyles.body}>
                <div style={modalStyles.field}>
                    <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5 }}>
                        Connect to GitHub to sync your data across devices.
                        You will need a fine-grained personal access token with repository permissions.
                    </p>
                </div>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>GitHub Username</label>
                    <input
                        style={modalStyles.input}
                        value={formData.owner || githubConfig.owner || ''}
                        onChange={e => handleChange('owner', e.target.value)}
                        placeholder="your-username"
                    />
                </div>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Repository Name</label>
                    <input
                        style={modalStyles.input}
                        value={formData.repo || githubConfig.repo || 'TRTv2'}
                        onChange={e => handleChange('repo', e.target.value)}
                        placeholder="TRTv2"
                    />
                </div>
                <div style={modalStyles.field}>
                    <label style={modalStyles.label}>Personal Access Token *</label>
                    <input
                        style={modalStyles.input}
                        type="password"
                        value={formData.token || ''}
                        onChange={e => handleChange('token', e.target.value)}
                        placeholder="ghp_..."
                    />
                </div>
                <div style={modalStyles.actions}>
                    <button style={{ ...modalStyles.btn, ...modalStyles.btnSecondary }} onClick={handleClose}>
                        Cancel
                    </button>
                    <button
                        style={{ ...modalStyles.btn, ...modalStyles.btnPrimary }}
                        onClick={() => {
                            onSetGitHubConfig({
                                owner: formData.owner || '',
                                repo: formData.repo || 'TRTv2',
                                token: formData.token || '',
                            });
                            handleClose();
                        }}
                    >
                        Save & Connect
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div style={modalStyles.overlay} onClick={handleClose}>
            <div onClick={e => e.stopPropagation()}>
                {modal.type === 'log' && renderLogModal()}
                {modal.type === 'compound' && renderCompoundModal()}
                {modal.type === 'cycle' && renderCycleModal()}
                {modal.type === 'body' && renderBodyModal()}
                {modal.type === 'blood' && renderBloodModal()}
                {modal.type === 'macro' && (
                    <div style={modalStyles.container}>
                        <div style={modalStyles.header}>
                            <div style={modalStyles.title}>Add Macro Entry</div>
                            <button style={modalStyles.close} onClick={handleClose}>&times;</button>
                        </div>
                        <div style={modalStyles.body}>
                            <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
                                Use the Import MFP button in the sync bar to import from CSV.
                            </p>
                            <div style={modalStyles.actions}>
                                <button style={{ ...modalStyles.btn, ...modalStyles.btnSecondary }} onClick={handleClose}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {modal.type === 'activity' && (
                    <div style={modalStyles.container}>
                        <div style={modalStyles.header}>
                            <div style={modalStyles.title}>Add Activity</div>
                            <button style={modalStyles.close} onClick={handleClose}>&times;</button>
                        </div>
                        <div style={modalStyles.body}>
                            <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
                                Connect Strava or Garmin in the sync bar to import activities automatically.
                            </p>
                            <div style={modalStyles.actions}>
                                <button style={{ ...modalStyles.btn, ...modalStyles.btnSecondary }} onClick={handleClose}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {modal.type === 'importMfp' && renderImportMfpModal()}
                {modal.type === 'strava' && renderStravaModal()}
                {modal.type === 'garmin' && renderGarminModal()}
                {modal.type === 'github' && renderGitHubModal()}
                {modal.type === 'syncStrava' && (
                    <div style={modalStyles.container}>
                        <div style={modalStyles.header}>
                            <div style={modalStyles.title}>Sync Strava Activities</div>
                            <button style={modalStyles.close} onClick={handleClose}>&times;</button>
                        </div>
                        <div style={modalStyles.body}>
                            <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
                                Syncing activities from Strava...
                            </p>
                        </div>
                    </div>
                )}
                {modal.type === 'syncGarmin' && (
                    <div style={modalStyles.container}>
                        <div style={modalStyles.header}>
                            <div style={modalStyles.title}>Sync Garmin Activities</div>
                            <button style={modalStyles.close} onClick={handleClose}>&times;</button>
                        </div>
                        <div style={modalStyles.body}>
                            <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
                                Syncing activities from Garmin Connect...
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modals;