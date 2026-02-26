"use client";

import { motion } from "framer-motion";
import { 
  IoMegaphone, 
  IoCall, 
  IoCalendar, 
  IoDocumentText, 
  IoDocument, 
  IoConstruct, 
  IoHandLeft, 
  IoCloseCircle 
} from "react-icons/io5";
import { type Lead } from "@/lib/api";

interface LeadStageFlowchartProps {
  currentStage: Lead["stage"];
  onStageChange: (stage: Lead["stage"]) => void;
  isStageAllowed: (targetStage: Lead["stage"]) => boolean;
  errorMessage?: string;
  compact?: boolean;
}

const stages = [
  { value: "New Lead" as const, label: "New Lead", icon: IoMegaphone, color: "bg-primary-500" },
  { value: "Lead Contacted" as const, label: "Lead Contacted", icon: IoCall, color: "bg-primary-500" },
  { value: "Meeting Scheduled" as const, label: "Meeting Scheduled", icon: IoCalendar, color: "bg-primary-500" },
  { value: "Meeting Completed" as const, label: "Meeting Completed", icon: IoDocumentText, color: "bg-primary-500" },
  { value: "Quotation Sent" as const, label: "Quotation Sent", icon: IoDocument, color: "bg-primary-500" },
  { value: "Manager Deliberation" as const, label: "Manager Deliberation", icon: IoConstruct, color: "bg-orange-500" },
  { value: "Order Closed" as const, label: "Order Closed", icon: IoHandLeft, color: "bg-accent-500" },
  { value: "Order Lost" as const, label: "Order Lost", icon: IoCloseCircle, color: "bg-red-500" },
];

export default function LeadStageFlowchart({
  currentStage,
  onStageChange,
  isStageAllowed,
  errorMessage,
  compact = false,
}: LeadStageFlowchartProps) {
  const currentIndex = stages.findIndex(s => s.value === currentStage);

  if (compact) {
    // Compact horizontal view for table
    return (
      <div className="relative">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = stage.value === currentStage;
            const isClickable = isStageAllowed(stage.value) || isActive;
            const isPast = index <= currentIndex;
            const isLocked = !isClickable && !isActive;

            return (
              <div key={stage.value} className="flex flex-col items-center min-w-[60px]">
                <motion.button
                  onClick={() => isClickable && onStageChange(stage.value)}
                  disabled={!isClickable}
                  className={`
                    relative flex flex-col items-center justify-center p-2 rounded-lg transition-all
                    ${isActive 
                      ? `${stage.color} text-white shadow-lg scale-110` 
                      : isPast 
                        ? `${stage.color}/30 text-gray-600` 
                        : isLocked
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : `${stage.color}/20 text-gray-500 hover:${stage.color}/40 cursor-pointer`
                    }
                    ${!isClickable ? "opacity-50" : ""}
                  `}
                  whileHover={isClickable ? { scale: 1.05 } : {}}
                  whileTap={isClickable ? { scale: 0.95 } : {}}
                  title={isLocked ? "Locked" : stage.label}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[8px] mt-1 text-center leading-tight hidden sm:block">
                    {stage.label.split(" ")[0]}
                  </span>
                </motion.button>
                {index < stages.length - 1 && (
                  <div className={`
                    w-2 h-0.5 mt-1
                    ${isPast ? stage.color : "bg-gray-300"}
                  `} />
                )}
              </div>
            );
          })}
        </div>
        {errorMessage && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 z-10 whitespace-nowrap">
            {errorMessage}
          </div>
        )}
      </div>
    );
  }

  // Full vertical flowchart view for card
  return (
    <div className="relative">
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = stage.value === currentStage;
          const isClickable = isStageAllowed(stage.value) || isActive;
          const isPast = index <= currentIndex;
          const isLocked = !isClickable && !isActive;
          const isDecisionPoint = stage.value === "Manager Deliberation";

          return (
            <div key={stage.value} className="relative">
              <motion.button
                onClick={() => isClickable && onStageChange(stage.value)}
                disabled={!isClickable}
                  className={`
                  w-full flex items-center gap-3 p-3 rounded-lg transition-all border-2
                  ${isActive 
                    ? `${stage.color} text-white shadow-lg border-transparent` 
                    : isPast 
                      ? `${stage.color}/30 text-gray-700 border-transparent` 
                      : isLocked
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300"
                        : `${stage.color}/20 text-gray-600 hover:${stage.color}/40 cursor-pointer border-transparent`
                  }
                  ${!isClickable ? "opacity-50" : ""}
                `}
                whileHover={isClickable ? { x: 4 } : {}}
                whileTap={isClickable ? { scale: 0.98 } : {}}
              >
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full
                  ${isActive ? "bg-white/20" : isPast ? "bg-white/10" : "bg-gray-100"}
                `}>
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : isPast ? stage.color : "text-gray-400"}`} />
                </div>
                <div className="flex-1 text-left">
                  <div className={`font-semibold ${isActive ? "text-white" : ""}`}>
                    {stage.label}
                  </div>
                  {isLocked && (
                    <div className="text-xs text-gray-400">(Locked)</div>
                  )}
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </motion.button>
              
              {/* Arrow connector */}
              {index < stages.length - 1 && !isDecisionPoint && (
                <div className={`
                  flex justify-center my-1
                `}>
                  <div className={`
                    w-0.5 h-4
                    ${isPast ? stage.color : "bg-gray-300"}
                  `} />
                </div>
              )}

              {/* Decision point branching */}
              {isDecisionPoint && (
                <div className="flex justify-between items-start my-2 gap-4">
                  <div className="flex-1">
                    <div className={`
                      w-0.5 h-4 mx-auto
                      ${isPast ? "bg-orange-500" : "bg-gray-300"}
                    `} />
                    <motion.button
                      onClick={() => isStageAllowed("Order Closed") && onStageChange("Order Closed")}
                      disabled={!isStageAllowed("Order Closed") && currentStage !== "Order Closed"}
                      className={`
                        w-full mt-2 p-2 rounded-lg text-sm font-semibold transition-all
                        ${currentStage === "Order Closed"
                          ? "bg-accent-500 text-white shadow-lg"
                          : isStageAllowed("Order Closed")
                            ? "bg-accent-500/20 text-accent-700 hover:bg-accent-500/40 cursor-pointer"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }
                      `}
                    >
                      Order Closed
                    </motion.button>
                  </div>
                  <div className="flex-1">
                    <div className={`
                      w-0.5 h-4 mx-auto
                      ${isPast ? "bg-red-500" : "bg-gray-300"}
                    `} />
                    <motion.button
                      onClick={() => isStageAllowed("Order Lost") && onStageChange("Order Lost")}
                      disabled={!isStageAllowed("Order Lost") && currentStage !== "Order Lost"}
                      className={`
                        w-full mt-2 p-2 rounded-lg text-sm font-semibold transition-all
                        ${currentStage === "Order Lost"
                          ? "bg-red-500 text-white shadow-lg"
                          : isStageAllowed("Order Lost")
                            ? "bg-red-500/20 text-red-700 hover:bg-red-500/40 cursor-pointer"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }
                      `}
                    >
                      Order Lost
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {errorMessage && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
          {errorMessage}
        </div>
      )}
    </div>
  );
}

