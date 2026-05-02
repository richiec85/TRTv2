import React from 'react';
import { Cycle, Compound, LogEntry } from '../types';
import { fmt, phaseColor } from '../utils';
import { PHASE_OPTIONS } from '../types';
import Empty from './Empty';

interface CyclesTabProps {
    cycles: Cycle[];
    compounds: Compound[];
    logs: LogEntry[];
    onDeleteCycle: (id: string) => void;
    onOpenCycle: (cycle?: Cycle) => void;
}

const CyclesTab: React.FC<CyclesTabProps> = ({ cycles, compounds, logs, onDeleteCycle, onOpenCycle }) => {
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

    const getCycleStats = (cycle: Cycle) => {
        const start = new Date(cycle.startDate);
        const end = cycle.endDate ? new Date(cycle.endDate) : new Date();
        const cycleLogs = logs.filter(l => {
            const logDate = new Date(l.datetime);
            return logDate >= start && (!cycle.endDate || logDate <= end);
        });
        return { duration: cycle.endDate ? Math.round((end.getTime() - start.getTime()) / 86400000) : 'Ongoing', logCount: cycleLogs.length };
    };

    const sortedCycles = [...cycles].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    if (cycles.length === 0) {
        return <Empty msg="No cycles yet" />;
    }

    return (
        <div>
            <div style={sectionH}>All Cycles</div>
            <button
                onClick={() => onOpenCycle()}
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
                + Add Cycle
            </button>
            {sortedCycles.map((cycle) => {
                const stats = getCycleStats(cycle);
                const phase = PHASE_OPTIONS.find(p => p.value === cycle.phase);
                return (
                    <div key={cycle.id} className="fade-up" style={{ ...card, borderColor: `${phaseColor(cycle.phase)}22` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{cycle.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                                    {fmt(cycle.startDate)} - {cycle.endDate ? fmt(cycle.endDate) : 'Present'}
                                    {' '} {stats.duration} days {stats.logCount} doses
                                </div>
                            </div>
                            <div style={tag(phase?.color || '#888')}>
                                {phase?.label || cycle.phase}
                            </div>
                        </div>
                        {cycle.notes && (
                            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                                {cycle.notes}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button
                                onClick={() => onOpenCycle(cycle)}
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
                                onClick={() => onDeleteCycle(cycle.id)}
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
                );
            })}
        </div>
    );
};

export default CyclesTab;