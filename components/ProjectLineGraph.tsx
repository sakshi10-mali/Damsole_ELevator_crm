"use client";

import { useMemo } from "react";
import { Project } from "@/lib/api";

interface ProjectLineGraphProps {
  projects: Project[];
  selectedProject?: Project | null;
}

export default function ProjectLineGraph({ projects, selectedProject }: ProjectLineGraphProps) {
  // Prepare data for the graph
  const graphData = useMemo(() => {
    if (selectedProject) {
      // Single project timeline
      const stages = [
        "Order Confirmed",
        "Design & Engineering",
        "Material Procurement",
        "Installation Process",
        "Testing & QA",
        "Handover",
      ];
      
      const stageIndex = stages.indexOf(selectedProject.currentStage);
      const progressPoints = [];
      
      // Generate progress points over time (simulated)
      const startDate = selectedProject.startDate ? new Date(selectedProject.startDate) : new Date();
      const endDate = selectedProject.expectedCompletion ? new Date(selectedProject.expectedCompletion) : new Date();
      const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      for (let i = 0; i <= stageIndex; i++) {
        const progress = ((i + 1) / stages.length) * 100;
        const date = new Date(startDate);
        date.setDate(date.getDate() + (daysDiff * (i + 1) / stages.length));
        progressPoints.push({
          date: date.toISOString().split("T")[0],
          progress,
          stage: stages[i],
        });
      }
      
      return {
        type: "single" as const,
        data: progressPoints,
        projectName: selectedProject.projectName,
      };
    } else {
      // Multiple projects comparison
      const projectProgress = projects.map((project) => ({
        name: project.projectName,
        progress: project.progress || 0,
        status: project.status,
        stage: project.currentStage,
      }));
      
      return {
        type: "multiple" as const,
        data: projectProgress,
      };
    }
  }, [projects, selectedProject]);

  const width = 800;
  const height = 400;
  const padding = { top: 40, right: 40, bottom: 60, left: 60 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  if (graphData.type === "single") {
    const { data, projectName } = graphData;
    
    if (data.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Progress Timeline</h3>
          <p className="text-gray-500 text-center py-8">No progress data available</p>
        </div>
      );
    }

    // Calculate x and y positions
    const maxProgress = 100;
    const minDate = new Date(data[0].date);
    const maxDate = new Date(data[data.length - 1].date);
    const dateRange = maxDate.getTime() - minDate.getTime();

    const points = data.map((point, index) => {
      const x = padding.left + (index / (data.length - 1 || 1)) * graphWidth;
      const y = padding.top + graphHeight - (point.progress / maxProgress) * graphHeight;
      return { x, y, ...point };
    });

    // Create path for line
    const pathData = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Progress Timeline: {projectName}
        </h3>
        <div className="overflow-x-auto">
          <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`}>
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((value) => {
              const y = padding.top + graphHeight - (value / 100) * graphHeight;
              return (
                <g key={value}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="12"
                    fill="#6b7280"
                  >
                    {value}%
                  </text>
                </g>
              );
            })}

            {/* X-axis labels (dates) */}
            {points.map((point, index) => {
              if (index % Math.ceil(points.length / 5) === 0 || index === points.length - 1) {
                return (
                  <g key={index}>
                    <line
                      x1={point.x}
                      y1={padding.top + graphHeight}
                      x2={point.x}
                      y2={padding.top + graphHeight + 5}
                      stroke="#6b7280"
                      strokeWidth="2"
                    />
                    <text
                      x={point.x}
                      y={height - padding.bottom + 20}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#6b7280"
                      transform={`rotate(-45 ${point.x} ${height - padding.bottom + 20})`}
                    >
                      {new Date(point.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </text>
                  </g>
                );
              }
              return null;
            })}

            {/* Progress line */}
            <path
              d={pathData}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {points.map((point, index) => (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Tooltip on hover */}
                <title>
                  {point.stage}: {point.progress.toFixed(0)}% - {new Date(point.date).toLocaleDateString()}
                </title>
              </g>
            ))}

            {/* Y-axis label */}
            <text
              x={padding.left / 2}
              y={height / 2}
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
              transform={`rotate(-90 ${padding.left / 2} ${height / 2})`}
            >
              Progress (%)
            </text>
          </svg>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {data.map((point, index) => (
            <div
              key={index}
              className="px-3 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium"
            >
              {point.stage}: {point.progress.toFixed(0)}%
            </div>
          ))}
        </div>
      </div>
    );
  } else {
    // Multiple projects view
    const { data } = graphData;
    
    if (data.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Projects Progress</h3>
          <p className="text-gray-500 text-center py-8">No projects available</p>
        </div>
      );
    }

    const maxProgress = 100;
    const barWidth = graphWidth / data.length;
    const barSpacing = 10;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Projects Progress</h3>
        <div className="overflow-x-auto">
          <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`}>
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((value) => {
              const y = padding.top + graphHeight - (value / 100) * graphHeight;
              return (
                <g key={value}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="12"
                    fill="#6b7280"
                  >
                    {value}%
                  </text>
                </g>
              );
            })}

            {/* Bars for each project */}
            {data.map((project, index) => {
              const barHeight = (project.progress / maxProgress) * graphHeight;
              const x = padding.left + index * (barWidth + barSpacing) + barSpacing;
              const y = padding.top + graphHeight - barHeight;
              const color =
                project.status === "On Track"
                  ? "#1e3a6e"
                  : project.status === "Delayed"
                  ? "#ef4444"
                  : "#f59e0b";

              return (
                <g key={index}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth - barSpacing}
                    height={barHeight}
                    fill={color}
                    rx="4"
                  />
                  <text
                    x={x + (barWidth - barSpacing) / 2}
                    y={y - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6b7280"
                    fontWeight="bold"
                  >
                    {project.progress.toFixed(0)}%
                  </text>
                  <text
                    x={x + (barWidth - barSpacing) / 2}
                    y={height - padding.bottom + 15}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#6b7280"
                    transform={`rotate(-45 ${x + (barWidth - barSpacing) / 2} ${height - padding.bottom + 15})`}
                  >
                    {project.name.length > 15
                      ? project.name.substring(0, 15) + "..."
                      : project.name}
                  </text>
                  <title>
                    {project.name}: {project.progress.toFixed(0)}% - {project.stage} - {project.status}
                  </title>
                </g>
              );
            })}

            {/* Y-axis label */}
            <text
              x={padding.left / 2}
              y={height / 2}
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
              transform={`rotate(-90 ${padding.left / 2} ${height / 2})`}
            >
              Progress (%)
            </text>
          </svg>
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-accent-500 rounded"></div>
            <span>On Track</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Delayed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>On Hold</span>
          </div>
        </div>
      </div>
    );
  }
}

