"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import Modal from "@/components/Modal";
import { leadsAPI, projectsAPI, amcAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  IoPeople,
  IoCalendar,
  IoCheckmarkCircle,
  IoTime,
  IoBarChart,
} from "react-icons/io5";
import SalesPipelineOverview from "@/components/dashboard/SalesPipelineOverview";
 

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalLeads: 0,
    leadContacted: 0,
    meetingScheduled: 0,
    meetingsCompleted: 0,
    quotationSent: 0,
    managerDeliberation: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [allAMC, setAllAMC] = useState<any[]>([]);
  const [selectedStatCard, setSelectedStatCard] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Poll dashboard data periodically so pipeline updates when lead status changes elsewhere.
  useEffect(() => {
    const interval = setInterval(() => {
      loadData().catch(() => {});
    }, 20000); // every 20s
    return () => clearInterval(interval);
  }, []);

  // Helper function to parse meeting date/time from notes
  const parseMeetingDateTime = (lead: any): string | null => {
    if (!lead.notes || lead.stage !== "Meeting Scheduled") return null;
    
    try {
      // Look for meeting scheduled section
      const meetingMatch = lead.notes.match(/--- MEETING SCHEDULED ---([\s\S]*?)(?=---|\[|$)/i);
      if (meetingMatch) {
        const meetingSection = meetingMatch[1];
        
        // Look for Next Follow-up Date
        const followUpMatch = meetingSection.match(/Next Follow-up Date:\s*(.+)/i);
        if (followUpMatch) {
          const dateStr = followUpMatch[1].trim();
          if (dateStr && dateStr !== "N/A" && dateStr !== "") {
            // Try to parse and format the date
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              return date.toLocaleString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
            }
            return dateStr; // Return as-is if parsing fails
          }
        }
      }
      
      // Also check in NEXT ACTION section
      const nextActionMatch = lead.notes.match(/NEXT ACTION:[\s\S]*?Next Follow-up Date:\s*(.+)/i);
      if (nextActionMatch) {
        const dateStr = nextActionMatch[1].trim();
        if (dateStr && dateStr !== "N/A" && dateStr !== "") {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date.toLocaleString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          }
          return dateStr;
        }
      }
    } catch (error) {
      console.error("Error parsing meeting date:", error);
    }
    
    return null;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const leadsData = await leadsAPI.getAll();

      // Calculate lead stage metrics from live data
      const totalLeads = leadsData.length;
      const leadContacted = leadsData.filter((l: any) => l.stage === "Lead Contacted").length;
      const meetingScheduledLeads = leadsData.filter((l: any) => l.stage === "Meeting Scheduled");
      const meetingScheduled = meetingScheduledLeads.length;
      // Treat meetings as completed if either stage is "Meeting Completed" or an explicit meetingStatus flag exists.
      const meetingsCompleted = leadsData.filter(
        (l: any) =>
          l.stage === "Meeting Completed" ||
          (l.meetingStatus && String(l.meetingStatus).toLowerCase() === "completed")
      ).length;
      const quotationSent = leadsData.filter((l: any) => l.stage === "Quotation Sent").length;
      const managerDeliberation = leadsData.filter((l: any) => l.stage === "Manager Deliberation").length;

      setStats({
        totalLeads,
        leadContacted,
        meetingScheduled,
        meetingsCompleted,
        quotationSent,
        managerDeliberation,
      });
      setRecentLeads(leadsData.slice(0, 3));
      // Store leads with parsed meeting dates
      const leadsWithMeetingDates = leadsData.map((lead: any) => ({
        ...lead,
        meetingDateTime: lead.stage === "Meeting Scheduled" ? parseMeetingDateTime(lead) : null
      }));
      setAllLeads(leadsWithMeetingDates);
      
      // Load projects and AMC for other sections
      try {
        const [projectsData, amcData] = await Promise.all([
          projectsAPI.getAll(),
          amcAPI.getAll().catch(() => []),
        ]);
        setRecentProjects(projectsData.slice(0, 3));
      setAllProjects(projectsData);
      setAllAMC(amcData || []);
      } catch (err) {
        console.error("Failed to load projects/AMC:", err);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (title: string) => {
    setSelectedStatCard(title);
  };

  const handleViewMore = () => {
    router.push("/dashboard/leads");
  };


  // Compute meeting scheduled trend text
  const getMeetingScheduledTrend = () => {
    const scheduledLeads = allLeads.filter((l: any) => l.stage === "Meeting Scheduled");
    if (scheduledLeads.length === 0) return "Meetings planned";
    
    const dates = scheduledLeads
      .map((l: any) => {
        const dateTime = l.meetingDateTime || parseMeetingDateTime(l);
        return dateTime;
      })
      .filter((d: string | null) => d !== null && d !== "")
      .slice(0, 2); // Show max 2 dates
    
    if (dates.length === 0) return "Meetings planned";
    return dates.join(" • ");
  };

  const statCards = [
    {
      title: "Total Leads",
      value: stats.totalLeads,
      icon: <IoPeople className="w-6 h-6" />,
      trend: "All leads in pipeline",
      color: "blue" as const,
      stage: "All" as const,
    },
    {
      title: "Lead Contacted",
      value: stats.leadContacted,
      icon: <IoCheckmarkCircle className="w-6 h-6" />,
      trend: "Initial contact made",
      color: "blue" as const,
      stage: "Lead Contacted" as const,
    },
    {
      title: "Meeting Scheduled",
      value: stats.meetingScheduled,
      icon: <IoCalendar className="w-6 h-6" />,
      trend: getMeetingScheduledTrend(),
      color: "purple" as const,
      stage: "Meeting Scheduled" as const,
    },
    {
      title: "Meetings Completed",
      value: stats.meetingsCompleted,
      icon: <IoCheckmarkCircle className="w-6 h-6" />,
      trend: "Meetings finished",
      color: "blue" as const,
      stage: "Meeting Completed" as const,
    },
    {
      title: "Quotation Sent",
      value: stats.quotationSent,
      icon: <IoTime className="w-6 h-6" />,
      trend: "Quotations delivered",
      color: "orange" as const,
      stage: "Quotation Sent" as const,
    },
    {
      title: "Manager Deliberation",
      value: stats.managerDeliberation,
      icon: <IoBarChart className="w-6 h-6" />,
      trend: "Under review",
      color: "purple" as const,
      stage: "Manager Deliberation" as const,
    },
  ];
  
  const currentSelectedStat = selectedStatCard ? statCards.find(s => s.title === selectedStatCard) : null;
  const filteredLeadsForModal = currentSelectedStat
    ? (currentSelectedStat.stage === "All" ? allLeads : allLeads.filter((lead: any) => lead.stage === currentSelectedStat.stage))
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const salesStages = [
    {
      stage: "New Leads",
      percentage: stats.totalLeads > 0 ? 100 : 0,
      color: "#3b82f6", // blue
    },
    {
      stage: "Meetings Completed",
      percentage:
        stats.totalLeads > 0 ? Math.round((stats.meetingsCompleted / stats.totalLeads) * 100) : 0,
      color: "#8b5cf6", // violet
    },
    {
      stage: "Quotations Sent",
      percentage:
        stats.totalLeads > 0 ? Math.round((stats.quotationSent / stats.totalLeads) * 100) : 0,
      color: "#1e3a6e", // primary blue
    },
    {
      stage: "Orders Confirmed",
      percentage:
        allProjects.length > 0
          ? Math.round(
              (allProjects.filter((p: any) => p.currentStage === "Order Confirmed").length /
                Math.max(1, allProjects.length)) *
                100
            )
          : 0,
      color: "#f59e0b", // orange
    },
    {
      stage: "Installations",
      percentage:
        allProjects.length > 0
          ? Math.round(
              (allProjects.filter(
                (p: any) =>
                  p.currentStage === "Installed" || p.currentStage === "Installation Completed"
              ).length /
                Math.max(1, allProjects.length)) *
                100
            )
          : 0,
      color: "#ef4444", // red
    },
  ];

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Dashboard Overview</h1>
        <p className="text-sm sm:text-base text-gray-600">Welcome back! Here's what's happening with your business.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            onClick={() => handleCardClick(stat.title)}
            className="cursor-pointer"
          >
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      

      <div className="mb-6">
        <SalesPipelineOverview data={salesStages} showDebug={false} />
      </div>

      {/* Details Modal */}
      {currentSelectedStat && (
        <Modal
          isOpen={selectedStatCard !== null}
          onClose={() => setSelectedStatCard(null)}
          title={currentSelectedStat.stage === "All" ? "All Leads" : `${currentSelectedStat.title} Leads`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Total: <span className="font-semibold text-gray-900">{filteredLeadsForModal.length}</span> leads
              </p>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {filteredLeadsForModal.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {currentSelectedStat.stage === "All" ? "No leads found" : `No leads in ${currentSelectedStat.title} stage`}
                  </p>
                </div>
              ) : (
                filteredLeadsForModal.map((lead: any) => {
                  const meetingDateTime = lead.stage === "Meeting Scheduled"
                    ? (lead.meetingDateTime || parseMeetingDateTime(lead))
                    : null;

                  return (
                    <div key={lead.id || lead._id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{lead.name}</p>
                          <p className="text-xs text-gray-600 truncate mt-1">{lead.company || "N/A"}</p>
                          {meetingDateTime && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-purple-600 font-medium">
                              <IoCalendar className="w-3 h-3" />
                              <span>{meetingDateTime}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            {lead.email && (
                              <span className="truncate">{lead.email}</span>
                            )}
                            {lead.phone && (
                              <span>{lead.phone}</span>
                            )}
                          </div>
                          {lead.value && (
                            <p className="text-xs font-semibold text-primary-600 mt-1">
                              Value: ₹{(lead.value / 100000).toFixed(1)}L
                            </p>
                          )}
                        </div>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full whitespace-nowrap flex-shrink-0">
                          {lead.stage}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 border-t">
              <button
                onClick={handleViewMore}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                View More
              </button>
            </div>
          </div>
        </Modal>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Recent Leads</h2>
          <div className="space-y-3 sm:space-y-4">
            {recentLeads.length > 0 ? (
              recentLeads.map((lead) => (
                <div key={lead.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base text-gray-900 truncate">{lead.name}</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{lead.company}</p>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <p className="font-semibold text-sm sm:text-base text-gray-900">₹{(lead.value / 100000).toFixed(1)}L</p>
                    <p className="text-xs text-gray-500">{lead.stage}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4 text-sm sm:text-base">No leads found</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Project Status</h2>
          <div className="space-y-3 sm:space-y-4">
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
                    <p className="font-medium text-sm sm:text-base text-gray-900 truncate">{project.projectName}</p>
                    <p className="text-xs sm:text-sm text-gray-600">{project.currentStage}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4 text-sm sm:text-base">No projects found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}






