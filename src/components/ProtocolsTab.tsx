import React from 'react';
import { Compound } from '../types';
import { fmt, getOptionLabel } from '../utils';
import { TYPE_OPTIONS, FREQ_OPTIONS } from '../types';
import Empty from './Empty';

interface ProtocolsTabProps {
    compounds: Compound[];
    onOpenCompound: (compound?: Compound) => void;
    onDeleteCompound: (id: string) => void;
}

const ProtocolsTab: React.FC<ProtocolsTabProps> = ({ compounds, onOpenCompound, onDeleteCompound }) => {
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

    const dot = (color: string) => ({
        width: 10,
        height: 10,
        borderRadius: '50%' as const,
        background: color,
        flexShrink: 0,
        boxShadow: `0 0 8px ${color}`,
        marginRight: 10,
    });

    const tag = (color: string) => ({
        display: 'inline-block',
        padding: '2px 9px',
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
        background: `${color}22`,
        color: color,
        border: `1px solid ${color}44`,
        whiteSpace: 'nowrap' as const,
    });

    if (compounds.length === 0) {
        return <Empty msg="No compounds yet" />;
    }

    return (
        <div>
            <div style={sectionH}>Your Compounds</div>
            <button
                onClick={() => onOpenCompound()}
                style={{
                    marginBottom: 16,
                    padding: '10px 16px',
                    fontSize: 12,
                    background: 'rgba(0, 212, 255, 0.12)',
                    color: 'var(--accent)',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase' as const,
                }}
            >
                + Add Compound
            </button>
            {compounds.map((c) => (
                <div key={c.id} className="fade-up" style={{ ...card, borderColor: `${c.color}22` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 12, flexWrap: 'wrap' as const }}>
                            <div style={dot(c.color)} />
                            <div style={{ flex: 1, minWidth: 140 }}>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                                    {c.defaultDose} {c.unit} {getOptionLabel(FREQ_OPTIONS, c.frequency)}
                                </div>
                            </div>
                            <div style={tag(c.color)}>
                                {getOptionLabel(TYPE_OPTIONS, c.type)}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button
                            onClick={() => onOpenCompound(c)}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                fontSize: 11,
                                background: 'rgba(0, 212, 255, 0.1)',
                                color: 'var(--accent)',
                                border: '1px solid rgba(0, 212, 255, 0.2)',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontWeight: 600,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase' as const,
                            }}
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => onDeleteCompound(c.id)}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                fontSize: 11,
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

export default ProtocolsTab;