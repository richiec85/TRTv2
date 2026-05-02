import React, { useRef, useEffect } from 'react';

interface DataPoint {
    date: string;
    value: number | null;
}

interface Series {
    id: string;
    name: string;
    color: string;
    data: DataPoint[];
}

interface ReferenceLine {
    value: number;
    color: string;
    label?: string;
    dashed?: boolean;
}

interface LineChartProps {
    series: Series[];
    xKey: string;
    yKey: string;
    xFormatter?: (value: string) => string;
    yLabel?: string;
    referenceLines?: ReferenceLine[];
}

const LineChart: React.FC<LineChartProps> = ({
    series,
    xKey,
    yKey,
    xFormatter = (v) => v,
    yLabel = '',
    referenceLines = [],
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = React.useState<{ x: number; y: number; content: string; visible: boolean }>({
        x: 0,
        y: 0,
        content: '',
        visible: false,
    });

    const drawChart = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const parent = canvas.parentElement;
        if (!parent) return;

        const width = parent.clientWidth;
        const height = 300;
        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);

        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const allValues = series.flatMap(s => s.data.map(d => d[yKey] as number).filter(v => v !== null));
        const minValue = Math.min(...allValues, 0);
        const maxValue = Math.max(...allValues, 1);
        const valueRange = maxValue - minValue || 1;

        const allDates = [...new Set(series.flatMap(s => s.data.map(d => d[xKey])))].sort();
        const dateCount = allDates.length;
        const dateIndexMap = new Map(allDates.map((d, i) => [d, i]));

        referenceLines.forEach(line => {
            const y = padding.top + chartHeight - ((line.value - minValue) / valueRange) * chartHeight;
            ctx.strokeStyle = line.dashed ? `${line.color}80` : line.color;
            ctx.lineWidth = line.dashed ? 1 : 2;
            ctx.setLineDash(line.dashed ? [4, 4] : []);
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
            ctx.setLineDash([]);

            if (line.label) {
                ctx.fillStyle = line.color;
                ctx.font = '10px var(--font)';
                ctx.textAlign = 'right';
                ctx.fillText(line.label, padding.left - 8, y + 3);
            }
        });

        ctx.fillStyle = 'var(--muted)';
        ctx.font = '10px var(--font)';
        ctx.textAlign = 'right';
        
        const yTicks = 5;
        for (let i = 0; i <= yTicks; i++) {
            const value = minValue + (valueRange * i) / yTicks;
            const y = padding.top + chartHeight - (i / yTicks) * chartHeight;
            ctx.fillText(Math.round(value).toString(), padding.left - 8, y + 3);
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
        }

        ctx.font = '10px var(--font)';
        ctx.textAlign = 'center';
        
        const xTicks = Math.min(dateCount, 8);
        const xStep = Math.ceil(dateCount / xTicks);
        
        for (let i = 0; i < dateCount; i += xStep) {
            const date = allDates[i];
            const x = padding.left + (i / (dateCount - 1)) * chartWidth;
            ctx.fillText(xFormatter(date), x, height - 8);
        }

        if (yLabel) {
            ctx.save();
            ctx.translate(12, height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = 'var(--muted)';
            ctx.font = '10px var(--font)';
            ctx.textAlign = 'center';
            ctx.fillText(yLabel, 0, 0);
            ctx.restore();
        }

        series.forEach((s) => {
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            let firstPoint = true;
            s.data.forEach((d) => {
                const dateIndex = dateIndexMap.get(d[xKey]);
                if (dateIndex === undefined || d[yKey] === null) return;

                const x = padding.left + (dateIndex / (dateCount - 1)) * chartWidth;
                const y = padding.top + chartHeight - ((d[yKey] as number - minValue) / valueRange) * chartHeight;

                if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();

            s.data.forEach((d) => {
                const dateIndex = dateIndexMap.get(d[xKey]);
                if (dateIndex === undefined || d[yKey] === null) return;

                const x = padding.left + (dateIndex / (dateCount - 1)) * chartWidth;
                const y = padding.top + chartHeight - ((d[yKey] as number - minValue) / valueRange) * chartHeight;

                ctx.fillStyle = s.color;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
            });
        });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const padding = { left: 50, right: 20 };
        const chartWidth = width - padding.left - padding.right;

        const allDates = [...new Set(series.flatMap(s => s.data.map(d => d[xKey])))].sort();
        const dateCount = allDates.length;

        if (x < padding.left || x > width - padding.right) {
            setTooltip(prev => ({ ...prev, visible: false }));
            return;
        }

        const dateIndex = Math.round(((x - padding.left) / chartWidth) * (dateCount - 1));
        const date = allDates[Math.min(dateIndex, dateCount - 1)];

        let content = `<strong>${xFormatter(date)}</strong><br/>`;
        series.forEach(s => {
            const dataPoint = s.data.find(d => d[xKey] === date);
            if (dataPoint && dataPoint[yKey] !== null) {
                content += `<span style="color:${s.color}">${s.name}: ${dataPoint[yKey]}</span><br/>`;
            }
        });

        setTooltip({
            x: e.clientX,
            y: e.clientY,
            content,
            visible: true,
        });
    };

    const handleMouseLeave = () => {
        setTooltip(prev => ({ ...prev, visible: false }));
    };

    useEffect(() => {
        drawChart();
    }, [series, xKey, yKey, xFormatter, yLabel, referenceLines]);

    useEffect(() => {
        const handleResize = () => {
            drawChart();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [drawChart]);

    return (
        <div style={{ position: 'relative' }}>
            <canvas
                ref={canvasRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ width: '100%', height: 300, cursor: 'crosshair' }}
            />
            <div
                ref={tooltipRef}
                className="chart-tip"
                style={{
                    position: 'absolute',
                    left: tooltip.visible ? tooltip.x + 10 : 0,
                    top: tooltip.visible ? tooltip.y - 10 : 0,
                    visibility: tooltip.visible ? 'visible' : 'hidden',
                }}
                dangerouslySetInnerHTML={{ __html: tooltip.content }}
            />
        </div>
    );
};

export default LineChart;