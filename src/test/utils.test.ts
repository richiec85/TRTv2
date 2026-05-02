import { expect, test, describe } from 'vitest';
import { fmt, isoDate, today, parseDateStr, uid, pad } from '../utils';

describe('Date utilities', () => {
    test('pad adds leading zero', () => {
        expect(pad(5)).toBe('05');
        expect(pad(12)).toBe('12');
    });

    test('isoDate formats date correctly', () => {
        const date = new Date('2026-05-02T12:00:00Z');
        expect(isoDate(date)).toBe('2026-05-02');
    });

    test('today returns current date in ISO format', () => {
        const result = today();
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('parseDateStr handles ISO format', () => {
        expect(parseDateStr('2026-05-02')).toBe('2026-05-02');
    });

    test('parseDateStr handles DD/MM/YYYY format', () => {
        expect(parseDateStr('02/05/2026')).toBe('2026-05-02');
    });

    test('parseDateStr handles MM/DD/YYYY format', () => {
        expect(parseDateStr('05/02/2026')).toBe('2026-05-02');
    });

    test('uid generates unique IDs', () => {
        const id1 = uid();
        const id2 = uid();
        expect(id1).not.toBe(id2);
        expect(id1.length).toBeGreaterThan(10);
    });
});

describe('Format utilities', () => {
    test('fmt formats date', () => {
        const date = new Date('2026-05-02T12:00:00Z');
        const result = fmt(date);
        expect(result).toContain('02');
        expect(result).toContain('May');
        expect(result).toContain('2026');
    });
});