import React from 'react';
import { Compound, LogEntry, BodyMetric, BloodPanel, MacroEntry, Activity } from '../types';
import { fmt, weekKey, getReferenceRange, isInRange } from '../utils';
import { BLOOD_KEYS, NHS_RANGES, BP_TARGET, BP_HIGH } from '../types';
import LineChart from './LineChart';
import StackedAreaChart from './StackedAreaChart';
import Empty from './Empty';

interface ChartsTabProps {
    subtab: 'doses' | 'body' | 'macros' | 'bp' | 'training' | 'bloods';
    onSubtab: (tab: 'doses' | 'body' | 'macros' | 'bp' | 'training' | 'bloods') => void;
    compounds: Compound[];
    logs: LogEntry[];
    bodyMetrics: BodyMetric[];
    bloods: BloodPanel[];
    macros: MacroEntry[];
    activities: Activity[];
}

const ChartsTab: React.FC<ChartsTabProps> = ({
    subtab,
    onSubtab,
    compounds,
    logs,
    bodyMetrics,
    bloods,
    macros,
    activities,
}) => {
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

    const getDoseData = () => {
        const weeklyData: Record<string, Record<string, number>> = {};
        logs.forEach(log => {
            const week = weekKey(log.datetime);
            if (!weeklyData[week]) weeklyData[week] = {};
            if (!weeklyData[week][log.compoundId]) weeklyData[week][log.compoundId] = 0;
            weeklyData[week][log.compoundId] += log.dose;
        });
        
        const sortedWeeks = Object.keys(weeklyData).sort();
        const series = compounds.map(c => ({
            id: c.id,
            name: c.name,
            color: c.color,
            data: sortedWeeks.map(week => ({
                date: week,
                value: weeklyData[week]?.[c.id] || 0,
            })),
        }));
        
        return { weeks: sortedWeeks, series };
    };

    const getBodyData = () => {
        const sorted = [...bodyMetrics].sort((a, b) => a.date.localeCompare(b.date));
        
        return {
            weight: sorted.map(m => ({ date: m.date, value: m.weight || 0 })),
            bf: sorted.map(m => ({ date: m.date, value: m.bf || 0 })),
        };
    };

    const getMacroData = () => {
        const sorted = [...macros].sort((a, b) => a.date.localeCompare(b.date));
        
        return {
            kcal: sorted.map(m => ({ date: m.date, value: m.kcal })),
            protein: sorted.map(m => ({ date: m.date, value: m.protein })),
            carbs: sorted.map(m => ({ date: m.date, value: m.carbs })),
            fat: sorted.map(m => ({ date: m.date, value: m.fat })),
        };
    };

    const getBpData = () => {
        const sorted = [...bloods]
            .filter(b => b.bp_sys || b.bp_dia)
            .sort((a, b) => a.date.localeCompare(b.date));
        
        return {
            sys: sorted.map(b => ({ date: b.date, value: b.bp_sys || 0 })),
            dia: sorted.map(b => ({ date: b.date, value: b.bp_dia || 0 })),
        };
    };

    const getTrainingData = () => {
        const weeklyData: Record<string, { duration: number; distance: number; count: number }> = {};
        activities.forEach(a => {
            const week = weekKey(a.date);
            if (!weeklyData[week]) weeklyData[week] = { duration: 0, distance: 0, count: 0 };
            weeklyData[week].duration += a.durationMin;
            weeklyData[week].distance += a.distanceKm;
            weeklyData[week].count += 1;
        });
        
        const sortedWeeks = Object.keys(weeklyData).sort();
        return {
            weeks: sortedWeeks,
            duration: sortedWeeks.map(week => ({ date: week, value: weeklyData[week].duration })),
            distance: sortedWeeks.map(week => ({ date: week, value: weeklyData[week].distance })),
            count: sortedWeeks.map(week => ({ date: week, value: weeklyData[week].count })),
        };
    };

    const getBloodData = () => {
        const sorted = [...bloods]
            .filter(b => BLOOD_KEYS.some(k => b[k] !== undefined))
            .sort((a, b) => a.date.localeCompare(b.date));
        
        return BLOOD_KEYS.map(key => ({
            id: key,
            name: NHS_RANGES[key as keyof typeof NHS_RANGES].label,
            unit: NHS_RANGES[key as keyof typeof NHS_RANGES].unit,
            data: sorted.map(b => ({ date: b.date, value: b[key as keyof typeof b] || null })),
        }));
    };

    const doseData = getDoseData();
    const bodyData = getBodyData();
    const macroData = getMacroData();
    const bpData = getBpData();
    const trainingData = getTrainingData();
    const bloodData = getBloodData();

    const hasData = {
        doses: doseData.weeks.length > 0,
        body: bodyData.weight.length > 0,
        macros: macroData.kcal.length > 0,
        bp: bpData.sys.length > 0,
        training: trainingData.weeks.length > 0,
        bloods: bloodData.some(s => s.data.some(d => d.value !== null)),
    };

    if (!Object.values(hasData).some(Boolean)) {
        return <Empty msg="No chart data yet" />;
    }

    return (
        <div>
            <div style={nav}>
                {(['doses', 'body', 'macros', 'bp', 'training', 'bloods'] as const).map(t => (
                    <button key={t} style={navBtn(subtab === t)} onClick={() => onSubtab(t)}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>

            {subtab === 'doses' && hasData.doses && (
                <div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
                        Weekly Dose by Compound
                    </div>
                    <StackedAreaChart
                        data={doseData.series}
                        xKey="date"
                        yKey="value"
                        xFormatter={fmt}
                        yLabel="Dose (mg/IU/ml)"
                    />
                </div>
            )}

            {subtab === 'body' && hasData.body && (
                <div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
                        Weight & Body Fat Over Time
                    </div>
                    <LineChart
                        series={[
                            { id: 'weight', name: 'Weight (kg)', color: '#7fff6b', data: bodyData.weight },
                            { id: 'bf', name: 'Body Fat (%)', color: '#c77dff', data: bodyData.bf },
                        ]}
                        xKey="date"
                        yKey="value"
                        xFormatter={fmt}
                    />
                </div>
            )}

            {subtab === 'macros' && hasData.macros && (
                <div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
                        Daily Macros
                    </div>
                    <LineChart
                        series={[
                            { id: 'kcal', name: 'Calories', color: '#ffd166', data: macroData.kcal },
                            { id: 'protein', name: 'Protein (g)', color: '#00d4ff', data: macroData.protein },
                            { id: 'carbs', name: 'Carbs (g)', color: '#7fff6b', data: macroData.carbs },
                            { id: 'fat', name: 'Fat (g)', color: '#ff6b35', data: macroData.fat },
                        ]}
                        xKey="date"
                        yKey="value"
                        xFormatter={fmt}
                    />
                </div>
            )}

            {subtab === 'bp' && hasData.bp && (
                <div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
                        Blood Pressure Over Time
                    </div>
                    <LineChart
                        series={[
                            { id: 'sys', name: 'Systolic', color: '#ff6b35', data: bpData.sys },
                            { id: 'dia', name: 'Diastolic', color: '#7fff6b', data: bpData.dia },
                        ]}
                        xKey="date"
                        yKey="value"
                        xFormatter={fmt}
                        yLabel="mmHg"
                        referenceLines={[
                            { value: BP_TARGET.sys, color: '#7fff6b', label: 'Target Sys' },
                            { value: BP_TARGET.dia, color: '#7fff6b', label: 'Target Dia' },
                            { value: BP_HIGH.sys, color: '#ff5050', label: 'High Sys' },
                            { value: BP_HIGH.dia, color: '#ff5050', label: 'High Dia' },
                        ]}
                    />
                </div>
            )}

            {subtab === 'training' && hasData.training && (
                <div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
                        Weekly Training Volume
                    </div>
                    <LineChart
                        series={[
                            { id: 'duration', name: 'Duration (min)', color: '#00d4ff', data: trainingData.duration },
                            { id: 'distance', name: 'Distance (km)', color: '#7fff6b', data: trainingData.distance },
                        ]}
                        xKey="date"
                        yKey="value"
                        xFormatter={fmt}
                    />
                </div>
            )}

            {subtab === 'bloods' && hasData.bloods && (
                <div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
                        Blood Markers Over Time
                    </div>
                    {bloodData.map(series => (
                        <div key={series.id} style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                                {series.name}
                            </div>
                            <LineChart
                                series={[{ ...series, color: ['#00d4ff', '#7fff6b', '#ff6b35', '#c77dff', '#ffd166', '#ff6b9d', '#ff5050', '#85d5ff'][BLOOD_KEYS.indexOf(series.id as any) % 8] }]}
                                xKey="date"
                                yKey="value"
                                xFormatter={fmt}
                                yLabel={series.unit}
                            />
                        </div>
                    ))}
                </div>
            )}

            {!hasData[subtab] && (
                <Empty msg={`No ${subtab} data available for charting`} />
            )}
        </div>
    );
};

export default ChartsTab;