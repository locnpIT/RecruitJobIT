"use client";

import type { ReactNode } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";

ChartJS.register(ArcElement, BarElement, CategoryScale, Filler, LinearScale, LineElement, PointElement, Legend, Tooltip);

type SimpleChartCardProps = {
  title: string;
  description?: string;
  kind: "doughnut" | "bar" | "line";
  labels: string[];
  values: number[];
  colors: string[];
  heightClassName?: string;
  footer?: string;
  headerRight?: ReactNode;
};

const defaultBarOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context) => `${context.raw} mục`,
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#64748b",
        font: {
          size: 11,
        },
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: "#64748b",
        font: {
          size: 11,
        },
        precision: 0,
      },
      grid: {
        color: "#e2e8f0",
      },
    },
  },
};

const defaultDoughnutOptions: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "68%",
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        color: "#334155",
        boxWidth: 10,
        boxHeight: 10,
        usePointStyle: true,
        pointStyle: "circle",
      },
    },
  },
};

const defaultLineOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context) => `${context.raw} mục`,
      },
    },
  },
  elements: {
    line: {
      tension: 0.35,
      borderWidth: 2,
    },
    point: {
      radius: 3,
      hoverRadius: 5,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#64748b",
        maxRotation: 0,
        autoSkip: true,
        font: {
          size: 11,
        },
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: "#64748b",
        font: {
          size: 11,
        },
        precision: 0,
      },
      grid: {
        color: "#e2e8f0",
      },
    },
  },
};

export function SimpleChartCard({
  title,
  description,
  kind,
  labels,
  values,
  colors,
  heightClassName = "h-72",
  footer,
  headerRight,
}: SimpleChartCardProps) {
  const data: ChartData<"bar" | "doughnut", number[], string> = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1,
        borderRadius: kind === "bar" ? 8 : undefined,
      },
    ],
  };

  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
        {description ? <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p> : null}
        {headerRight ? <div className="mt-2">{headerRight}</div> : null}
      </div>

      <div className={`mt-4 ${heightClassName}`}>
        {kind === "doughnut" ? (
          <Doughnut data={data as ChartData<"doughnut", number[], string>} options={defaultDoughnutOptions} />
        ) : kind === "line" ? (
          <Line
            data={data as ChartData<"line", number[], string>}
            options={defaultLineOptions}
          />
        ) : (
          <Bar data={data as ChartData<"bar", number[], string>} options={defaultBarOptions} />
        )}
      </div>

      {footer ? <p className="mt-3 text-xs leading-5 text-slate-500">{footer}</p> : null}
    </article>
  );
}
