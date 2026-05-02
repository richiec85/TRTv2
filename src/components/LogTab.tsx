import React from 'react';
import { LogEntry, Compound } from '../types';
import { fmt, fmtShort, fmtT, daysSince } from '../utils';
import Empty from './Empty';

interface LogTabProps {
    logs: LogEntry[];
    compounds: Compound[];
    onDeleteLog: (id: string) => void;
}

const LogTab: React.FC<LogTabProps> = ({ logs, compounds, onDeleteLog }) => {
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

    if (logs.length === 0) {
        return <Empty msg="No doses logged yet" />;
    }

    const sortedLogs = [...logs].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

    return (
        <div>
            <div style={sectionH}>Recent Doses</div>
            {sortedLogs.map((log) => {
                const compound = compounds.find(c => c.id === log.compoundId);
                return (
                    <div key={log.id} className="fade-up" style={card}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                            <div style={dot(log.color || '#00d4ff')} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>
                                    {log.compoundName || compound?.name || log.compoundId}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                                    {log.dose}{log.unit}  {fmt(log.datetime)} at {fmtT(log.datetime)}
                                    {log.site && `  ${log.site}`}
                                </div>
                            </div>
                            <div style={tag((compound || { color: '#00d4ff' }).color)}>
                                {(compound?.type || 'trt').toUpperCase()}
                            </div>
                        </div>
                        {log.notes && (
                            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, paddingLeft: 20 }}>
                                {log.notes}
                            </div>
                        )}
                        <button
                            onClick={() => onDeleteLog(log.id)}
                            style={{
                                marginTop: 12,
                                padding: '6px 12px',
                                fontSize: 10,
                                background: 'rgba(255, 80, 80, 0.1)',
                                color: '#ff5050',
                                border: '1px solid rgba(255, 80, 80, 0.3)',
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
                );
            })}
        </div>
    );
};

export default LogTab;