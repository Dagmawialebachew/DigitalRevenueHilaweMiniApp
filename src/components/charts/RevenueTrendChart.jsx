import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function RevenueTrendChart({ data, onCanvasReady }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    const labels = data.labels || [];
    const revenueProducts = (data.revenue_products || []).map(Number);
    const revenueClub = (data.revenue_club || []).map(Number);
    const users = (data.users || []).map(Number);

    const gradient = ctx.createLinearGradient(0, 0, 0, 350);
    gradient.addColorStop(0, 'rgba(34, 211, 238, 0.25)');
    gradient.addColorStop(1, 'rgba(34, 211, 238, 0)');

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'line',
            label: 'PRODUCT SALES (ETB)',
            data: revenueProducts,
            borderColor: '#22d3ee',
            borderWidth: 3,
            tension: 0.36,
            fill: true,
            backgroundColor: gradient,
            pointBackgroundColor: '#22d3ee',
            pointBorderColor: 'rgba(34,211,238,0.4)',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#fff',
            yAxisID: 'yRevenue',
            order: 1,
          },
          {
            type: 'line',
            label: 'CLUB REVENUE (ETB)',
            data: revenueClub,
            borderColor: '#f59e0b',
            borderWidth: 2,
            borderDash: [5, 4],
            tension: 0.36,
            fill: false,
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: 'rgba(245,158,11,0.4)',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#fff',
            yAxisID: 'yRevenue',
            order: 2,
          },
          {
            type: 'bar',
            label: 'NEW NODES',
            data: users,
            backgroundColor: 'rgba(99, 102, 241, 0.25)',
            hoverBackgroundColor: 'rgba(99, 102, 241, 0.55)',
            borderColor: 'rgba(99, 102, 241, 0.35)',
            borderWidth: 1,
            borderRadius: 6,
            barPercentage: 0.4,
            yAxisID: 'yUsers',
            order: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1200,
          easing: 'easeOutQuart',
        },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 9 } },
          },
          yRevenue: {
            position: 'left',
            grid: { color: 'rgba(255,255,255,0.03)' },
            ticks: {
              color: '#22d3ee',
              font: { family: 'JetBrains Mono', size: 9 },
              callback: (v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`),
            },
          },
          yUsers: {
            position: 'right',
            display: false,
            grid: { display: false },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: '#94a3b8',
              font: { family: 'JetBrains Mono', size: 9, weight: '600' },
              boxWidth: 8,
              boxHeight: 8,
              usePointStyle: true,
              padding: 14,
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(7,16,36,0.95)',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            padding: 10,
            titleFont: { family: 'JetBrains Mono', size: 10, weight: '700' },
            bodyFont: { family: 'JetBrains Mono', size: 11 },
            callbacks: {
              label(context) {
                const label = context.dataset.label || '';
                const val = context.parsed.y;
                if (label.includes('ETB')) {
                  return `${label}: ${Intl.NumberFormat().format(val)} Br`;
                }
                return `${label}: ${val}`;
              },
              afterBody(items) {
                const idx = items[0]?.dataIndex;
                const prod = revenueProducts[idx] || 0;
                const club = revenueClub[idx] || 0;
                const total = prod + club;
                const usr = users[idx] || 0;
                const lines = [`COMBINED: ${Intl.NumberFormat().format(total)} Br`];
                if (usr > 0) {
                  lines.push(`ARPU: ${(total / usr).toFixed(1)} Br`);
                }
                return lines;
              },
            },
          },
        },
      },
    });

    if (onCanvasReady) {
      onCanvasReady(canvasRef.current);
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [data, onCanvasReady]);

  return (
    <div className="w-full h-full min-h-[300px] relative">
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
