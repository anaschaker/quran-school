"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ReportChartDatum = {
  label: string;
  value: number;
};

type ReportBarChartProps = {
  data: ReportChartDatum[];
  color?: string;
  unit?: string;
  valueName?: string;
  height?: number;
};

const axisStyle = { fontSize: 11, fill: "#265745" };
const axisLine = { stroke: "#bad9c9" };

export function ReportBarChart({
  data,
  color = "#0f3d2e",
  unit = "",
  valueName = "القيمة",
  height = 280,
}: ReportBarChartProps) {
  if (data.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-brand-900/15 bg-brand-50/40 p-4 text-sm text-brand-600">
        لا توجد بيانات كافية لعرض الرسم البياني.
      </p>
    );
  }

  return (
    <div className="w-full" style={{ height }} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 24, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dcece4" />
          <XAxis
            dataKey="label"
            tick={axisStyle}
            tickLine={false}
            axisLine={axisLine}
            interval={0}
            angle={data.length > 6 ? -25 : 0}
            textAnchor={data.length > 6 ? "end" : "middle"}
            height={data.length > 6 ? 60 : 32}
          />
          <YAxis
            tick={axisStyle}
            tickLine={false}
            axisLine={axisLine}
            width={36}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "0.75rem",
              border: "1px solid #bad9c9",
              fontSize: "0.75rem",
              direction: "rtl",
            }}
            formatter={(value) => [`${value}${unit}`, valueName]}
          />
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} name={valueName} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

type ReportPieChartProps = {
  data: ReportChartDatum[];
  unit?: string;
  height?: number;
};

const pieColors = ["#0f3d2e", "#c9a227", "#b91c1c", "#2e6b54"];

export function ReportPieChart({
  data,
  unit = "",
  height = 280,
}: ReportPieChartProps) {
  const visible = data.filter((item) => item.value > 0);

  if (visible.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-brand-900/15 bg-brand-50/40 p-4 text-sm text-brand-600">
        لا توجد بيانات كافية لعرض الرسم البياني.
      </p>
    );
  }

  return (
    <div className="w-full" style={{ height }} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={visible}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius="45%"
            outerRadius="78%"
            paddingAngle={2}
          >
            {visible.map((item, index) => (
              <Cell
                key={item.label}
                fill={pieColors[index % pieColors.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: "0.75rem",
              border: "1px solid #bad9c9",
              fontSize: "0.75rem",
              direction: "rtl",
            }}
            formatter={(value, name) => [`${value}${unit}`, name]}
          />
          <Legend
            wrapperStyle={{ fontSize: "0.75rem", direction: "rtl" }}
            formatter={(value) => value}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
