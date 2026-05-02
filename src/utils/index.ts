import { format, parseISO, startOfWeek } from 'date-fns';
import { BLOOD_KEYS, BloodKey, NHS_RANGES, ReferenceRange } from '../types';

export const pad = (n: number): string => n < 10 ? `0${n}` : `${n}`;

export const fmt = (d: string | Date): string => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtShort = (d: string | Date): string => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

export const fmtT = (d: string | Date): string => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

export const isoDate = (d: Date = new Date()): string => {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const today = (): string => isoDate(new Date());

export const nowDT = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const daysSince = (d: string): number => {
    return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
};

export const weekStart = (d: string | Date): Date => {
    const date = typeof d === 'string' ? new Date(d) : d;
    const day = date.getDay() || 7;
    const result = new Date(date);
    if (day !== 1) {
        result.setDate(date.getDate() - (day - 1));
    }
    result.setHours(0, 0, 0, 0);
    return result;
};

export const weekKey = (d: string | Date): string => {
    return isoDate(weekStart(d));
};

export const uid = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
};

export const parseDateStr = (s: string): string | null => {
    s = s.trim().replace(/"/g, '');
    let match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    match = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (match) return `${match[3]}-${pad(parseInt(match[2]))}-${pad(parseInt(match[1]))}`;
    const date = new Date(s);
    if (!isNaN(date.getTime())) return isoDate(date);
    return null;
};

export const phaseColor = (p: string): string => {
    const phase = { cut: '#00d4ff', grow: '#7fff6b', maintenance: '#888', cruise: '#c77dff' } as Record<string, string>;
    return phase[p] || '#888';
};

import { SEEDED_COMPOUNDS, SCHEMA_VERSION } from '../types';

export const emptyStore = () => ({
    compounds: [...SEEDED_COMPOUNDS].slice(0, 2),
    logs: [],
    cycles: [],
    bodyMetrics: [],
    bloods: [],
    macros: [],
    activities: [],
    schemaVersion: SCHEMA_VERSION,
});

export const migrateV1 = (old: any) => {
    return {
        compounds: old.compounds || [...SEEDED_COMPOUNDS].slice(0, 2),
        logs: old.logs || [],
        cycles: [],
        bodyMetrics: [],
        bloods: [],
        macros: [],
        activities: [],
        schemaVersion: SCHEMA_VERSION,
    };
};

export const normalize = (d: any) => {
    return {
        compounds: d.compounds || [],
        logs: d.logs || [],
        cycles: d.cycles || [],
        bodyMetrics: d.bodyMetrics || [],
        bloods: d.bloods || [],
        macros: d.macros || [],
        activities: d.activities || [],
        schemaVersion: SCHEMA_VERSION,
    };
};

export const getReferenceRange = (key: BloodKey): ReferenceRange => {
    return NHS_RANGES[key];
};

export const isInRange = (key: BloodKey, value: number): boolean => {
    const range = NHS_RANGES[key];
    return (range.min === null || value >= range.min) && (range.max === null || value <= range.max);
};

export const formatNumber = (v: number, decimals: number = 1): string => {
    if (v < 10) return v.toFixed(decimals);
    return Math.round(v).toString();
};

export const getOptionLabel = (options: Array<{ value: string; label: string }>, value: string): string => {
    return options.find(o => o.value === value)?.label || value;
};

export const debounce = <F extends (...args: any[]) => any>(fn: F, delay: number): ((...args: Parameters<F>) => void) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<F>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};