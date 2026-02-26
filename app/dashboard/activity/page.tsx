"use client";

import React from "react";
import ActivityTable from "@/components/dashboard/ActivityTable";

export default function ActivityPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Activity</h1>
        <p className="text-sm text-gray-600">System-wide activity logs and user actions.</p>
      </div>

      <ActivityTable />
    </div>
  );
}


