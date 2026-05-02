import React from 'react';
import { BodyMetric, BloodPanel, MacroEntry, Activity } from '../types';
import { fmt, isInRange } from '../utils';
import { BLOOD_KEYS, NHS_RANGES, BP_TARGET, BP_HIGH } from '../types';
import Empty from './Empty';

interface HealthTabProps {
    subtab: 'body' | 'bloods' | 'bp' | 'macros' | 'training';
    onSubtab: (tab: 'body' | 'bloods' | 'bp' | 'macros' | 'training') => void;
    bodyMetrics: BodyMetric[];
    bloods: BloodPanel[];
    macros: MacroEntry[];
    activities: Activity[];
    onOpenBody: (metric?: BodyMetric) => void;
    onOpenBlood: (panel?: BloodPanel) => void;
    onDeleteBody: (id: string) => void;
    onDeleteBlood: (id: string) => void;
    onDeleteMacro: (id: string) => void;
    onDeleteActivity: (id: string) => void;
}

const HealthTab: React.FC<HealthTabProps> = ({
    subtab,
    onSubtab,
    bodyMetrics,
    bloods,
    macros,
    activities,
    onOpenBody,
    onOpenBlood,
    onDeleteBody,
    onDeleteBlood,
    onDeleteMacro,
    onDeleteActivity,
}) => {
    const sectionH = {
        fontSize: 10,
        color: 'var(--muted)',
        letterSpacing: '0.2em',
        textTransform: 'uppercase' as const,
        marginBottom: 12,
        marginTop: 6,
    };

    const card = {
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    };

    const nav = {
        display: 'flex',
        gap: 3,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: 3,
        flexWrap: 'wrap' as const,
        marginBottom: 16,
    };

    const navBtn = (a: boolean) => ({
        padding: '7px 11px',
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        background: a ? 'rgba(0, 212, 255, 0.14)' : 'transparent',
        color: a ? 'var(--accent)' : 'var(--muted)',
        border: a ? '1px solid rgba(0, 212, 255, 0.28)' : '1px solid transparent',
        borderRadius: 6,
        transition: 'all 0.15s',
        flex: '1 1 auto',
        fontWeight: 600,
        cursor: 'pointer',
    });

    const renderBodyTab = () => {
        if (bodyMetrics.length === 0) {
            return <Empty msg="No body metrics yet" />;
        }

        const sorted = [...bodyMetrics].sort((a, b) => b.date.localeCompare(a.date));

        return (
            <div>
                <button
                    onClick={() => onOpenBody()}
                    style={{
                        marginBottom: 16,
                        padding: '10px 16px',
                        fontSize: 12,
                        background: 'rgba(127, 255, 107, 0.12)',
                        color: 'var(--accent2)',
                        border: '1px solid rgba(127, 255, 107, 0.3)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase' as const,
                    }}
                >
                    + Add Measurement
                </button>
                {sorted.map((m) => (
                    <div key={m.id} className="fade-up" style={card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{fmt(m.date)}</div>
                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                                    {m.weight !== null ? `${m.weight}kg` : 'N/A'}
                                    {m.bf !== null ? `  ${m.bf}% BF` : ''}
                                </div>
                            </div>
                            <button
                                onClick={() => onDeleteBody(m.id)}
                                style={{
                                    padding: '6px 12px',
                                    fontSize: 10,
                                    background: 'rgba(255, 80, 80, 0.1)',
                                    color: '#ff5050',
                                    border: '1px solid rgba(255, 80, 80, 0.2)',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase' as const,
                                }}
                            >
                                Delete
                            </button>
                        </div>
                        {m.notes && (
                            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                                {m.notes}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderBloodsTab = () => {
        const bloodWithMarkers = bloods.filter(b => BLOOD_KEYS.some(k => b[k] !== undefined));
        
        if (bloodWithMarkers.length === 0 && bloods.filter(b => b.bp_sys || b.bp_dia).length === 0) {
            return <Empty msg="No blood panels yet" />;
        }

        return (
            <div>
                <button
                    onClick={() => onOpenBlood()}
                    style={{
                        marginBottom: 16,
                        padding: '10px 16px',
                        fontSize: 12,
                        background: 'rgba(199, 125, 255, 0.12)',
                        color: 'var(--accent4)',
                        border: '1px solid rgba(199, 125, 255, 0.3)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase' as const,
                    }}
                >
                    + Add Blood Panel
                </button>
                {bloods
                    .filter(b => BLOOD_KEYS.some(k => b[k] !== undefined))
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((panel) => (
                        <div key={panel.id} className="fade-up" style={card}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{fmt(panel.date)}</div>
                                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                                        {BLOOD_KEYS.map(key => {
                                            const val = panel[key];
                                            if (val !== undefined) {
                                                const range = NHS_RANGES[key as keyof typeof NHS_RANGES];
                                                const inRange = isInRange(key as BloodKey, val);
                                                return (
                                                    <span key={key} style={{ marginRight: 12, color: inRange ? '#7fff6b' : '#ff5050' }}>
                                                        {range.label}: {val}{range.unit}
                                                    </span>
                                                );
                                            }
                                            return null;
                                        }).filter(Boolean)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => onDeleteBlood(panel.id)}
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: 10,
                                        background: 'rgba(255, 80, 80, 0.1)',
                                        color: '#ff5050',
                                        border: '1px solid rgba(255, 80, 80, 0.2)',
                                        borderRadius: 6,
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase' as const,
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
            </div>
        );
    };

    const renderBpTab = () => {
        const bpEntries = bloods.filter(b => b.bp_sys || b.bp_dia).sort((a, b) => b.date.localeCompare(a.date));
        
        if (bpEntries.length === 0) {
            return <Empty msg="No blood pressure readings yet" />;
        }

        return (
            <div>
                <button
                    onClick={() => onOpenBlood()}
                    style={{
                        marginBottom: 16,
                        padding: '10px 16px',
                        fontSize: 12,
                        background: 'rgba(255, 107, 53, 0.12)',
                        color: 'var(--accent3)',
                        border: '1px solid rgba(255, 107, 53, 0.3)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase' as const,
                    }}
                >
                    + Add BP Reading
                </button>
                {bpEntries.map((b) => {
                    const isHigh = (b.bp_sys || 0) >= BP_HIGH.sys || (b.bp_dia || 0) >= BP_HIGH.dia;
                    const isOptimal = (b.bp_sys || 0) <= BP_TARGET.sys && (b.bp_dia || 0) <= BP_TARGET.dia;
                    const color = isHigh ? '#ff5050' : isOptimal ? '#7fff6b' : '#ffd166';
                    
                    return (
                        <div key={b.id} className="fade-up" style={{ ...card, borderColor: `${color}22` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14, color }}>
                                        {b.bp_sys}/{b.bp_dia} mmHg
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                                        {fmt(b.date)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => onDeleteBlood(b.id)}
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: 10,
                                        background: 'rgba(255, 80, 80, 0.1)',
                                        color: '#ff5050',
                                        border: '1px solid rgba(255, 80, 80, 0.2)',
                                        borderRadius: 6,
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase' as const,
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderMacrosTab = () => {
        if (macros.length === 0) {
            return <Empty msg="No macro data yet" />;
        }

        const sorted = [...macros].sort((a, b) => b.date.localeCompare(a.date));

        return (
            <div>
                {sorted.map((m) => (
                    <div key={m.id} className="fade-up" style={card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{fmt(m.date)}</div>
                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                                    {m.kcal} kcal {m.protein}g P {m.carbs}g C {m.fat}g F
                                    {m.source === 'mfp' && ' (MFP)'}
                                </div>
                            </div>
                            <button
                                onClick={() => onDeleteMacro(m.id)}
                                style={{
                                    padding: '6px 12px',
                                    fontSize: 10,
                                    background: 'rgba(255, 80, 80, 0.1)',
                                    color: '#ff5050',
                                    border: '1px solid rgba(255, 80, 80, 0.2)',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase' as const,
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderTrainingTab = () => {
        if (activities.length === 0) {
            return <Empty msg="No activities yet" />;
        }

        const sorted = [...activities].sort((a, b) => b.date.localeCompare(a.date));

        return (
            <div>
                {sorted.map((a) => (
                    <div key={a.id} className="fade-up" style={card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>
                                    {a.name || a.type}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                                    {fmt(a.date)} {a.durationMin} min
                                    {a.distanceKm > 0 && `  ${a.distanceKm} km`}
                                    {a.kj && `  ${a.kj} kj`}
                                    {a.source === 'strava' && ' (Strava)'}
                                    {a.source === 'garmin' && ' (Garmin)'}
                                </div>
                            </div>
                            <button
                                onClick={() => onDeleteActivity(a.id)}
                                style={{
                                    padding: '6px 12px',
                                    fontSize: 10,
                                    background: 'rgba(255, 80, 80, 0.1)',
                                    color: '#ff5050',
                                    border: '1px solid rgba(255, 80, 80, 0.2)',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase' as const,
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div>
            <div style={nav}>
                {(['body', 'bloods', 'bp', 'macros', 'training'] as const).map(t => (
                    <button key={t} style={navBtn(subtab === t)} onClick={() => onSubtab(t)}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>
            {subtab === 'body' && renderBodyTab()}
            {subtab === 'bloods' && renderBloodsTab()}
            {subtab === 'bp' && renderBpTab()}
            {subtab === 'macros' && renderMacrosTab()}
            {subtab === 'training' && renderTrainingTab()}
        </div>
    );
};

export default HealthTab;