import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function ProfitTrendChart({ labels = [], dataPoints = [] }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || labels.length === 0) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Net Profit',
            data: dataPoints,
            borderColor: '#06b6d4',
            backgroundColor: gradient,
            borderWidth: 3,
            pointBackgroundColor: '#06b6d4',
            pointBorderColor: '#000',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(7,16,36,0.95)',
            borderColor: 'rgba(6,182,212,0.3)',
            borderWidth: 1,
            titleFont: { family: 'JetBrains Mono', size: 10 },
            bodyFont: { family: 'JetBrains Mono', size: 11 },
            callbacks: {
              label(context) {
                return `Net Profit: ${Number(context.parsed.y).toLocaleString()} Br`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 9, family: 'JetBrains Mono' } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#64748b',
              font: { size: 9, family: 'JetBrains Mono' },
              callback: (v) => `${(v / 1000).toFixed(0)}k`,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [labels, dataPoints]);

  return (
    <div className="w-full h-[220px] relative">
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
