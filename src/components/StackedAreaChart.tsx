import React, { useRef, useEffect } from 'react';

interface DataPoint {
    date: string;
    value: number;
}

interface Series {
    id: string;
    name: string;
    color: string;
    data: DataPoint[];
}

interface StackedAreaChartProps {
    data: Series[];
    xKey: string;
    yKey: string;
    xFormatter?: (value: string) => string;
    yLabel?: string;
}

const SWATCHES = ['#00d4ff', '#7fff6b', '#ff6b35', '#c77dff', '#ffd166', '#ff6b9d', '#ff5050', '#85d5ff'];

const StackedAreaChart: React.FC<StackedAreaChartProps> = ({
    data,
    xKey,
    yKey,
    xFormatter = (v) => v,
    yLabel = '',
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

        const padding = { top: 20, right: 140, bottom: 40, left: 50 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const allDates = [...new Set(data.flatMap(s => s.data.map(d => d[xKey])))].sort();
        const dateCount = allDates.length;
        const dateIndexMap = new Map(allDates.map((d, i) => [d, i]));

        const stackedValues: number[][] = [];
        const seriesValues: number[][] = [];
        
        allDates.forEach(date => {
            const dateValues: number[] = [];
            let cumulative = 0;
            data.forEach(s => {
                const dataPoint = s.data.find(d => d[xKey] === date);
                const value = dataPoint ? dataPoint[yKey] : 0;
                dateValues.push(value);
                cumulative += value;
            });
            stackedValues.push(cumulative);
            seriesValues.push(dateValues);
        });

        const maxValue = Math.max(...stackedValues, 1);

        const gradients: CanvasGradient[] = [];
        data.forEach(s => {
            const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
            gradient.addColorStop(0, `${s.color}80`);
            gradient.addColorStop(1, `${s.color}22`);
            gradients.push(gradient);
        });

        for (let i = data.length - 1; i >= 0; i--) {
            ctx.fillStyle = gradients[i];
            ctx.beginPath();
            
            let firstPoint = true;
            allDates.forEach((date, dateIndex) => {
                const bottomValue = i > 0 ? seriesValues[dateIndex].slice(0, i).reduce((a, b) => a + b, 0) : 0;
                const topValue = bottomValue + seriesValues[dateIndex][i];
                
                const x = padding.left + (dateIndex / (dateCount - 1)) * chartWidth;
                const bottomY = padding.top + chartHeight - (bottomValue / maxValue) * chartHeight;
                const topY = padding.top + chartHeight - (topValue / maxValue) * chartHeight;

                if (firstPoint) {
                    ctx.moveTo(x, bottomY);
                    firstPoint = false;
                }
                ctx.lineTo(x, topY);
            });

            allDates.forEach((date, dateIndex) => {
                const bottomValue = i > 0 ? seriesValues[dateIndex].slice(0, i).reduce((a, b) => a + b, 0) : 0;
                const x = padding.left + (dateIndex / (dateCount - 1)) * chartWidth;
                const bottomY = padding.top + chartHeight - (bottomValue / maxValue) * chartHeight;
                ctx.lineTo(x, bottomY);
            });

            ctx.closePath();
            ctx.fill();
        }

        data.forEach((s, i) => {
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            let cumulative = 0;
            let firstPoint = true;
            
            allDates.forEach((date, dateIndex) => {
                const value = seriesValues[dateIndex][i];
                cumulative += value;
                
                const x = padding.left + (dateIndex / (dateCount - 1)) * chartWidth;
                const y = padding.top + chartHeight - (cumulative / maxValue) * chartHeight;

                if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();
        });

        ctx.fillStyle = 'var(--muted)';
        ctx.font = '10px var(--font)';
        ctx.textAlign = 'right';
        
        const yTicks = 5;
        for (let i = 0; i <= yTicks; i++) {
            const value = (maxValue * i) / yTicks;
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

        data.forEach((s, i) => {
            ctx.fillStyle = s.color;
            ctx.font = '10px var(--font)';
            ctx.textAlign = 'left';
            
            const legendX = width - padding.right + 20;
            const legendY = padding.top + 20 + i * 18;
            
            ctx.fillText(s.name, legendX + 14, legendY + 4);
            
            ctx.fillStyle = s.color;
            ctx.fillRect(legendX, legendY - 2, 10, 10);
        });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const padding = { left: 50, right: 140 };
        const chartWidth = width - padding.left - padding.right;

        const allDates = [...new Set(data.flatMap(s => s.data.map(d => d[xKey])))].sort();
        const dateCount = allDates.length;

        if (x < padding.left || x > width - padding.right) {
            setTooltip(prev => ({ ...prev, visible: false }));
            return;
        }

        const dateIndex = Math.round(((x - padding.left) / chartWidth) * (dateCount - 1));
        const date = allDates[Math.min(dateIndex, dateCount - 1)];

        let content = `<strong>${xFormatter(date)}</strong><br/>`;
        let cumulative = 0;
        data.forEach(s => {
            const dataPoint = s.data.find(d => d[xKey] === date);
            const value = dataPoint ? dataPoint[yKey] : 0;
            cumulative += value;
            content += `<span style="color:${s.color}">${s.name}: ${value} (Total: ${cumulative})</span><br/>`;
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
    }, [data, xKey, yKey, xFormatter, yLabel]);

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

export default StackedAreaChart;