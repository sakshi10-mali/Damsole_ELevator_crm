"use client";

import { motion } from "framer-motion";
import { IoCheckmarkCircle, IoRadioButtonOn } from "react-icons/io5";

interface TimelineItem {
  stage: string;
  completed: boolean;
  date?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  currentStage: string;
}

export default function Timeline({ items, currentStage }: TimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
      <div className="space-y-6">
        {items.map((item, index) => {
          const isActive = item.stage === currentStage;
          const isCompleted = item.completed || items.findIndex(i => i.stage === currentStage) > index;

          return (
            <motion.div
              key={item.stage}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-start gap-4"
            >
              <div className="relative z-10">
                {isCompleted ? (
                  <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center">
                    <IoCheckmarkCircle className="w-5 h-5 text-white" />
                  </div>
                ) : isActive ? (
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center animate-pulse">
                    <IoRadioButtonOn className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <IoRadioButtonOn className="w-5 h-5 text-gray-500" />
                  </div>
                )}
              </div>
              <div className="flex-1 pt-1">
                <h3 className={`font-medium ${isActive ? "text-primary-600" : isCompleted ? "text-accent-600" : "text-gray-500"}`}>
                  {item.stage}
                </h3>
                {item.date && (
                  <p className="text-sm text-gray-500 mt-1">{item.date}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}






















