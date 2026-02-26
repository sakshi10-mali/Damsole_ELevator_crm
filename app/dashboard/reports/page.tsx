"use client";

import { useState, useMemo } from "react";
import StatCard from "@/components/StatCard";
import {
  IoPeople,
  IoFolder,
  IoCalendar,
  IoCash,
  IoArrowUp,
  IoArrowDown,
  IoBarChart,
  IoSearch,
} from "react-icons/io5";

const teamPerformanceData = [
  { name: "Sales Executive 1", leads: 45, won: 15, revenue: "₹1.2 Cr", conversion: "33%" },
  { name: "Sales Executive 2", leads: 38, won: 12, revenue: "₹98L", conversion: "32%" },
  { name: "Sales Executive 3", leads: 32, won: 9, revenue: "₹72L", conversion: "28%" },
];

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter team performance data based on search query
  const filteredTeamData = useMemo(() => {
    if (!searchQuery.trim()) return teamPerformanceData;
    const query = searchQuery.toLowerCase().trim();
    return teamPerformanceData.filter((exec) => {
      return (
        exec.name.toLowerCase().includes(query) ||
        exec.leads.toString().includes(query) ||
        exec.won.toString().includes(query) ||
        exec.revenue.toLowerCase().includes(query) ||
        exec.conversion.includes(query)
      );
    });
  }, [searchQuery]);

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Reports & Analytics</h1>
        <p className="text-sm sm:text-base text-gray-600">Comprehensive insights into your business performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Total Revenue"
          value="₹2.4 Cr"
          icon={<IoCash className="w-6 h-6" />}
          trend="+18% from last quarter"
          color="blue"
        />
        <StatCard
          title="Lead Conversion"
          value="32%"
          icon={<IoPeople className="w-6 h-6" />}
          trend="+5% improvement"
          color="blue"
        />
        <StatCard
          title="Active Projects"
          value="23"
          icon={<IoFolder className="w-6 h-6" />}
          trend="3 completed this month"
          color="purple"
        />
        <StatCard
          title="AMC Revenue"
          value="₹57.6L"
          icon={<IoCalendar className="w-6 h-6" />}
          trend="Monthly recurring"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Sales Performance</h2>
          <div className="space-y-3 sm:space-y-4">
            {[
              { month: "January 2025", leads: 45, won: 12, revenue: "₹65L" },
              { month: "December 2024", leads: 38, won: 10, revenue: "₹52L" },
              { month: "November 2024", leads: 42, won: 11, revenue: "₹58L" },
            ].map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-medium text-gray-900">{item.month}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{item.leads} leads • {item.won} won</p>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <p className="text-sm sm:text-base font-semibold text-gray-900">{item.revenue}</p>
                  <p className="text-xs text-primary-600">+{Math.floor(Math.random() * 10 + 5)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">AMC Service Status</h2>
          <div className="space-y-3 sm:space-y-4">
            {[
              { status: "Services Due This Month", count: 8, color: "text-orange-600" },
              { status: "Services Completed", count: 24, color: "text-primary-600" },
              { status: "Active Contracts", count: 48, color: "text-blue-600" },
              { status: "Pending Renewals", count: 3, color: "text-yellow-600" },
            ].map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <span className="text-sm sm:text-base font-medium text-gray-900">{item.status}</span>
                <span className={`text-xl sm:text-2xl font-bold ${item.color}`}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col gap-4 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Team Performance</h2>
          {/* Search Bar */}
          <div className="relative w-full sm:w-64 md:w-80">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search team performance..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
            />
          </div>
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className={`mb-4 text-sm rounded-lg px-4 py-2 inline-block ${
            filteredTeamData.length > 0
              ? "bg-primary-50 border border-primary-200 text-gray-600"
              : "bg-red-50 border border-red-200 text-red-600"
          }`}>
            {filteredTeamData.length > 0 ? (
              <>Showing <span className="font-semibold text-primary-700">{filteredTeamData.length}</span> of <span className="font-semibold">{teamPerformanceData.length}</span> executives</>
            ) : (
              <>No executives found for "<span className="font-semibold">{searchQuery}</span>"</>
            )}
          </div>
        )}

        {/* Mobile Card View */}
        <div className="block md:hidden space-y-3">
          {filteredTeamData.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">No results found</div>
          ) : (
            filteredTeamData.map((exec, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-900">{exec.name}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Leads</p>
                    <p className="text-gray-900 font-medium">{exec.leads}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Won</p>
                    <p className="text-gray-900 font-medium">{exec.won}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Revenue</p>
                    <p className="text-gray-900 font-semibold">{exec.revenue}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Conversion</p>
                    <p className="text-primary-600 font-medium">{exec.conversion}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Executive
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Leads
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Won
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Conversion
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTeamData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 lg:px-6 py-8 text-center text-gray-500">
                    No results found
                  </td>
                </tr>
              ) : (
                filteredTeamData.map((exec, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {exec.name}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {exec.leads}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {exec.won}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {exec.revenue}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-primary-600 font-medium">
                    {exec.conversion}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

