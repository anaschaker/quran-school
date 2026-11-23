"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type GradePoint = {
  date: string;
  grade: number;
  type: string;
};

type GradeChartProps = {
  data: GradePoint[];
};

export function GradeChart({ data }: GradeChartProps) {
  if (data.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-brand-900/15 bg-brand-50/40 p-4 text-sm text-brand-600">
        لا توجد بيانات تسميع كافية لرسم التقدم.
      </p>
    );
  }

  return (
    <div className="h-72 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dcece4" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#265745" }}
            tickLine={false}
            axisLine={{ stroke: "#bad9c9" }}
          />
          <YAxis
            domain={[1, 10]}
            ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
            tick={{ fontSize: 11, fill: "#265745" }}
            tickLine={false}
            axisLine={{ stroke: "#bad9c9" }}
            width={28}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "0.75rem",
              border: "1px solid #bad9c9",
              fontSize: "0.75rem",
              direction: "rtl",
            }}
            formatter={(value) => [`${value} / 10`, "التقدير"]}
            labelFormatter={(label) => `التاريخ: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="grade"
            stroke="#0f3d2e"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#c9a227", stroke: "#0f3d2e", strokeWidth: 1.5 }}
            activeDot={{ r: 6, fill: "#c9a227" }}
            name="التقدير"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
