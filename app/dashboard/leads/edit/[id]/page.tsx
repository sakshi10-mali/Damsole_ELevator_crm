"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { leadsAPI, projectsAPI, type Lead } from "@/lib/api";
import Modal from "@/components/Modal";
import { toast } from "@/components/Toast";
import { IoArrowBack, IoCheckmarkCircle } from "react-icons/io5";

// All Indian States and Union Territories
const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export default function EditLeadPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalStage, setOriginalStage] = useState<Lead["stage"]>("New Lead");
  const [leadData, setLeadData] = useState({
    // Basic Lead Details
    name: "",
    phone: "",
    email: "",
    projectLocation: "",
    source: "Website",
    
    // Contact Confirmation
    contactSuccessful: "",
    
    // Contact Details
    contactMode: "",
    contactDateTime: "",
    spokenTo: "",
    
    // Property & Requirement Details
    propertyType: "",
    totalFloors: "",
    primaryUsage: "",
    
    // Site Readiness - Pit
    pitAvailable: "",
    pitDepth: "",
    
    // Site Readiness - Shaft
    shaftAvailable: "",
    shaftType: "",
    shaftSize: "",
    
    // Site Readiness - Machine Room
    machineRoomAvailable: "",
    
    // Elevator Preference
    preferredElevatorType: "",
    brandExpectation: "",
    
    // Client Intent & Commercial
    interestLevel: "",
    budgetDiscussion: "",
    decisionTimeline: "",
    
    // Next Action
    nextStep: "",
    expectedMeetingTimeline: "",
    nextFollowUpDate: "",
    
    // Sales Owner
    salesExecutiveName: "",
    remarks: "",
    
    // Backend fields
    stage: "New Lead" as Lead["stage"],
    value: "",
    assignedTo: "",
    notes: "",
    company: "",
  });

  useEffect(() => {
    if (leadId) {
      loadLead();
    }
  }, [leadId]);

  const loadLead = async () => {
    try {
      setLoading(true);
      const lead = await leadsAPI.getById(leadId);
      
      // Parse notes to extract form data if available
      const notes = lead.notes || "";
      
      // Improved parsing function that handles both bullet (•) and dash (-) formats
      const parseSection = (sectionName: string) => {
        // Escape special regex characters in section name, but keep dashes for section matching
        const escapedSectionName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Try multiple patterns to match section headers
        const patterns = [
          // Match section header followed by content until next section (double newline + uppercase) or end
          new RegExp(`${escapedSectionName}:([\\s\\S]*?)(?=\\n\\n[A-Z][A-Z\\s&-]+:|$)`, 'i'),
          // Match section header followed by content until next section (single newline + uppercase)
          new RegExp(`${escapedSectionName}:([\\s\\S]*?)(?=\\n[A-Z][A-Z\\s&-]+:|$)`, 'i'),
          // Match section header followed by content until double newline or end
          new RegExp(`${escapedSectionName}:([\\s\\S]*?)(?=\\n\\n|$)`, 'i'),
        ];
        
        for (const pattern of patterns) {
          const match = notes.match(pattern);
          if (match && match[1]) {
            const lines = match[1].trim().split('\n').filter((line: string) => line.trim());
            const data: { [key: string]: string } = {};
            lines.forEach((line: string) => {
              // Handle both "- Key: Value", "• Key: Value", and "Key: Value" formats
              const lineMatch = line.match(/^[•\-]\s*(.+?):\s*(.+)$/) || line.match(/^(.+?):\s*(.+)$/);
              if (lineMatch) {
                const key = lineMatch[1].trim();
                const value = lineMatch[2].trim();
                // Convert "N/A" and "None" to empty string for form fields
                data[key] = (value === 'N/A' || value === 'None' || value === '') ? '' : value;
              }
            });
            if (Object.keys(data).length > 0) {
              console.log(`✅ Parsed section "${sectionName}":`, data);
              return data;
            }
          }
        }
        console.log(`⚠️ Could not parse section "${sectionName}"`);
        return null;
      };
      
      // Parse all sections with correct names
      const basicData = parseSection('BASIC LEAD DETAILS') || {};
      const contactConfirmation = parseSection('CONTACT CONFIRMATION') || {};
      const contactData = parseSection('CONTACT DETAILS') || {};
      const propertyData = parseSection('PROPERTY & REQUIREMENT') || parseSection('PROPERTY & REQUIREMENT DETAILS') || {};
      const sitePitData = parseSection('SITE READINESS - PIT') || {};
      const siteShaftData = parseSection('SITE READINESS - SHAFT') || {};
      const siteMachineRoomData = parseSection('SITE READINESS - MACHINE ROOM') || {};
      const elevatorData = parseSection('ELEVATOR PREFERENCE') || {};
      const intentData = parseSection('CLIENT INTENT & COMMERCIAL') || parseSection('CLIENT INTENT') || {};
      const actionData = parseSection('NEXT ACTION') || {};
      const salesData = parseSection('SALES OWNER') || {};
      
      // Helper to format date for datetime-local input
      const formatDateTimeLocal = (dateStr: string) => {
        if (!dateStr || dateStr === 'N/A' || dateStr.trim() === '') return '';
        try {
          // Handle ISO format (2026-01-08T15:18)
          if (dateStr.includes('T')) {
            return dateStr.substring(0, 16); // Truncate to datetime-local format (YYYY-MM-DDTHH:mm)
          }
          // Handle other date formats
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
          }
        } catch (e) {
          console.error("Error parsing date:", dateStr, e);
        }
        return '';
      };
      
      // Helper to format date for date input
      const formatDateLocal = (dateStr: string) => {
        if (!dateStr || dateStr === 'N/A' || dateStr.trim() === '') return '';
        try {
          if (dateStr.includes('T')) {
            return dateStr.substring(0, 10);
          }
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
        } catch (e) {
          console.error("Error parsing date:", dateStr, e);
        }
        return '';
      };
      
      // Convert value from actual value to lakhs for display (allow decimals)
      const valueInLakhs = lead.value ? (lead.value / 100000).toFixed(1).replace(/\.0$/, '') : "";
      
      // Store original stage to check if it's being changed to "Order Closed"
      setOriginalStage(lead.stage || "New Lead");
      
      // Map parsed data and backend fields to form state
      setLeadData({
        // Basic Lead Details - prioritize parsed data over backend fields
        name: basicData['Lead Name'] || lead.name || "",
        phone: basicData['Mobile Number'] || lead.phone || "",
        email: basicData['Email ID'] || lead.email || "",
        projectLocation: basicData['Project Location'] || lead.company || "",
        source: basicData['Lead Source'] || lead.source || "Website",
        stage: lead.stage || "New Lead", // Use stage from backend
        value: valueInLakhs,
        assignedTo: lead.assignedTo || "",
        
        // Contact Confirmation (separate section)
        contactSuccessful: contactConfirmation['Contact Successful'] || "",
        
        // Contact Details
        contactMode: contactData['Contact Mode'] || "",
        contactDateTime: formatDateTimeLocal(contactData['Date & Time'] || ""),
        spokenTo: contactData['Spoken To'] || "",
        
        // Property & Requirement
        propertyType: propertyData['Property Type'] || "",
        totalFloors: propertyData['Total Floors'] || "",
        primaryUsage: propertyData['Primary Usage'] || "",
        
        // Site Readiness - Pit
        pitAvailable: sitePitData['Pit Available'] || "",
        pitDepth: sitePitData['Pit Depth'] || "",
        
        // Site Readiness - Shaft
        shaftAvailable: siteShaftData['Shaft Available'] || "",
        shaftType: siteShaftData['Shaft Type'] || "",
        shaftSize: siteShaftData['Shaft Size'] || "",
        
        // Site Readiness - Machine Room
        machineRoomAvailable: siteMachineRoomData['Machine Room Available'] || "",
        
        // Elevator Preference
        preferredElevatorType: elevatorData['Preferred Type'] || "",
        brandExpectation: elevatorData['Brand Expectation'] || "",
        
        // Client Intent & Commercial
        interestLevel: intentData['Interest Level'] || "",
        budgetDiscussion: intentData['Budget Discussion'] || "",
        decisionTimeline: intentData['Decision Timeline'] || "",
        
        // Next Action
        nextStep: actionData['Next Step'] || "",
        expectedMeetingTimeline: actionData['Expected Timeline'] || "",
        nextFollowUpDate: formatDateLocal(actionData['Next Follow-up'] || ""),
        
        // Sales Owner
        salesExecutiveName: salesData['Sales Executive'] || lead.assignedTo || "",
        remarks: salesData['Remarks'] || "",
        
        // Backend fields
        notes: notes,
        company: lead.company || "",
      });
      
      console.log("✅ Lead data loaded:", {
        name: basicData['Lead Name'] || lead.name,
        contactSuccessful: contactConfirmation['Contact Successful'],
        contactMode: contactData['Contact Mode'],
        stage: lead.stage,
        propertyType: propertyData['Property Type'],
      });
    } catch (error) {
      console.error("Failed to load lead:", error);
      toast.error("Failed to load lead details");
      router.push("/dashboard/leads");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!leadData.name || !leadData.phone || !leadData.email || !leadData.projectLocation || !leadData.source) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!leadData.contactSuccessful) {
      toast.error("Please confirm if the lead was successfully contacted");
      return;
    }

    // Don't auto-set stage - use the selected stage from the form
    // const stage = leadData.contactSuccessful === "No" ? "New Lead" : "Lead Contacted";

    if (leadData.contactSuccessful === "Yes" && (!leadData.contactMode || !leadData.contactDateTime || !leadData.spokenTo)) {
      toast.error("Please fill in all contact details");
      return;
    }

    if (!leadData.salesExecutiveName) {
      toast.error("Please enter the Sales Executive Name");
      return;
    }

    try {
      setSaving(true);

      // Reconstruct notes in the same format as shown in the display (with proper section headers)
      const notes = `
BASIC LEAD DETAILS:
- Lead Name: ${leadData.name}
- Mobile Number: ${leadData.phone}
- Email ID: ${leadData.email}
- Project Location: ${leadData.projectLocation}
- Lead Source: ${leadData.source}

CONTACT CONFIRMATION:
- Contact Successful: ${leadData.contactSuccessful}

CONTACT DETAILS:
- Contact Mode: ${leadData.contactMode || "N/A"}
- Date & Time: ${leadData.contactDateTime || "N/A"}
- Spoken To: ${leadData.spokenTo || "N/A"}

PROPERTY & REQUIREMENT:
- Property Type: ${leadData.propertyType || "N/A"}
- Total Floors: ${leadData.totalFloors || "N/A"}
- Primary Usage: ${leadData.primaryUsage || "N/A"}

SITE READINESS - PIT:
- Pit Available: ${leadData.pitAvailable || "N/A"}
- Pit Depth: ${leadData.pitDepth || "N/A"}

SITE READINESS - SHAFT:
- Shaft Available: ${leadData.shaftAvailable || "N/A"}
- Shaft Type: ${leadData.shaftType || "N/A"}
- Shaft Size: ${leadData.shaftSize || "N/A"}

SITE READINESS - MACHINE ROOM:
- Machine Room Available: ${leadData.machineRoomAvailable || "N/A"}

ELEVATOR PREFERENCE:
- Preferred Type: ${leadData.preferredElevatorType || "N/A"}
- Brand Expectation: ${leadData.brandExpectation || "N/A"}

CLIENT INTENT & COMMERCIAL:
- Interest Level: ${leadData.interestLevel || "N/A"}
- Budget Discussion: ${leadData.budgetDiscussion || "N/A"}
- Decision Timeline: ${leadData.decisionTimeline || "N/A"}

NEXT ACTION:
- Next Step: ${leadData.nextStep || "N/A"}
- Expected Timeline: ${leadData.expectedMeetingTimeline || "N/A"}
- Next Follow-up: ${leadData.nextFollowUpDate || "N/A"}

SALES OWNER:
- Sales Executive: ${leadData.salesExecutiveName}
- Remarks: ${leadData.remarks || "N/A"}
`.trim();

      // Prepare update data - USE THE SELECTED STAGE FROM THE FORM
      const updateData: any = {
        name: leadData.name,
        company: leadData.projectLocation,
        email: leadData.email,
        phone: leadData.phone,
        source: leadData.source,
        stage: leadData.stage, // Use the stage selected in the form (editable)
        value: leadData.value ? Math.round(parseFloat(leadData.value) * 100000) : 0,
        assignedTo: leadData.salesExecutiveName,
        notes: notes,
        lastContact: leadData.contactDateTime || new Date().toISOString(),
      };

      await leadsAPI.update(leadId, updateData);
      
      // If stage is changed to "Order Closed", create a project
      if (leadData.stage === "Order Closed" && originalStage !== "Order Closed") {
        try {
          // Check if project already exists for this lead
          const existingProjects = await projectsAPI.getAll();
          const projectExists = existingProjects.some((p: any) => 
            p.quotationId === leadId || 
            p.quotationId === `LEAD-${leadId}` ||
            p.projectName?.includes(leadData.name)
          );
          
          if (!projectExists) {
            // Parse lead data from notes to extract project information (improved parsing)
            const parseSection = (sectionName: string) => {
              const escapedSectionName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const patterns = [
                new RegExp(`${escapedSectionName}:([\\s\\S]*?)(?=\\n\\n[A-Z][A-Z\\s&-]+:|$)`, 'i'),
                new RegExp(`${escapedSectionName}:([\\s\\S]*?)(?=\\n[A-Z][A-Z\\s&-]+:|$)`, 'i'),
                new RegExp(`${escapedSectionName}:([\\s\\S]*?)(?=\\n\\n|$)`, 'i'),
              ];
              
              for (const pattern of patterns) {
                const match = notes.match(pattern);
                if (match && match[1]) {
                  const lines = match[1].trim().split('\n').filter(line => line.trim());
                  const data: { [key: string]: string } = {};
                  lines.forEach(line => {
                    const lineMatch = line.match(/^[•\-]\s*(.+?):\s*(.+)$/) || line.match(/^(.+?):\s*(.+)$/);
                    if (lineMatch) {
                      const key = lineMatch[1].trim();
                      const value = lineMatch[2].trim();
                      data[key] = (value === 'N/A' || value === 'None') ? '' : value;
                    }
                  });
                  if (Object.keys(data).length > 0) return data;
                }
              }
              return null;
            };
            
            const basicDetails = parseSection('BASIC LEAD DETAILS') || {};
            const propertyRequirement = parseSection('PROPERTY & REQUIREMENT') || parseSection('PROPERTY & REQUIREMENT DETAILS') || {};
            const elevatorPreference = parseSection('ELEVATOR PREFERENCE') || {};
            const quotationSection = parseSection('QUOTATION SENT') || {};
            
            // Try to extract quotation data from notes
            const quotationMatch = notes.match(/Elevator Type Quoted:\s*(.+)/i);
            const elevatorTypeFromQuotation = quotationMatch ? quotationMatch[1].trim() : null;
            const quotationValueMatch = notes.match(/Total Quotation Value[:\s]*₹?([0-9,.]+)/i);
            const quotationValue = quotationValueMatch ? quotationValueMatch[1].replace(/,/g, '') : null;
            
            // Extract project data
            const projectName = `${leadData.name} - ${basicDetails['Project Location'] || leadData.projectLocation || 'Project'}`;
            const customerName = leadData.name;
            const location = basicDetails['Project Location'] || leadData.projectLocation || 'N/A';
            
            // Determine elevator type from multiple sources
            let elevatorType = 'Standard';
            if (elevatorTypeFromQuotation) {
              elevatorType = elevatorTypeFromQuotation;
            } else if (quotationSection['Elevator Type Quoted']) {
              elevatorType = quotationSection['Elevator Type Quoted'];
            } else if (elevatorPreference['Preferred Type']) {
              elevatorType = elevatorPreference['Preferred Type'];
            }
            
            // Create project with proper date formatting
            const today = new Date();
            const futureDate = new Date(today);
            futureDate.setDate(futureDate.getDate() + 90); // 90 days from now
            
            const startDateStr = today.toISOString().split('T')[0];
            const expectedCompletionStr = futureDate.toISOString().split('T')[0];
            
            // Create project with all lead data - starts from First Technical Visit stage
            // Note: progress will be calculated automatically by backend pre-save hook
            const projectData = {
              quotationId: leadId,
              customerName: customerName || leadData.name || "Unknown Customer",
              projectName: projectName || `${leadData.name} - Project`,
              location: location || leadData.projectLocation || "N/A",
              elevatorType: elevatorType || "Standard",
              currentStage: "First Technical Visit" as const, // Project starts from First Technical Visit
              startDate: startDateStr,
              expectedCompletion: expectedCompletionStr,
              assignedEngineer: leadData.salesExecutiveName || 'TBD',
              status: "On Track" as const,
              orderDate: startDateStr,
              orderValue: quotationValue ? parseInt(quotationValue) : (leadData.value ? Math.round(parseFloat(leadData.value) * 100000) : 0),
              salesPersonName: leadData.salesExecutiveName || '',
              customerEmail: leadData.email || '',
              customerPhone: leadData.phone || '',
              // progress will be auto-calculated by backend based on currentStage
            };
            
            console.log("✅ Creating project from lead (edit page):", {
              leadId: leadId,
              leadName: leadData.name,
              projectName: projectData.projectName,
              stage: projectData.currentStage,
            });
            
            await projectsAPI.create(projectData);
            toast.success("Lead updated successfully and project created! Project will now follow the project workflow stages.");
          } else {
            toast.success("Lead updated successfully. Project already exists for this lead.");
          }
        } catch (projectError: any) {
          console.error("Failed to create project:", projectError);
          const errorMsg = projectError?.message || projectError?.toString() || "Unknown error";
          toast.error(`Lead updated successfully, but failed to create project: ${errorMsg}. Please create it manually.`);
        }
      } else {
        toast.success("Lead updated successfully");
      }
      
      router.push("/dashboard/leads");
    } catch (error: any) {
      console.error("Failed to update lead:", error);
      toast.error(error.message || "Failed to update lead");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading lead details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard/leads")}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <IoArrowBack className="w-5 h-5" />
          <span>Back to Leads</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Lead</h1>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="max-h-[80vh] overflow-y-auto pr-2">
          <div className="space-y-6">
            {/* 1. BASIC LEAD DETAILS */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔹 1. BASIC LEAD DETAILS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lead Name *
                  </label>
                  <input
                    type="text"
                    value={leadData.name}
                    onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter lead name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={leadData.phone}
                    onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter mobile number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email ID *
                  </label>
                  <input
                    type="email"
                    value={leadData.email}
                    onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Location (State) *
                  </label>
                  <select
                    value={leadData.projectLocation}
                    onChange={(e) => setLeadData({ ...leadData, projectLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select State</option>
                    {indianStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lead Source *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {["Website", "Google Ads", "Referral", "Walk-in", "Other"].map((source) => (
                      <label key={source} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="source"
                          value={source}
                          checked={leadData.source === source}
                          onChange={(e) => setLeadData({ ...leadData, source: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{source}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stage
                  </label>
                  <select
                    value={leadData.stage}
                    onChange={(e) => setLeadData({ ...leadData, stage: e.target.value as Lead["stage"] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="New Lead">New Lead</option>
                    <option value="Lead Contacted">Lead Contacted</option>
                    <option value="Meeting Scheduled">Meeting Scheduled</option>
                    <option value="Meeting Completed">Meeting Completed</option>
                    <option value="Quotation Sent">Quotation Sent</option>
                    <option value="Manager Deliberation">Manager Deliberation</option>
                    <option value="Order Closed">Order Closed</option>
                    <option value="Order Lost">Order Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value (in Lakhs)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={leadData.value}
                    onChange={(e) => setLeadData({ ...leadData, value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter value in lakhs (e.g., 10.5)"
                  />
                </div>
              </div>
            </div>

            {/* 2. CONTACT CONFIRMATION */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔹 2. CONTACT CONFIRMATION</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Was the lead successfully contacted? *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="contactSuccessful"
                      value="Yes"
                      checked={leadData.contactSuccessful === "Yes"}
                      onChange={(e) => setLeadData({ ...leadData, contactSuccessful: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="contactSuccessful"
                      value="No"
                      checked={leadData.contactSuccessful === "No"}
                      onChange={(e) => setLeadData({ ...leadData, contactSuccessful: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 3. CONTACT DETAILS */}
            {leadData.contactSuccessful === "Yes" && (
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔹 3. CONTACT DETAILS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Mode *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Call", "WhatsApp", "Email", "Walk-in"].map((mode) => (
                        <label key={mode} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="contactMode"
                            value={mode}
                            checked={leadData.contactMode === mode}
                            onChange={(e) => setLeadData({ ...leadData, contactMode: e.target.value })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{mode}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date & Time of Contact *
                    </label>
                    <input
                      type="datetime-local"
                      value={leadData.contactDateTime}
                      onChange={(e) => setLeadData({ ...leadData, contactDateTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Spoken To *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {["Client", "Family Member", "Architect", "Builder", "Caretaker"].map((person) => (
                        <label key={person} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="spokenTo"
                            value={person}
                            checked={leadData.spokenTo === person}
                            onChange={(e) => setLeadData({ ...leadData, spokenTo: e.target.value })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{person}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. PROPERTY & REQUIREMENT DETAILS */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔹 4. PROPERTY & REQUIREMENT DETAILS</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Independent Villa", "Duplex", "Apartment", "Commercial"].map((type) => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="propertyType"
                          value={type}
                          checked={leadData.propertyType === type}
                          onChange={(e) => setLeadData({ ...leadData, propertyType: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Floors Required
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["G+1", "G+2", "G+3", "G+4"].map((floor) => (
                      <label key={floor} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="totalFloors"
                          value={floor}
                          checked={leadData.totalFloors === floor}
                          onChange={(e) => setLeadData({ ...leadData, totalFloors: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{floor}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Usage Purpose
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {["Senior Citizen", "Family Convenience", "Luxury / Premium", "Medical / Accessibility"].map((usage) => (
                      <label key={usage} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="primaryUsage"
                          value={usage}
                          checked={leadData.primaryUsage === usage}
                          onChange={(e) => setLeadData({ ...leadData, primaryUsage: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{usage}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. SITE READINESS DETAILS */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔹 5. SITE READINESS DETAILS</h3>
              
              {/* Pit Availability */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">🕳️ Pit Availability</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pit Available?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="pitAvailable"
                          value="Yes"
                          checked={leadData.pitAvailable === "Yes"}
                          onChange={(e) => setLeadData({ ...leadData, pitAvailable: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="pitAvailable"
                          value="No"
                          checked={leadData.pitAvailable === "No"}
                          onChange={(e) => setLeadData({ ...leadData, pitAvailable: e.target.value, pitDepth: "" })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {leadData.pitAvailable === "Yes" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pit Depth (if available)</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {["< 300 mm", "300–600 mm", "600–1000 mm", "Not Sure"].map((depth) => (
                          <label key={depth} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="pitDepth"
                              value={depth}
                              checked={leadData.pitDepth === depth}
                              onChange={(e) => setLeadData({ ...leadData, pitDepth: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{depth}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Shaft Availability */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">📐 Shaft Availability</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shaft Available?</label>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="shaftAvailable"
                          value="Yes"
                          checked={leadData.shaftAvailable === "Yes"}
                          onChange={(e) => setLeadData({ ...leadData, shaftAvailable: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="shaftAvailable"
                          value="No"
                          checked={leadData.shaftAvailable === "No"}
                          onChange={(e) => setLeadData({ ...leadData, shaftAvailable: e.target.value, shaftType: "", shaftSize: "" })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {leadData.shaftAvailable === "Yes" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Shaft Type</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {["Concrete", "Brick", "Steel Frame", "Not Sure"].map((type) => (
                            <label key={type} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="shaftType"
                                value={type}
                                checked={leadData.shaftType === type}
                                onChange={(e) => setLeadData({ ...leadData, shaftType: e.target.value })}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="text-sm text-gray-700">{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Approx Shaft Size (if known)
                        </label>
                        <input
                          type="text"
                          value={leadData.shaftSize}
                          onChange={(e) => setLeadData({ ...leadData, shaftSize: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="L × W in mm (e.g., 2000 × 1500)"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Machine Room Availability */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">🏗️ Machine Room Availability</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Machine Room Available?</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {["Yes", "No (MRL preferred)", "Can be constructed", "Not Sure"].map((option) => (
                      <label key={option} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="machineRoomAvailable"
                          value={option}
                          checked={leadData.machineRoomAvailable === option}
                          onChange={(e) => setLeadData({ ...leadData, machineRoomAvailable: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 6. ELEVATOR PREFERENCE */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔹 6. ELEVATOR PREFERENCE</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Elevator Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Traction (MRL)", "Hydraulic", "Pneumatic", "Not Decided"].map((type) => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="preferredElevatorType"
                          value={type}
                          checked={leadData.preferredElevatorType === type}
                          onChange={(e) => setLeadData({ ...leadData, preferredElevatorType: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Expectation
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Standard", "Premium", "Luxury"].map((brand) => (
                      <label key={brand} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="brandExpectation"
                          value={brand}
                          checked={leadData.brandExpectation === brand}
                          onChange={(e) => setLeadData({ ...leadData, brandExpectation: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 7. CLIENT INTENT & COMMERCIAL */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔹 7. CLIENT INTENT & COMMERCIAL</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interest Level
                  </label>
                  <div className="space-y-2">
                    {["High", "Medium", "Low"].map((level) => (
                      <label key={level} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="interestLevel"
                          value={level}
                          checked={leadData.interestLevel === level}
                          onChange={(e) => setLeadData({ ...leadData, interestLevel: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Discussion
                  </label>
                  <div className="space-y-2">
                    {["Not Discussed", "₹7-10L", "₹10–15L", "₹15–20L", "₹20L+"].map((budget) => (
                      <label key={budget} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="budgetDiscussion"
                          value={budget}
                          checked={leadData.budgetDiscussion === budget}
                          onChange={(e) => setLeadData({ ...leadData, budgetDiscussion: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{budget}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decision Timeline
                  </label>
                  <div className="space-y-2">
                    {["Immediate", "1–3 Months", "3–6 Months"].map((timeline) => (
                      <label key={timeline} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="decisionTimeline"
                          value={timeline}
                          checked={leadData.decisionTimeline === timeline}
                          onChange={(e) => setLeadData({ ...leadData, decisionTimeline: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{timeline}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 8. NEXT ACTION */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔹 8. NEXT ACTION</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Next Step Identified
                  </label>
                  <div className="space-y-2">
                    {["Meeting to be Scheduled", "Site Visit Required", "Send Brochure", "Follow-up Call"].map((step) => (
                      <label key={step} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="nextStep"
                          value={step}
                          checked={leadData.nextStep === step}
                          onChange={(e) => setLeadData({ ...leadData, nextStep: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{step}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Meeting / Visit Timeline
                    </label>
                    <input
                      type="text"
                      value={leadData.expectedMeetingTimeline}
                      onChange={(e) => setLeadData({ ...leadData, expectedMeetingTimeline: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Next week, Within 15 days"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Next Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={leadData.nextFollowUpDate}
                      onChange={(e) => setLeadData({ ...leadData, nextFollowUpDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 9. SALES OWNER */}
            <div className="pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔹 9. SALES OWNER</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sales Executive Name *
                  </label>
                  <input
                    type="text"
                    value={leadData.salesExecutiveName}
                    onChange={(e) => setLeadData({ ...leadData, salesExecutiveName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter sales executive name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks / Notes
                  </label>
                  <textarea
                    value={leadData.remarks}
                    onChange={(e) => setLeadData({ ...leadData, remarks: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="Additional remarks or notes..."
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <IoCheckmarkCircle className="w-5 h-5" />
                    Update Lead
                  </>
                )}
              </button>
              <button
                onClick={() => router.push("/dashboard/leads")}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

