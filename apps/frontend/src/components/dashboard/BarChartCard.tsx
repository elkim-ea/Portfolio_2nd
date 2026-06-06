import Card from "../common/Card";

type ChartItem = {
  day: string;
  requests?: number;
  records?: number;
  correction?: number;
  conversation?: number;
  levelTest?: number;
  total?: number;
};

type BarChartCardProps = {
  title: string;
  description: string;
  data: ChartItem[];
  dataKey: "requests" | "records" | "total";
};

const getValue = (item: ChartItem, dataKey: BarChartCardProps["dataKey"]) => {
  return item[dataKey] ?? 0;
};

export default function BarChartCard({
  title,
  description,
  data,
  dataKey,
}: BarChartCardProps) {
  const maxValue = Math.max(...data.map((item) => getValue(item, dataKey)), 1);

  return (
    <Card>
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>

      <div className="mt-8 flex h-64 items-end justify-between gap-4">
        {data.map((item) => {
          const value = getValue(item, dataKey);
          const heightPercent = value === 0 ? 0 : Math.max((value / maxValue) * 100, 12);

          return (
            <div
              key={item.day}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
            >
              <div className="relative flex h-52 w-full items-end justify-center">
                <div
                  className="w-10 rounded-t-xl bg-blue-600 transition-all group-hover:bg-blue-700"
                  style={{ height: `${heightPercent}%` }}
                />

                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 hidden w-48 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-lg group-hover:block">
                  <p className="font-semibold text-slate-900">{item.day}</p>

                  {item.correction !== undefined ||
                  item.conversation !== undefined ||
                  item.levelTest !== undefined ? (
                    <div className="mt-3 space-y-1">
                      <p className="text-slate-600">
                        Correction :{" "}
                        <span className="font-bold text-blue-600">
                          {item.correction ?? 0}
                        </span>
                      </p>
                      <p className="text-slate-600">
                        Conversation :{" "}
                        <span className="font-bold text-blue-600">
                          {item.conversation ?? 0}
                        </span>
                      </p>
                      <p className="text-slate-600">
                        Level Test :{" "}
                        <span className="font-bold text-blue-600">
                          {item.levelTest ?? 0}
                        </span>
                      </p>
                      <p className="mt-2 border-t border-slate-100 pt-2 text-slate-900">
                        Total :{" "}
                        <span className="font-bold text-blue-600">
                          {item.total ?? value}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 text-blue-600">
                      {dataKey} : {value}
                    </p>
                  )}
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-500">{item.day}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}