import React from "react";

type SalesStage = {
  stage: string;
  percentage: number;
  color: string; // tailwind color or hex
};

type SalesPipelineOverviewProps = {
  data: SalesStage[];
  className?: string;
  showDebug?: boolean;
};

const trapezoipClip =
  "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)"; // base trapezoid clip-path

export default function SalesPipelineOverview({
  data,
  className = "",
  showDebug = true,
}: SalesPipelineOverviewProps) {
  // Ensure the pipeline includes a "Meetings Completed" stage (accept singular/plural).
  const defaultMeetingStage: SalesStage = {
    stage: "Meetings Completed",
    percentage: 0,
    color: "#8b5cf6", // violet — distinct from other stages
  };

  const displayData: SalesStage[] = (() => {
    const hasMeetingStage = data.some((d) => /meetings?\s+completed/i.test(d.stage));
    if (hasMeetingStage) return data;

    // Insert the meetings stage immediately after "New Leads" when possible.
    const result = data.slice();
    const newLeadsIndex = result.findIndex((d) => /new\s*leads?/i.test(d.stage));
    if (newLeadsIndex !== -1) {
      result.splice(newLeadsIndex + 1, 0, defaultMeetingStage);
    } else {
      result.push(defaultMeetingStage);
    }
    return result;
  })();

  return (
    <div className={`w-full bg-white rounded-xl shadow-sm p-4 sm:p-6 ${className}`}>
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* LEFT: Funnel */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="flex flex-col gap-3 py-2">
              {displayData.map((item, idx) => {
                const widthPercent = 100 - idx * 14; // decrease width each layer
                const isMeeting = /meetings?\s+completed/i.test(item.stage);
                return (
                  <div
                    key={item.stage}
                    className="mx-auto rounded-xl shadow-sm overflow-hidden"
                    style={{ width: `${widthPercent}%` }}
                  >
                    <div
                      className={`w-full h-14 flex items-center justify-center text-white font-semibold text-sm ${isMeeting ? "ring-4 ring-purple-300" : ""}`}
                      style={{
                        background: item.color,
                        clipPath: trapezoipClip,
                        boxShadow: "0 6px 18px rgba(15,23,42,0.08)",
                      }}
                    >
                      {item.stage}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Percentage circles */}
        <div className="w-full lg:w-1/2 grid grid-cols-2 lg:flex lg:flex-row lg:items-center lg:justify-around gap-4">
          {displayData.map((item) => (
            <div
              key={item.stage}
              className="flex flex-col items-center justify-center gap-2 min-w-[64px]"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center shadow-inner">
                  <span className="text-lg font-semibold text-gray-800">
                    {Math.round(item.percentage)}%
                  </span>
                </div>
                {/* Colored ring */}
                <svg
                  className="absolute -inset-0"
                  width="80"
                  height="80"
                  viewBox="0 0 36 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831
                       a 15.9155 15.9155 0 0 1 0 -31.831"
                    stroke={item.color}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeDasharray={`${(item.percentage / 100) * 100} 100`}
                    transform="rotate(-90 18 18)"
                  />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-700">{item.stage}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showDebug && (
        <div className="mt-4 text-xs text-gray-600">
          <div className="font-medium text-sm text-gray-700 mb-1">Component debug — displayData:</div>
          <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
{JSON.stringify(displayData.map((d) => ({ stage: d.stage, percentage: d.percentage })), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}


