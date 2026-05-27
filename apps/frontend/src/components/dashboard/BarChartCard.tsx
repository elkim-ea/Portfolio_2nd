import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card from "../common/Card";

type ChartItem = {
  day: string;
  requests?: number;
  records?: number;
};

type BarChartCardProps = {
  title: string;
  description: string;
  data: ChartItem[];
  dataKey: "requests" | "records";
};

export default function BarChartCard({
  title,
  description,
  data,
  dataKey,
}: BarChartCardProps) {
  return (
    <Card>
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>

      <div className="mt-6 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "#f1f5f9" }}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
              }}
            />
            <Bar
              dataKey={dataKey}
              fill="#2563eb"
              radius={[8, 8, 0, 0]}
              barSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}