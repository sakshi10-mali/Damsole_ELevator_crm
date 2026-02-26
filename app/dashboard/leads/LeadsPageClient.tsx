"use client";

import React, { useState, useEffect, useRef } from "react";
import { leadsAPI, projectsAPI, healthAPI, usersAPI, type Lead } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import ContactReportModal from "@/components/ContactReportModal";
import { toast } from "@/components/Toast";
import { IoAdd, IoSearch, IoDocumentText, IoCalendar, IoTime, IoClose, IoCamera, IoCloudUpload, IoPerson, IoCall, IoCheckmarkCircle, IoCheckmarkDone, IoMail, IoShieldCheckmark, IoLockClosed, IoCloseCircle, IoChevronDown, IoEye, IoDownload } from "react-icons/io5";
import AnimatedDeleteButton from "@/components/AnimatedDeleteButton";
import AnimatedEditButton from "@/components/AnimatedEditButton";
import { useRouter } from "next/navigation";
import { isAdmin, getUserPermissions, can, PERMISSIONS } from "@/lib/permissions";

const stages: Lead["stage"][] = [
  "New Lead",
  "Lead Contacted",
  "Meeting Scheduled",
  "Meeting Completed",
  "Quotation Sent",
  "Manager Deliberation",
  "Order Closed",
  "Order Lost"
];

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

// Stage icons mapping
const getStageIcon = (stage: Lead["stage"]) => {
  const iconClass = "w-5 h-5";
  switch (stage) {
    case "New Lead":
      return <IoPerson className={iconClass} />;
    case "Lead Contacted":
      return <IoCall className={iconClass} />;
    case "Meeting Scheduled":
      return <IoCalendar className={iconClass} />;
    case "Meeting Completed":
      return <IoCheckmarkCircle className={iconClass} />;
    case "Quotation Sent":
      return <IoDocumentText className={iconClass} />;
    case "Manager Deliberation":
      return <IoShieldCheckmark className={iconClass} />;
    case "Order Closed":
      return <IoLockClosed className={iconClass} />;
    case "Order Lost":
      return <IoCloseCircle className={iconClass} />;
    default:
      return <IoPerson className={iconClass} />;
  }
};

// Stage colors mapping
const getStageColor = (stage: Lead["stage"]) => {
  switch (stage) {
    case "New Lead":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "Lead Contacted":
      return "bg-cyan-100 text-cyan-700 border-cyan-300";
    case "Meeting Scheduled":
      return "bg-purple-100 text-purple-700 border-purple-300";
    case "Meeting Completed":
      return "bg-indigo-100 text-indigo-700 border-indigo-300";
    case "Quotation Sent":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "Manager Deliberation":
      return "bg-orange-100 text-orange-700 border-orange-300";
    case "Order Closed":
      return "bg-primary-100 text-primary-700 border-primary-300";
    case "Order Lost":
      return "bg-red-100 text-red-700 border-red-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

export default function LeadsPage() {
  const router = useRouter();
  const [leadList, setLeadList] = useState<Lead[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [isManagerDeliberationModalOpen, setIsManagerDeliberationModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadForContact, setLeadForContact] = useState<Lead | null>(null);
  const [leadForMeeting, setLeadForMeeting] = useState<Lead | null>(null);
  const [leadForQuotation, setLeadForQuotation] = useState<Lead | null>(null);
  const [leadForDeliberation, setLeadForDeliberation] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string; permissions: string[] } | null>(null);
  const [stageChangeError, setStageChangeError] = useState<{ [key: string]: string }>({});
  const [meetingData, setMeetingData] = useState({
    // 1. Actual Meeting Details
    meetingDuration: "",
    attendeesPresent: [] as string[],

    // 2. Site & Technical Confirmation
    pitAvailable: "",
    pitDepthConfirmed: "",
    shaftStatus: "",
    shaftType: "",
    shaftSize: "",
    machineRoom: "",

    // 3. Solution & Product Finalization
    proposedElevatorType: "",
    floorsFinalized: [] as string[],
    capacityDiscussed: "",
    specialRequirements: [] as string[],

    // 4. Commercial Discussion Summary
    budgetAlignment: "",
    approxBudgetIndicated: "",

    // 5. Client Response & Quality
    clientInterestLevel: "",
    decisionMakerIdentified: "",
    expectedDecisionTimeline: "",

    // 6. Next Action
    nextStep: "",
    expectedQuotationDate: "",
    nextFollowUpDate: "",

    // 7. Meeting Notes
    meetingNotes: "",

    // 8. Meeting Scheduled Details (New)
    nextStepIdentified: "",
    meetingDateTime: "",
    expectedTimeline: "",
    salesExecutive: "",
  });
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const [documentPreviews, setDocumentPreviews] = useState<{ [key: number]: string }>({});
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [viewerItem, setViewerItem] = useState<{ type: 'image' | 'pdf'; src: string; name: string } | null>(null);
  const [quotationData, setQuotationData] = useState({
    quotationPrepared: "",
    quotationNumber: "",
    quotationDate: "",
    quotationValidity: "",
    totalQuotationValue: "",
    paymentTerms: "",
    paymentTermsCustom: "",
    elevatorTypeQuoted: "",
    numberOfFloors: [] as string[],
    ratedCapacity: "",
    speed: "",
    scopeOfSupply: [] as string[],
    manufacturingLeadTime: "",
    installationDuration: "",
    quotationSentVia: [] as string[],
    clientAcknowledgement: "",
    clientInitialFeedback: "",
    pricingStatus: "",
    discountApplied: "",
    discountAmount: "",
    managerApprovalReference: "",
    nextStep: "",
    nextFollowUpDate: "",
    salesExecutiveName: "",
    remarks: "",
  });
  const [deliberationData, setDeliberationData] = useState({
    deliberationReasons: [] as string[],
    quotationNumber: "",
    quotationDate: "",
    quotationValue: "",
    quotationValidity: "",
    clientName: "",
    projectLocation: "",
    elevatorType: "",
    floors: [] as string[],
    capacity: "",
    pitShaftStatus: "",
    standardPrice: "",
    quotedPrice: "",
    discountRequested: "",
    discountAmount: "",
    discountPercent: "",
    expectedGrossMargin: "",
    clientFeedback: "",
    competitorPresence: "",
    competitorBrand: "",
    salesJustification: "",
    approvalStatus: "",
    approvedFinalValue: "",
    specialConditions: "",
    nextActionIfApproved: "",
    nextActionIfRejected: "",
    nextFollowUpDate: "",
  });
  const [newLead, setNewLead] = useState({
    // Basic Lead Details
    name: "",
    phone: "",
    email: "",
    projectLocation: "",
    source: "Website",


    remarks: "",

    // Legacy fields (for compatibility)
    company: "",
    value: "",
    assignedTo: "Sales Executive 1",
    notes: "",
  });

  useEffect(() => {
    // Load current user from localStorage
    const loadUser = () => {
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            setCurrentUser({ 
              name: userData.name, 
              role: userData.role,
              permissions: userData.permissions || []
            });
          } catch (e) {
            console.error("Failed to parse user data");
          }
        }
      }
    };

    loadUser();
    loadLeads();

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        loadUser();
        loadLeads(); // Reload leads when user changes
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (isAssignModalOpen) {
      const loadUsers = async () => {
        try {
          const fetchedUsers = await usersAPI.getAll();
          setUsers(fetchedUsers);
        } catch (error) {
          console.error("Failed to load users:", error);
          toast.error("Failed to load users");
        }
      };
      loadUsers();
    }
  }, [isAssignModalOpen]);

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedLeadIds.size === filteredLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map(lead => lead.id || (lead as any)._id)));
    }
  };

  const handleAssignLeads = async (userId: string, userName: string) => {
    if (selectedLeadIds.size === 0) return;

    setAssigning(true);
    try {
      const updates = Array.from(selectedLeadIds).map(async (leadId) => {
        const lead = leadList.find(l => (l.id === leadId) || ((l as any)._id === leadId));
        if (lead) {
          await leadsAPI.update(leadId, { assignedTo: userName });
        }
      });

      await Promise.all(updates);
      await loadLeads();
      setSelectedLeadIds(new Set());
      setIsAssignModalOpen(false);
      setUserSearchTerm("");
      toast.success(`Successfully assigned ${selectedLeadIds.size} lead(s) to ${userName}`);
    } catch (error) {
      console.error("Failed to assign leads:", error);
      toast.error("Failed to assign leads. Please try again.");
    } finally {
      setAssigning(false);
    }
  };

  // Validation helper functions
  const handlePhoneChange = (value: string, setState: (val: any) => void, stateObj: any, field: string) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    // Allow only up to 10 digits
    if (cleaned.length <= 10) {
      setState({ ...stateObj, [field]: cleaned });
    }
  };

  const handleTextChange = (value: string, setState: (val: any) => void, stateObj: any, field: string) => {
    // Allow only letters, spaces, and common punctuation for names
    const cleaned = value.replace(/[^a-zA-Z\s\.\-'']/g, '');
    setState({ ...stateObj, [field]: cleaned });
  };

  const validatePhone = (phone: string): boolean => {
    // Must be exactly 10 digits
    return /^\d{10}$/.test(phone);
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Lock body scroll when delete modal is open
  useEffect(() => {
    if (isDeleteModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isDeleteModalOpen]);

  // Check backend connection on mount
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const isConnected = await healthAPI.check();
        setBackendConnected(isConnected);
      } catch (error) {
        setBackendConnected(false);
      }
    };
    checkBackendConnection();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const leads = await leadsAPI.getAll();
      // Normalize MongoDB _id to id for consistency
      const normalizedLeads = leads.map((lead: any) => {
        const leadId = lead._id?.toString() || lead.id || "";
        if (!leadId) {
          console.warn("Lead missing ID:", lead);
        }
        return {
          ...lead,
          id: leadId,
          _id: lead._id, // Keep _id for reference
        };
      });
      setLeadList(normalizedLeads);
      setBackendConnected(true);
    } catch (error: any) {
      console.error("Failed to load leads:", error);
      setBackendConnected(false);

      // Show connection error if applicable
      const errorMessage = error?.message || "";
      if (errorMessage.includes("ERR_CONNECTION_REFUSED") ||
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("Cannot connect to backend")) {
        toast.error(
          "Backend server is not running. Please start it with: cd kas_backend && npm run dev",
          6000
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Define stage progression rules - Progressive unlock system
  const getAvailableStages = (currentStage: Lead["stage"]): Lead["stage"][] => {
    const stageIndex = stages.indexOf(currentStage);

    // Progressive unlock: only show current stage and next available stage(s)
    if (currentStage === "New Lead") {
      return ["New Lead", "Lead Contacted"];
    } else if (currentStage === "Lead Contacted") {
      return ["Lead Contacted", "Meeting Scheduled"];
    } else if (currentStage === "Meeting Scheduled") {
      return ["Meeting Scheduled", "Meeting Completed"];
    } else if (currentStage === "Meeting Completed") {
      return ["Meeting Completed", "Quotation Sent"];
    } else if (currentStage === "Quotation Sent") {
      return ["Quotation Sent", "Manager Deliberation"];
    } else if (currentStage === "Manager Deliberation") {
      return ["Manager Deliberation", "Order Closed", "Order Lost"];
    } else if (currentStage === "Order Closed" || currentStage === "Order Lost") {
      // Final stages - can only stay at current stage
      return [currentStage];
    }

    return [currentStage];
  };

  const handleContactReportSubmit = async (data: any) => {
    if (!leadForContact) return;

    try {
      // If contact was not successful, keep stage as New Lead but save update
      const newStage: Lead["stage"] = data.contactSuccessful === "No" ? "New Lead" : "Lead Contacted";

      const updateData: Partial<Lead> & { stage: Lead["stage"] } = {
        stage: newStage,
        contactReport: {
          contactConfirmation: {
            successful: data.contactSuccessful === "Yes"
          },
          contactDetails: {
            mode: data.contactMode,
            dateTime: data.contactDateTime,
            spokenTo: data.spokenTo
          },
          propertyDetails: {
            type: data.propertyType,
            floors: data.totalFloors,
            usage: data.primaryUsage
          },
          siteReadiness: {
            pitAvailable: data.pitAvailable,
            pitDepth: data.pitDepth,
            shaftAvailable: data.shaftAvailable,
            shaftType: data.shaftType,
            shaftSize: data.shaftSize,
            machineRoom: data.machineRoom
          },
          elevatorPreference: {
            type: data.elevatorType,
            brand: data.brandExpectation
          },
          clientIntent: {
            interestLevel: data.interestLevel,
            budget: data.budgetDiscussion,
            timeline: data.decisionTimeline
          },
          nextAction: {
            type: data.nextStep,
            meetingTime: data.expectedMeetingTimeline,
            followUpDate: data.nextFollowUpDate
          },
          salesOwner: {
            name: data.salesExecutiveName,
            remarks: data.remarks
          }
        },
        // Also update legacy fields for compatibility/display if needed
        lastContact: new Date().toISOString()
      };

      const validLeadId = leadForContact.id;
      await leadsAPI.update(validLeadId, updateData);

      // Update local state
      setLeadList(leadList.map(lead => {
        const currentId = lead.id || (lead as any)._id;
        return currentId === validLeadId ? { ...lead, ...updateData, id: validLeadId } as Lead : lead;
      }));

      toast.success(newStage === "New Lead" ? "Contact attempt recorded, stage remains New Lead" : "Lead updated to Lead Contacted!");
      setIsContactModalOpen(false);
      setLeadForContact(null);
    } catch (error) {
      console.error("Failed to submit contact report:", error);
      toast.error("Failed to submit contact report");
    }
  };

  const isStageAllowed = (leadStage: Lead["stage"], targetStage: Lead["stage"]): boolean => {
    const availableStages = getAvailableStages(leadStage);
    return availableStages.includes(targetStage);
  };

  const handleStageChange = async (leadId: string, newStage: Lead["stage"]) => {
    if (!leadId || leadId === "undefined") {
      console.error("Invalid lead ID:", leadId);
      toast.error("Invalid lead ID. Please refresh the page.");
      return;
    }

    const lead = leadList.find(l => (l.id === leadId) || (l as any)._id === leadId);
    if (!lead) {
      console.error("Lead not found with ID:", leadId);
      toast.error("Lead not found. Please refresh the page.");
      return;
    }

    // Ensure we have a valid ID to use
    const validLeadId = lead.id || (lead as any)._id;
    if (!validLeadId) {
      console.error("Lead has no valid ID:", lead);
      toast.error("Lead has no valid ID. Please refresh the page.");
      return;
    }

    // If changing to "Lead Contacted" from "New Lead", open contact report form
    if (newStage === "Lead Contacted") {
      setLeadForContact(lead);
      setIsContactModalOpen(true);
      return;
    }

    // If changing to "Lead Contacted" from "New Lead", open meeting verification form

    // If changing to "Meeting Scheduled" from "Lead Contacted", open meeting form
    if (lead.stage === "Lead Contacted" && newStage === "Meeting Scheduled") {
      setLeadForMeeting(lead);
      setIsMeetingModalOpen(true);
      return;
    }

    // If changing to "Meeting Completed" from "Meeting Scheduled", open meeting verification form
    if (lead.stage === "Meeting Scheduled" && newStage === "Meeting Completed") {
      setLeadForMeeting(lead);
      setIsMeetingModalOpen(true);
      return;
    }

    // If changing to "Quotation Sent", open quotation confirmation form
    if (newStage === "Quotation Sent") {
      setLeadForQuotation(lead);
      setIsQuotationModalOpen(true);
      return;
    }

    // If changing to "Manager Deliberation", open deliberation form
    if (newStage === "Manager Deliberation") {
      setLeadForDeliberation(lead);
      setIsManagerDeliberationModalOpen(true);
      return;
    }

    // Validate stage change
    if (!isStageAllowed(lead.stage, newStage)) {
      const errorMsg = lead.stage === "New Lead"
        ? "Please select 'Lead Contacted' to proceed"
        : `Invalid stage progression. Current stage: ${lead.stage}. You can only move to the next stage or go back one step.`;

      setStageChangeError({ [leadId]: errorMsg });
      toast.error(errorMsg);

      // Clear error after 5 seconds
      setTimeout(() => {
        setStageChangeError(prev => {
          const updated = { ...prev };
          delete updated[leadId];
          return updated;
        });
      }, 5000);
      return;
    }

    // Clear any previous error
    setStageChangeError(prev => {
      const updated = { ...prev };
      delete updated[validLeadId];
      return updated;
    });

    try {
      await leadsAPI.update(validLeadId, { stage: newStage });
      setLeadList(leadList.map(lead => {
        const currentId = lead.id || (lead as any)._id;
        return currentId === validLeadId ? { ...lead, id: validLeadId, stage: newStage } : lead;
      }));

      // If stage is changed to "Order Closed", create a project
      if (newStage === "Order Closed") {
        try {
          // Check if project already exists for this lead
          const existingProjects = await projectsAPI.getAll();
          const projectExists = existingProjects.some((p: any) => p.quotationId === validLeadId);

          if (projectExists) {
            toast.success(`Lead stage updated to ${newStage}. Project already exists for this lead.`);
            return;
          }

          // Parse lead data from notes to extract project information
          const notes = lead.notes || '';
          const parseSection = (sectionName: string) => {
            const regex = new RegExp(`${sectionName}:([\\s\\S]*?)(?=\\n\\n[A-Z]|$)`, 'i');
            const match = notes.match(regex);
            if (!match) return null;

            const lines = match[1].trim().split('\n').filter(line => line.trim());
            const data: { [key: string]: string } = {};
            lines.forEach(line => {
              const match = line.match(/^-\s*(.+?):\s*(.+)$/);
              if (match) {
                const key = match[1].trim();
                const value = match[2].trim();
                data[key] = value === 'N/A' ? '' : value;
              }
            });
            return Object.keys(data).length > 0 ? data : null;
          };

          const basicDetails = parseSection('BASIC LEAD DETAILS') || {};
          const propertyRequirement = parseSection('PROPERTY & REQUIREMENT') || {};
          const elevatorPreference = parseSection('ELEVATOR PREFERENCE') || {};

          // Try to extract quotation data from notes
          const quotationMatch = notes.match(/Elevator Type Quoted:\s*(.+)/i);
          const elevatorTypeFromQuotation = quotationMatch ? quotationMatch[1].trim() : null;

          // Extract project data - use lead data directly, fallback to parsed notes
          const projectName = `${lead.name} - ${basicDetails['Project Location'] || lead.company || 'Project'}`;
          const customerName = lead.name;
          const location = basicDetails['Project Location'] || lead.company || 'N/A';
          const elevatorType = elevatorTypeFromQuotation || elevatorPreference['Preferred Type'] || propertyRequirement['Property Type'] || 'Standard';

          // Create project with proper date formatting
          const today = new Date();
          const futureDate = new Date(today);
          futureDate.setDate(futureDate.getDate() + 90); // 90 days from now

          // Ensure dates are valid and formatted correctly
          const startDateStr = today.toISOString().split('T')[0];
          const expectedCompletionStr = futureDate.toISOString().split('T')[0];

          // Create project - starts from First Technical Visit stage
          // Note: progress will be calculated automatically by backend pre-save hook
          const projectData = {
            quotationId: validLeadId || `LEAD-${validLeadId}`, // Using lead ID as quotation ID reference
            customerName: customerName || lead.name || "Unknown Customer",
            projectName: projectName || `${lead.name} - Project`,
            location: location || lead.company || "N/A",
            elevatorType: elevatorType || "Standard",
            currentStage: "First Technical Visit" as const, // Project starts from First Technical Visit
            startDate: startDateStr,
            expectedCompletion: expectedCompletionStr,
            assignedEngineer: lead.assignedTo || 'TBD',
            status: "On Track" as const,
            // progress will be auto-calculated by backend based on currentStage
          };

          console.log("Creating project with data:", projectData);

          // Ensure all numeric fields are properly formatted
          const sanitizedProjectData = {
            ...projectData,
            // Ensure no undefined or invalid values
            quotationId: String(projectData.quotationId || validLeadId || ''),
            customerName: String(projectData.customerName || 'Unknown Customer'),
            projectName: String(projectData.projectName || `${lead.name} - Project`),
            location: String(projectData.location || 'N/A'),
            elevatorType: String(projectData.elevatorType || 'Standard'),
            assignedEngineer: String(projectData.assignedEngineer || 'TBD'),
          };

          await projectsAPI.create(sanitizedProjectData);
          toast.success(`Lead stage updated to ${newStage} and project created successfully!`);
        } catch (projectError: any) {
          console.error("Failed to create project:", projectError);
          const errorMessage = projectError?.response?.data?.error || projectError?.response?.data?.details || projectError?.message || "Unknown error";
          console.error("Project creation error details:", errorMessage);
          toast.error(`Lead stage updated to ${newStage}, but failed to create project: ${errorMessage}. Please create it manually.`);
        }
      } else {
        toast.success(`Lead stage updated to ${newStage}`);
      }
    } catch (error) {
      console.error("Failed to update lead stage:", error);
      toast.error("Failed to update lead stage. Please try again.");
    }
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/png');
        setSelfieImage(imageData);
        stopCamera();
        toast.success("Selfie captured successfully!");
      }
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newPreviews: { [key: number]: string } = {};

      files.forEach((file, fileIndex) => {
        const currentIndex = uploadedDocuments.length + fileIndex;
        // Check if file is an image
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result;
            if (result) {
              setDocumentPreviews(prev => ({
                ...prev,
                [currentIndex]: result as string
              }));
            }
          };
          reader.readAsDataURL(file);
        }
      });

      setUploadedDocuments(prev => [...prev, ...files]);
      toast.success(`${files.length} document(s) added`);
    }
  };

  const removeDocument = (index: number) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
    setDocumentPreviews(prev => {
      const newPreviews: { [key: number]: string } = {};
      Object.keys(prev).forEach(key => {
        const keyNum = parseInt(key);
        if (keyNum < index) {
          newPreviews[keyNum] = prev[keyNum];
        } else if (keyNum > index) {
          newPreviews[keyNum - 1] = prev[keyNum];
        }
      });
      return newPreviews;
    });
  };

  const handleMeetingSubmit = async () => {
    if (!leadForMeeting) return;

    // Determine the new stage based on current stage
    const isMovingToMeetingScheduled = leadForMeeting.stage === "New Lead" || leadForMeeting.stage === "Lead Contacted";
    const isMovingToMeetingCompleted = leadForMeeting.stage === "Meeting Scheduled";

    // Validation
    if (isMovingToMeetingScheduled) {
      if (!meetingData.nextStepIdentified) {
        toast.error("Please select Next Step Identified.");
        return;
      }
      if (!meetingData.meetingDateTime) {
        toast.error("Please select Meeting Date & Time.");
        return;
      }
      if (!meetingData.salesExecutive) {
        toast.error("Please enter Sales Executive Name.");
        return;
      }
    } else {
      // Validation for Meeting Completion (Existing logic)
      if (!meetingData.meetingDuration) {
        toast.error("Please select Meeting Duration.");
        return;
      }

      if (meetingData.attendeesPresent.length === 0) {
        toast.error("Please select at least one Attendee Present.");
        return;
      }

      if (!meetingData.nextStep) {
        toast.error("Please select Next Step.");
        return;
      }

      if (!meetingData.nextFollowUpDate) {
        toast.error("Please select Next Follow-up Date.");
        return;
      }
    }

    try {
      // Convert documents to base64
      const documentDataPromises = uploadedDocuments.map((file) => {
        return new Promise<{ name: string; type: string; data: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              name: file.name,
              type: file.type,
              data: e.target?.result as string
            });
          };
          reader.onerror = () => resolve({ name: file.name, type: file.type, data: '' });
          reader.readAsDataURL(file);
        });
      });

      const documentData = await Promise.all(documentDataPromises);

      // Create attachments data
      const attachmentsData = {
        selfie: selfieImage || null,
        documents: documentData.map(doc => ({
          name: doc.name,
          type: doc.type,
          data: doc.data
        }))
      };

      const attachmentsJson = JSON.stringify(attachmentsData);

      let newStage: Lead["stage"];
      let notesPrefix = "";
      let meetingNotesContent = "";

      if (isMovingToMeetingScheduled) {
        newStage = "Meeting Scheduled" as Lead["stage"];
        notesPrefix = "--- MEETING SCHEDULED ---";

        meetingNotesContent = `
MEETING SCHEDULED - DETAILS:

1. NEXT STEP IDENTIFIED:
- Action: ${meetingData.nextStepIdentified || "N/A"}

2. DATE & TIME:
- Scheduled For: ${meetingData.meetingDateTime ? new Date(meetingData.meetingDateTime).toLocaleString() : "N/A"}

3. TIMELINE & FOLLOW-UP:
- Expected Timeline: ${meetingData.expectedTimeline || "N/A"}
- Next Follow-up: ${meetingData.nextFollowUpDate || "N/A"}

4. SALES OWNER:
- Executive: ${meetingData.salesExecutive || "N/A"}
- Remarks: ${meetingData.meetingNotes || "N/A"}
        `.trim();

      } else if (isMovingToMeetingCompleted) {
        newStage = "Meeting Completed" as Lead["stage"];
        notesPrefix = "--- MEETING COMPLETED ---";

        meetingNotesContent = `
MEETING COMPLETED - DETAILS:

1. ACTUAL MEETING DETAILS:
- Meeting Duration: ${meetingData.meetingDuration}
- Attendees Present: ${meetingData.attendeesPresent.join(", ") || "N/A"}

2. SITE & TECHNICAL CONFIRMATION:
- Pit Available: ${meetingData.pitAvailable || "N/A"}
- Pit Depth Confirmed: ${meetingData.pitDepthConfirmed || "N/A"}
- Shaft Status: ${meetingData.shaftStatus || "N/A"}
- Shaft Type: ${meetingData.shaftType || "N/A"}
- Shaft Size: ${meetingData.shaftSize || "N/A"}
- Machine Room: ${meetingData.machineRoom || "N/A"}

3. SOLUTION & PRODUCT FINALIZATION:
- Proposed Elevator Type: ${meetingData.proposedElevatorType || "N/A"}
- Floors Finalized: ${meetingData.floorsFinalized.join(", ") || "N/A"}
- Capacity Discussed: ${meetingData.capacityDiscussed || "N/A"}
- Special Requirements: ${meetingData.specialRequirements.join(", ") || "N/A"}

4. COMMERCIAL DISCUSSION SUMMARY:
- Budget Alignment: ${meetingData.budgetAlignment || "N/A"}
- Approx Budget Indicated: ${meetingData.approxBudgetIndicated || "N/A"}

5. CLIENT RESPONSE & QUALITY:
- Client Interest Level: ${meetingData.clientInterestLevel || "N/A"}
- Decision Maker Identified: ${meetingData.decisionMakerIdentified || "N/A"}
- Expected Decision Timeline: ${meetingData.expectedDecisionTimeline || "N/A"}

6. NEXT ACTION:
- Next Step: ${meetingData.nextStep}
- Expected Quotation Date: ${meetingData.expectedQuotationDate || "N/A"}
- Next Follow-up Date: ${meetingData.nextFollowUpDate}

7. MEETING NOTES:
${meetingData.meetingNotes || "N/A"}
        `.trim();
      } else {
        newStage = leadForMeeting.stage; // Keep current stage
        notesPrefix = "--- MEETING UPDATED ---";
        meetingNotesContent = meetingData.meetingNotes;
      }

      const fullNote = `
${meetingNotesContent}

ATTACHMENTS:
- Selfie: ${selfieImage ? "Captured" : "Not captured"}
- Documents: ${uploadedDocuments.length} file(s) uploaded

[ATTACHMENTS_DATA]
${attachmentsJson}
[END_ATTACHMENTS_DATA]
      `.trim();

      const updatedNotes = leadForMeeting.notes
        ? `${leadForMeeting.notes}\n\n${notesPrefix}\n${fullNote}`
        : `${notesPrefix}\n${fullNote}`;

      const validLeadId = leadForMeeting.id || (leadForMeeting as any)._id;
      if (!validLeadId) {
        toast.error("Lead ID is missing. Please refresh the page.");
        return;
      }

      await leadsAPI.update(validLeadId, {
        stage: newStage,
        notes: updatedNotes
      });

      setLeadList(leadList.map(lead => {
        const currentId = lead.id || (lead as any)._id;
        return currentId === validLeadId
          ? { ...lead, id: validLeadId, stage: newStage, notes: updatedNotes }
          : lead;
      }));

      setIsMeetingModalOpen(false);
      setLeadForMeeting(null);
      setMeetingData({
        meetingDuration: "",
        attendeesPresent: [],
        pitAvailable: "",
        pitDepthConfirmed: "",
        shaftStatus: "",
        shaftType: "",
        shaftSize: "",
        machineRoom: "",
        proposedElevatorType: "",
        floorsFinalized: [],
        capacityDiscussed: "",
        specialRequirements: [],
        budgetAlignment: "",
        approxBudgetIndicated: "",
        clientInterestLevel: "",
        decisionMakerIdentified: "",
        expectedDecisionTimeline: "",
        nextStep: "",
        expectedQuotationDate: "",
        nextFollowUpDate: "",
        meetingNotes: "",
        // Reset new fields
        nextStepIdentified: "",
        meetingDateTime: "",
        expectedTimeline: "",
        salesExecutive: "",
      });
      setSelfieImage(null);
      setUploadedDocuments([]);
      setDocumentPreviews({});
      stopCamera();

      const successMessage = isMovingToMeetingScheduled
        ? "Meeting details saved successfully! Lead moved to Meeting Scheduled stage."
        : "Meeting details saved successfully! Lead moved to Meeting Completed stage.";
      toast.success(successMessage);
    } catch (error) {
      console.error("Failed to save meeting details:", error);
      toast.error("Failed to save meeting details. Please try again.");
    }
  };

  const handleQuotationSubmit = async () => {
    if (!leadForQuotation) return;

    // Validation
    if (!quotationData.quotationPrepared) {
      toast.error("Please confirm if the quotation has been prepared and sent.");
      return;
    }

    if (quotationData.quotationPrepared !== "Yes") {
      toast.error("❗ Only 'Yes' allows movement to 'Quotation Sent'. Please select 'Yes' to proceed.");
      return;
    }

    if (!quotationData.salesExecutiveName) {
      toast.error("Please enter Sales Executive Name.");
      return;
    }

    try {
      const quotationNotes = `
QUOTATION CONFIRMATION:
- Quotation Prepared & Sent: ${quotationData.quotationPrepared}

QUOTATION DETAILS:
- Quotation Number: ${quotationData.quotationNumber || "N/A"}
- Quotation Date: ${quotationData.quotationDate || "N/A"}
- Quotation Validity: ${quotationData.quotationValidity || "N/A"}
- Total Quotation Value: ₹${quotationData.totalQuotationValue || "N/A"}
- Payment Terms: ${quotationData.paymentTerms || "N/A"}${quotationData.paymentTermsCustom ? ` (${quotationData.paymentTermsCustom})` : ""}

PRODUCT & TECHNICAL SUMMARY:
- Elevator Type Quoted: ${quotationData.elevatorTypeQuoted || "N/A"}
- Number of Floors: ${quotationData.numberOfFloors.join(", ") || "N/A"}
- Rated Capacity: ${quotationData.ratedCapacity || "N/A"}
- Speed: ${quotationData.speed || "N/A"}

SCOPE OF SUPPLY:
${quotationData.scopeOfSupply.length > 0 ? quotationData.scopeOfSupply.map(item => `- ${item}`).join("\n") : "- None"}

DELIVERY & TIMELINES:
- Manufacturing Lead Time: ${quotationData.manufacturingLeadTime || "N/A"}
- Installation Duration: ${quotationData.installationDuration || "N/A"}

CLIENT COMMUNICATION:
- Quotation Sent Via: ${quotationData.quotationSentVia.join(", ") || "N/A"}
- Client Acknowledgement: ${quotationData.clientAcknowledgement || "N/A"}
- Client Initial Feedback: ${quotationData.clientInitialFeedback || "N/A"}

COMMERCIAL POSITIONING:
- Pricing Status: ${quotationData.pricingStatus || "N/A"}
- Discount Applied: ${quotationData.discountApplied || "N/A"}${quotationData.discountAmount ? ` - ₹${quotationData.discountAmount}` : ""}
- Manager Approval Reference: ${quotationData.managerApprovalReference || "N/A"}

NEXT ACTION:
- Next Step: ${quotationData.nextStep || "N/A"}
- Next Follow-up Date: ${quotationData.nextFollowUpDate || "N/A"}

SALES OWNER:
- Sales Executive: ${quotationData.salesExecutiveName}
- Remarks: ${quotationData.remarks || "N/A"}
      `.trim();

      const updatedNotes = leadForQuotation.notes
        ? `${leadForQuotation.notes}\n\n--- QUOTATION SENT ---\n${quotationNotes}`
        : quotationNotes;

      await leadsAPI.update(leadForQuotation.id, {
        stage: "Quotation Sent" as Lead["stage"],
        notes: updatedNotes
      });

      setLeadList(leadList.map(lead =>
        lead.id === leadForQuotation.id
          ? { ...lead, stage: "Quotation Sent" as Lead["stage"], notes: updatedNotes }
          : lead
      ));

      setIsQuotationModalOpen(false);
      setLeadForQuotation(null);
      setQuotationData({
        quotationPrepared: "",
        quotationNumber: "",
        quotationDate: "",
        quotationValidity: "",
        totalQuotationValue: "",
        paymentTerms: "",
        paymentTermsCustom: "",
        elevatorTypeQuoted: "",
        numberOfFloors: [],
        ratedCapacity: "",
        speed: "",
        scopeOfSupply: [],
        manufacturingLeadTime: "",
        installationDuration: "",
        quotationSentVia: [],
        clientAcknowledgement: "",
        clientInitialFeedback: "",
        pricingStatus: "",
        discountApplied: "",
        discountAmount: "",
        managerApprovalReference: "",
        nextStep: "",
        nextFollowUpDate: "",
        salesExecutiveName: "",
        remarks: "",
      });

      toast.success("Quotation details submitted successfully!");
    } catch (error) {
      console.error("Failed to submit quotation details:", error);
      toast.error("Failed to submit quotation details. Please try again.");
    }
  };

  const handleDeliberationSubmit = async () => {
    if (!leadForDeliberation) return;

    // Validation
    if (deliberationData.deliberationReasons.length === 0) {
      toast.error("Please select at least one reason for Manager Deliberation.");
      return;
    }

    if (!deliberationData.salesJustification) {
      toast.error("Please provide sales justification (mandatory).");
      return;
    }

    try {
      const deliberationNotes = `
MANAGER DELIBERATION DETAILS:

DELIBERATION TRIGGER:
- Reasons: ${deliberationData.deliberationReasons.join(", ") || "N/A"}

QUOTATION SUMMARY:
- Quotation Number: ${deliberationData.quotationNumber || "N/A"}
- Quotation Date: ${deliberationData.quotationDate || "N/A"}
- Quotation Value: ₹${deliberationData.quotationValue || "N/A"}
- Quotation Validity: ${deliberationData.quotationValidity || "N/A"} Days
- Client Name: ${deliberationData.clientName || "N/A"}
- Project Location: ${deliberationData.projectLocation || "N/A"}

TECHNICAL OVERVIEW:
- Elevator Type: ${deliberationData.elevatorType || "N/A"}
- Floors: ${deliberationData.floors.join(", ") || "N/A"}
- Capacity: ${deliberationData.capacity || "N/A"}
- Pit / Shaft / Machine Room Status: ${deliberationData.pitShaftStatus || "N/A"}

COMMERCIAL DETAILS:
- Standard Price: ₹${deliberationData.standardPrice || "N/A"}
- Quoted Price: ₹${deliberationData.quotedPrice || "N/A"}
- Discount Requested: ${deliberationData.discountRequested || "N/A"}${deliberationData.discountAmount ? ` - ₹${deliberationData.discountAmount}` : ""}${deliberationData.discountPercent ? ` / ${deliberationData.discountPercent}%` : ""}
- Expected Gross Margin: ${deliberationData.expectedGrossMargin || "N/A"}

CLIENT POSITION:
- Client Feedback: ${deliberationData.clientFeedback || "N/A"}
- Competitor Presence: ${deliberationData.competitorPresence || "N/A"}${deliberationData.competitorBrand ? ` - ${deliberationData.competitorBrand}` : ""}

SALES JUSTIFICATION:
${deliberationData.salesJustification}

MANAGER DECISION:
- Approval Status: ${deliberationData.approvalStatus || "Pending"}
- Approved Final Value: ₹${deliberationData.approvedFinalValue || "N/A"}
- Special Conditions: ${deliberationData.specialConditions || "N/A"}

NEXT ACTION:
- If Approved: ${deliberationData.nextActionIfApproved || "N/A"}
- If Rejected: ${deliberationData.nextActionIfRejected || "N/A"}
- Next Follow-up Date: ${deliberationData.nextFollowUpDate || "N/A"}
      `.trim();

      const updatedNotes = leadForDeliberation.notes
        ? `${leadForDeliberation.notes}\n\n--- MANAGER DELIBERATION ---\n${deliberationNotes}`
        : deliberationNotes;

      await leadsAPI.update(leadForDeliberation.id, {
        stage: "Manager Deliberation" as Lead["stage"],
        notes: updatedNotes
      });

      setLeadList(leadList.map(lead =>
        lead.id === leadForDeliberation.id
          ? { ...lead, stage: "Manager Deliberation" as Lead["stage"], notes: updatedNotes }
          : lead
      ));

      setIsManagerDeliberationModalOpen(false);
      setLeadForDeliberation(null);
      setDeliberationData({
        deliberationReasons: [],
        quotationNumber: "",
        quotationDate: "",
        quotationValue: "",
        quotationValidity: "",
        clientName: "",
        projectLocation: "",
        elevatorType: "",
        floors: [],
        capacity: "",
        pitShaftStatus: "",
        standardPrice: "",
        quotedPrice: "",
        discountRequested: "",
        discountAmount: "",
        discountPercent: "",
        expectedGrossMargin: "",
        clientFeedback: "",
        competitorPresence: "",
        competitorBrand: "",
        salesJustification: "",
        approvalStatus: "",
        approvedFinalValue: "",
        specialConditions: "",
        nextActionIfApproved: "",
        nextActionIfRejected: "",
        nextFollowUpDate: "",
      });

      toast.success("Manager deliberation details submitted successfully!");
    } catch (error) {
      console.error("Failed to submit deliberation details:", error);
      toast.error("Failed to submit deliberation details. Please try again.");
    }
  };

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    const leadId = (lead as any)._id?.toString() || lead.id;
    router.push(`/dashboard/leads/edit/${leadId}`);
  };

  const handleDeleteClick = (lead: Lead) => {
    setLeadToDelete(lead);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;

    try {
      await leadsAPI.delete(leadToDelete.id);
      setLeadList(leadList.filter(lead => lead.id !== leadToDelete.id));
      toast.success("Lead deleted successfully");
      setIsDeleteModalOpen(false);
      setLeadToDelete(null);
    } catch (error) {
      console.error("Failed to delete lead:", error);
      toast.error("Failed to delete lead. Please try again.");
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedLeadIds.size === 0) return;

    const count = selectedLeadIds.size;
    setDeleting(true);
    try {
      const deletePromises = Array.from(selectedLeadIds).map(async (leadId) => {
        await leadsAPI.delete(leadId);
      });

      await Promise.all(deletePromises);
      await loadLeads();
      setSelectedLeadIds(new Set());
      setIsBulkDeleteModalOpen(false);
      toast.success(`Successfully deleted ${count} lead(s)`);
    } catch (error) {
      console.error("Failed to delete leads:", error);
      toast.error("Failed to delete some leads. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedLead || !newNote.trim()) return;

    try {
      const updatedNotes = selectedLead.notes
        ? `${selectedLead.notes}\n\n[${new Date().toLocaleString()}] ${newNote}`
        : `[${new Date().toLocaleString()}] ${newNote}`;

      await leadsAPI.update(selectedLead.id, { notes: updatedNotes });
      setLeadList(leadList.map(lead =>
        lead.id === selectedLead.id ? { ...lead, notes: updatedNotes } : lead
      ));
      setSelectedLead({ ...selectedLead, notes: updatedNotes });
      setNewNote("");
    } catch (error) {
      console.error("Failed to add note:", error);
      toast.error("Failed to add note. Please try again.");
    }
  };

  const handleAddLead = async () => {
    // Validation
    if (!newLead.name || !newLead.phone || !newLead.email || !newLead.projectLocation || !newLead.source) {
      toast.error("Please fill in all required basic lead details.");
      return;
    }

    // Validate phone number - must be exactly 10 digits
    if (!validatePhone(newLead.phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }

    // Validate name - should not contain numbers
    // Validate name - should not contain numbers
    if (/\d/.test(newLead.name)) {
      toast.error("Name should only contain letters and spaces.");
      return;
    }

    try {
      const leadData = {
        name: newLead.name,
        company: newLead.projectLocation, // Using project location as company for now
        email: newLead.email,
        phone: newLead.phone,
        source: newLead.source,
        stage: "New Lead" as Lead["stage"],
        value: 0,
        assignedTo: newLead.assignedTo,
        notes: newLead.remarks,
      };

      const createdLead = await leadsAPI.create(leadData);
      setLeadList([...leadList, createdLead]);
      setIsModalOpen(false);
      toast.success("Lead added successfully!");

      // Reset form and clear uploads
      setSelfieImage(null);
      setUploadedDocuments([]);
      setDocumentPreviews({});
      setNewLead({
        name: "",
        phone: "",
        email: "",
        projectLocation: "",
        source: "Website",
        remarks: "",
        company: "",
        value: "",
        assignedTo: "Sales Executive 1",
        notes: "",
      });
    } catch (error: any) {
      console.error("Failed to create lead:", error);

      // Check for connection errors
      const errorMessage = error?.message || "";
      if (errorMessage.includes("ERR_CONNECTION_REFUSED") ||
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("Cannot connect to backend")) {
        toast.error(
          "Cannot connect to backend server. Please ensure:\n" +
          "1. Backend server is running (cd kas_backend && npm run dev)\n" +
          "2. Backend is accessible at http://localhost:5000",
          8000
        );
      } else if (errorMessage.includes("API Error")) {
        toast.error(`API Error: ${errorMessage}`);
      } else {
        toast.error(errorMessage || "Failed to create lead. Please try again.");
      }
    }
  };

  const handleImportExcel = async (file: File) => {
    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // Dynamically import xlsx only when needed (inside the callback)
          const XLSXModule = await import("xlsx");
          // xlsx exports as a namespace, access it directly
          const XLSX = XLSXModule;
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          if (jsonData.length === 0) {
            toast.error("Excel file is empty or invalid format.");
            setIsImporting(false);
            return;
          }

          let successCount = 0;
          let errorCount = 0;
          const errors: string[] = [];

          for (const row of jsonData as any[]) {
            try {
              // Map Excel columns to lead data - try multiple column name variations
              const name = (row['Name'] || row['name'] || row['Name / Company'] || row['Lead Name'] || row['Customer Name'] || '').toString().trim();
              const company = (row['Company'] || row['company'] || row['Name / Company'] || row['Organization'] || '').toString().trim();
              
              // Try multiple email column variations
              let email = (row['Email'] || row['email'] || row['Email ID'] || row['E-mail'] || row['e-mail'] || row['Contact Email'] || '').toString().trim();
              
              // Try multiple phone column variations
              let phone = (row['Phone'] || row['phone'] || row['Phone Number'] || row['Mobile'] || row['mobile'] || row['Contact Number'] || row['Contact'] || '').toString().trim().replace(/\D/g, '');
              
              const source = (row['Source'] || row['source'] || 'Website').toString().trim();
              const stage = (row['Stage'] || row['stage'] || 'New Lead').toString().trim();
              const value = parseFloat(row['Value'] || row['value'] || row['Lead Value'] || 0) || 0;

              // Validation
              if (!name) {
                errors.push(`Row ${successCount + errorCount + 1}: Name is required`);
                errorCount++;
                continue;
              }

              if (!phone || phone.length !== 10) {
                errors.push(`Row ${successCount + errorCount + 1}: Valid 10-digit phone number is required`);
                errorCount++;
                continue;
              }

              // Make email optional - generate default if missing
              if (!email || !email.includes('@')) {
                // Generate a default email if missing
                const sanitizedName = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
                email = `${sanitizedName}@imported.lead`;
              }

              // Assign imported leads based on user role
              // If admin imports, keep leads unassigned so admin can assign them later
              // If non-admin imports, assign to current user so they can see their imported data
              let assignedTo: string;
              if (isAdmin()) {
                // Admin imports - keep unassigned so admin can assign to someone later
                assignedTo = 'Sales Executive 1'; // Default unassigned value
              } else {
                // Non-admin imports - assign to current user
                assignedTo = currentUser?.name || 'Sales Executive 1';
              }

              const leadData = {
                name,
                company: company || name,
                email,
                phone,
                source: source || 'Website',
                stage: (stage || 'New Lead') as Lead["stage"],
                value: value * 100000, // Convert Lakhs to actual value
                assignedTo: assignedTo,
                notes: '',
              };

              await leadsAPI.create(leadData);
              successCount++;
            } catch (error: any) {
              errorCount++;
              errors.push(`Row ${successCount + errorCount}: ${error.message || 'Failed to import'}`);
            }
          }

          if (successCount > 0) {
            toast.success(`Successfully imported ${successCount} lead(s)`);
            await loadLeads(); // Reload leads
          }

          if (errorCount > 0) {
            toast.error(`Failed to import ${errorCount} lead(s). ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
          }

          setIsImportModalOpen(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error: any) {
          console.error("Failed to parse Excel:", error);
          toast.error("Failed to parse Excel file. Please check the format.");
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      console.error("Failed to import Excel:", error);
      toast.error("Failed to import Excel file. Please try again.");
      setIsImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        handleImportExcel(file);
      } else {
        toast.error("Please select a valid Excel file (.xlsx or .xls)");
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const filteredLeads = leadList.filter(lead => {
    // Admin sees all leads (including all imported leads with assigned person's name)
    const userIsAdmin = isAdmin();
    if (userIsAdmin) {
      // Admin can see all leads regardless of who imported or assigned them
      // Search filter for admin
      const matchesSearch = !searchTerm ||
        lead.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.stage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    }

    // Check if user has permission to assign leads (leads:edit or leads:create)
    const userPermissions = currentUser?.permissions || [];
    const canAssignLeads = can(PERMISSIONS.LEADS_EDIT, userPermissions) || 
                          can(PERMISSIONS.LEADS_CREATE, userPermissions);

    // If user has assign permission, show only unassigned leads OR leads assigned to them
    if (canAssignLeads && currentUser) {
      // Show unassigned leads (empty or default) OR leads assigned to current user
      const isUnassigned = !lead.assignedTo || 
                          lead.assignedTo === "" || 
                          lead.assignedTo === "Sales Executive 1" || // Default unassigned value
                          lead.assignedTo === currentUser.name;
      
      if (!isUnassigned) {
        return false;
      }
    } else {
      // Regular users see only leads assigned to them
      if (!currentUser || lead.assignedTo !== currentUser.name) {
        return false;
      }
    }

    // Search filter
    const matchesSearch = !searchTerm ||
      lead.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.stage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading leads...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Backend Connection Warning */}
      {backendConnected === false && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Backend Server Not Connected</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Cannot connect to the backend API. Please start the backend server:</p>
                <code className="mt-1 block bg-red-100 px-2 py-1 rounded text-xs">
                  cd kas_backend && npm run dev
                </code>
                <p className="mt-2 text-xs">Or set NEXT_PUBLIC_API_URL environment variable to your backend URL.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Leads Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Track and manage all your sales leads</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-48 md:w-56">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
            />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={backendConnected === false || isImporting}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap text-sm sm:text-base ${backendConnected === false || isImporting
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-primary-600 text-white hover:bg-primary-700"
              }`}
          >
            <IoCloudUpload className="w-4 h-4 sm:w-5 sm:h-5" />
            {isImporting ? "Importing..." : "Import Excel"}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={backendConnected === false}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap text-sm sm:text-base ${backendConnected === false
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
          >
            <IoAdd className="w-4 h-4 sm:w-5 sm:h-5" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className={`mb-4 text-sm rounded-lg px-4 py-2 inline-block ${filteredLeads.length > 0
          ? "bg-primary-50 border border-primary-200 text-gray-600"
          : "bg-red-50 border border-red-200 text-red-600"
          }`}>
          {filteredLeads.length > 0 ? (
            <>
              Showing <span className="font-semibold text-green-700">{filteredLeads.length}</span> of <span className="font-semibold">{leadList.length}</span> leads
              {searchTerm && (
                <span className="ml-2">• Search: "<span className="font-semibold">{searchTerm}</span>"</span>
              )}
            </>
          ) : (
            <>
              No leads found matching "<span className="font-semibold">{searchTerm}</span>"
            </>
          )}
        </div>
      )}

      {/* Assign Lead & Delete All Buttons */}
      {selectedLeadIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            <IoPerson className="w-4 h-4 sm:w-5 sm:h-5" />
            Assign Lead ({selectedLeadIds.size})
          </button>
          <button
            onClick={() => setIsBulkDeleteModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
          >
            <IoCloseCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            Delete All ({selectedLeadIds.size})
          </button>
          <button
            onClick={() => setSelectedLeadIds(new Set())}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Selection
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">

        {/* Mobile Card View */}
        <div className="block md:hidden divide-y divide-gray-200">
          {filteredLeads.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              {leadList.length === 0 ? "No leads yet" : "No results found"}
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const leadId = lead.id || (lead as any)._id || "";
              return (
                <div key={lead.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.has(leadId)}
                      onChange={() => handleSelectLead(leadId)}
                      className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{lead.id}</span>
                        <StatusBadge status={lead.stage} />
                      </div>
                      <p className="text-base font-medium text-gray-900 truncate">{lead.name}</p>
                      <p className="text-sm text-gray-600 truncate">{lead.company}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-gray-900 truncate">{lead.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <p className="text-gray-900">{lead.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Source</p>
                    <p className="text-gray-900">{lead.source}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Value</p>
                    <p className="text-gray-900 font-semibold">₹{(lead.value / 100000).toFixed(1)}L</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                  <label className="text-xs font-medium text-gray-700 mb-1">Stage</label>
                  <div className="relative">
                    <select
                      value={lead.stage}
                      onChange={(e) => {
                        const leadId = lead.id || (lead as any)._id || "";
                        if (leadId) {
                          handleStageChange(leadId, e.target.value as Lead["stage"]);
                        } else {
                          console.error("Lead has no valid ID:", lead);
                          toast.error("Lead ID is missing. Please refresh the page.");
                        }
                      }}
                      className={`text-sm sm:text-base border-2 rounded-lg pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 focus:outline-none focus:ring-2 transition-all bg-white w-full appearance-none cursor-pointer shadow-sm hover:shadow-md active:shadow-lg touch-manipulation min-h-[44px] ${stageChangeError[lead.id || (lead as any)._id || ""]
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : `${getStageColor(lead.stage)} focus:ring-primary-500 focus:border-primary-500`
                        }`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1em 1em',
                        paddingRight: '2.5rem',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        fontSize: '16px' // Prevents zoom on iOS
                      }}
                    >
                      {getAvailableStages(lead.stage).map((stage) => (
                        <option
                          key={stage}
                          value={stage}
                          className={lead.stage === stage ? "font-semibold bg-primary-600 text-white" : ""}
                        >
                          {stage}
                        </option>
                      ))}
                    </select>
                    {/* Icon overlay */}
                    <div className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none ${getStageColor(lead.stage).split(' ')[1]}`}>
                      {getStageIcon(lead.stage)}
                    </div>
                    {stageChangeError[lead.id || (lead as any)._id || ""] && (
                      <div className="absolute top-full left-0 mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 z-10 whitespace-normal sm:whitespace-nowrap max-w-[calc(100vw-2rem)] sm:max-w-xs shadow-sm">
                        {stageChangeError[lead.id || (lead as any)._id || ""]}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(lead)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex-1"
                    >
                      <IoDocumentText className="w-4 h-4" />
                      View Details
                    </button>
                    <AnimatedEditButton
                      onClick={() => handleEditLead(lead)}
                      size="sm"
                      title="Edit Lead"
                    />
                    <AnimatedDeleteButton
                      onClick={() => handleDeleteClick(lead)}
                      size="sm"
                      title="Delete Lead"
                    />
                  </div>
                </div>
              </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.size > 0 && selectedLeadIds.size === filteredLeads.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead ID
                </th>
                <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name / Company
                </th>
                <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Assigned To
                </th>
                <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 lg:px-6 py-8 text-center text-gray-500">
                    {leadList.length === 0 ? "No leads yet" : "No results found"}
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const leadId = lead.id || (lead as any)._id || "";
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.has(leadId)}
                        onChange={() => handleSelectLead(leadId)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      <span className="truncate block max-w-[80px] sm:max-w-none">{lead.id}</span>
                    </td>
                    <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{lead.name}</div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-none">{lead.company}</div>
                    </td>
                    <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-900 truncate max-w-[120px] sm:max-w-[150px]">{lead.email}</div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-[150px]">{lead.phone}</div>
                    </td>
                    <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {lead.source}
                    </td>
                    <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
                      <div className="relative min-w-[140px] sm:min-w-[160px] lg:min-w-[180px] max-w-full">
                        <select
                          value={lead.stage}
                          onChange={(e) => {
                            const leadId = lead.id || (lead as any)._id || "";
                            if (leadId) {
                              handleStageChange(leadId, e.target.value as Lead["stage"]);
                            } else {
                              console.error("Lead has no valid ID:", lead);
                              toast.error("Lead ID is missing. Please refresh the page.");
                            }
                          }}
                          className={`text-sm sm:text-sm border-2 rounded-lg pl-9 sm:pl-10 pr-8 sm:pr-9 py-2 sm:py-2.5 focus:outline-none focus:ring-2 transition-all bg-white w-full appearance-none cursor-pointer shadow-sm hover:shadow-md active:shadow-lg touch-manipulation min-h-[40px] sm:min-h-[44px] ${stageChangeError[lead.id || (lead as any)._id || ""]
                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                            : `${getStageColor(lead.stage)} focus:ring-primary-500 focus:border-primary-500`
                            }`}
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.6rem center',
                            backgroundSize: '1em 1em',
                            paddingRight: '2.25rem',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            fontSize: '14px'
                          }}
                        >
                          {getAvailableStages(lead.stage).map((stage) => (
                            <option
                              key={stage}
                              value={stage}
                              className={lead.stage === stage ? "font-semibold bg-primary-600 text-white" : ""}
                            >
                              {stage}
                            </option>
                          ))}
                        </select>
                        {/* Icon overlay */}
                        <div className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none ${getStageColor(lead.stage).split(' ')[1]}`}>
                          {getStageIcon(lead.stage)}
                        </div>
                        {stageChangeError[lead.id || (lead as any)._id || ""] && (
                          <div className="absolute top-full left-0 mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 z-10 whitespace-normal sm:whitespace-nowrap max-w-[200px] sm:max-w-xs shadow-sm">
                            {stageChangeError[lead.id || (lead as any)._id || ""]}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-gray-900">
                      ₹{(lead.value / 100000).toFixed(1)}L
                    </td>
                    <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                      {lead.assignedTo}
                    </td>
                    <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleViewDetails(lead)}
                          className="text-primary-600 hover:text-primary-900 text-sm"
                        >
                          <span className="hidden lg:inline">View Details</span>
                          <span className="lg:hidden">View</span>
                        </button>
                        <AnimatedEditButton
                          onClick={() => handleEditLead(lead)}
                          size="sm"
                          title="Edit Lead"
                        />
                        <AnimatedDeleteButton
                          onClick={() => handleDeleteClick(lead)}
                          size="sm"
                          title="Delete Lead"
                        />
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelfieImage(null);
          setUploadedDocuments([]);
          setDocumentPreviews({});
        }}
        title="Add New Lead"
        size="lg"
      >
        <div className="max-h-[80vh] overflow-y-auto pr-2">
          <div className="space-y-6">
            {/* 1. BASIC LEAD DETAILS */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">BASIC LEAD DETAILS (Auto / Pre-filled)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lead Name *
                  </label>
                  <input
                    type="text"
                    value={newLead.name}
                    onChange={(e) => handleTextChange(e.target.value, setNewLead, newLead, 'name')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter lead name (text only)"
                    pattern="[A-Za-z\s\.\-\'']+"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={newLead.phone}
                    onChange={(e) => handlePhoneChange(e.target.value, setNewLead, newLead, 'phone')}
                    maxLength={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter 10 digit mobile number"
                    pattern="[0-9]{10}"
                  />
                  {newLead.phone && newLead.phone.length !== 10 && (
                    <p className="text-xs text-red-600 mt-1">Phone number must be exactly 10 digits</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email ID *
                  </label>
                  <input
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Location (State) *
                  </label>
                  <select
                    value={newLead.projectLocation}
                    onChange={(e) => setNewLead({ ...newLead, projectLocation: e.target.value })}
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
                          checked={newLead.source === source}
                          onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{source}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>



            {/* 9. SALES OWNER CONFIRMATION */}
            <div className="pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SALES OWNER CONFIRMATION</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sales Executive Name *
                  </label>
                  <input
                    type="text"
                    value={newLead.assignedTo}
                    onChange={(e) => setNewLead({ ...newLead, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter sales executive name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks / Notes
                  </label>
                  <textarea
                    value={newLead.remarks}
                    onChange={(e) => setNewLead({ ...newLead, remarks: e.target.value })}
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
                onClick={handleAddLead}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Add Lead
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Lead Details Modal with Notes */}
      <Modal
        isOpen={isDetailsModalOpen && selectedLead !== null}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedLead(null);
          setNewNote("");
        }}
        title={`Lead Details - ${selectedLead?.name}`}
        size="lg"
      >
        {selectedLead && (() => {
          // Parse structured data from notes
          const notes = selectedLead.notes || '';
          const parseSection = (sectionName: string) => {
            const regex = new RegExp(`${sectionName}:([\\s\\S]*?)(?=\\n\\n[A-Z]|$)`, 'i');
            const match = notes.match(regex);
            if (!match) return null;

            const lines = match[1].trim().split('\n').filter(line => line.trim());
            const data: { [key: string]: string } = {};
            lines.forEach(line => {
              const match = line.match(/^-\s*(.+?):\s*(.+)$/);
              if (match) {
                const key = match[1].trim();
                const value = match[2].trim();
                data[key] = value === 'N/A' ? '' : value;
              }
            });
            return Object.keys(data).length > 0 ? data : null;
          };

          const basicDetails = parseSection('BASIC LEAD DETAILS') || {};
          const contactConfirmation = parseSection('CONTACT CONFIRMATION') || {};
          const contactDetails = parseSection('CONTACT DETAILS') || {};
          const propertyRequirement = parseSection('PROPERTY & REQUIREMENT') || {};
          const sitePit = parseSection('SITE READINESS - PIT') || {};
          const siteShaft = parseSection('SITE READINESS - SHAFT') || {};
          const siteMachineRoom = parseSection('SITE READINESS - MACHINE ROOM') || {};
          const elevatorPreference = parseSection('ELEVATOR PREFERENCE') || {};
          const clientIntent = parseSection('CLIENT INTENT & COMMERCIAL') || {};
          const nextAction = parseSection('NEXT ACTION') || {};
          const salesOwner = parseSection('SALES OWNER') || {};

          return (
            <div className="space-y-6">
              <div className="space-y-6">
                {/* Basic Lead Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <IoPerson className="w-5 h-5 text-primary-600" />
                    Basic Lead Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Name</p>
                      <p className="font-medium text-gray-900">{selectedLead.name || basicDetails['Lead Name'] || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Mobile Number</p>
                      <p className="font-medium text-gray-900">{selectedLead.phone || basicDetails['Mobile Number'] || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email ID</p>
                      <p className="font-medium text-gray-900">{selectedLead.email || basicDetails['Email ID'] || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Project Location</p>
                      <p className="font-medium text-gray-900">{selectedLead.company || basicDetails['Project Location'] || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Lead Source</p>
                      <p className="font-medium text-gray-900">{selectedLead.source || basicDetails['Lead Source'] || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Stage</p>
                      <StatusBadge status={selectedLead.stage} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Assigned To</p>
                      <p className="font-medium text-gray-900">{selectedLead.assignedTo || salesOwner['Sales Executive'] || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Value</p>
                      <p className="font-medium text-gray-900">₹{(selectedLead.value / 100000).toFixed(1)}L</p>
                    </div>
                    {selectedLead.createdAt && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Created At</p>
                        <p className="font-medium text-gray-900">{new Date(selectedLead.createdAt).toLocaleString()}</p>
                      </div>
                    )}
                    {selectedLead.lastContact && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Last Contact</p>
                        <p className="font-medium text-gray-900">{new Date(selectedLead.lastContact).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Confirmation */}
                {contactConfirmation['Contact Successful'] && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <IoCall className="w-5 h-5 text-primary-600" />
                      Contact Confirmation
                    </h3>
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Contact Successful</p>
                        <p className="font-medium text-gray-900">{contactConfirmation['Contact Successful']}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Details */}
                {(contactDetails['Contact Mode'] || contactDetails['Date & Time'] || contactDetails['Spoken To']) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <IoCall className="w-5 h-5 text-primary-600" />
                      Contact Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                      {contactDetails['Contact Mode'] && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Contact Mode</p>
                          <p className="font-medium text-gray-900">{contactDetails['Contact Mode']}</p>
                        </div>
                      )}
                      {contactDetails['Date & Time'] && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                          <p className="font-medium text-gray-900">{contactDetails['Date & Time']}</p>
                        </div>
                      )}
                      {contactDetails['Spoken To'] && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Spoken To</p>
                          <p className="font-medium text-gray-900">{contactDetails['Spoken To']}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Property & Requirement */}
                {(propertyRequirement['Property Type'] || propertyRequirement['Total Floors'] || propertyRequirement['Primary Usage']) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <IoDocumentText className="w-5 h-5 text-primary-600" />
                      Property & Requirement
                    </h3>
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                      {propertyRequirement['Property Type'] && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Property Type</p>
                          <p className="font-medium text-gray-900">{propertyRequirement['Property Type']}</p>
                        </div>
                      )}
                      {propertyRequirement['Total Floors'] && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Total Floors</p>
                          <p className="font-medium text-gray-900">{propertyRequirement['Total Floors']}</p>
                        </div>
                      )}
                      {propertyRequirement['Primary Usage'] && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Primary Usage</p>
                          <p className="font-medium text-gray-900">{propertyRequirement['Primary Usage']}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Site Readiness */}
                {(sitePit['Pit Available'] || siteShaft['Shaft Available'] || siteMachineRoom['Machine Room Available']) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <IoCheckmarkCircle className="w-5 h-5 text-primary-600" />
                      Site Readiness
                    </h3>
                    <div className="space-y-4 pb-4 border-b">
                      {sitePit['Pit Available'] && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Pit</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Pit Available</p>
                              <p className="font-medium text-gray-900">{sitePit['Pit Available']}</p>
                            </div>
                            {sitePit['Pit Depth'] && (
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Pit Depth</p>
                                <p className="font-medium text-gray-900">{sitePit['Pit Depth']}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {siteShaft['Shaft Available'] && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Shaft</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Shaft Available</p>
                              <p className="font-medium text-gray-900">{siteShaft['Shaft Available']}</p>
                            </div>
                            {siteShaft['Shaft Type'] && (
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Shaft Type</p>
                                <p className="font-medium text-gray-900">{siteShaft['Shaft Type']}</p>
                              </div>
                            )}
                            {siteShaft['Shaft Size'] && (
                              <div>
                                <p className="text-sm text-gray-500 mb-1">Shaft Size</p>
                                <p className="font-medium text-gray-900">{siteShaft['Shaft Size']}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {siteMachineRoom['Machine Room Available'] && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Machine Room</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Machine Room Available</p>
                              <p className="font-medium text-gray-900">{siteMachineRoom['Machine Room Available']}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Elevator Preference */}
                {(elevatorPreference['Preferred Type'] || elevatorPreference['Brand Expectation']) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <IoDocumentText className="w-5 h-5 text-primary-600" />
                      Elevator Preference
                    </h3>
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                      {elevatorPreference['Preferred Type'] && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Preferred Type</p>
                          <p className="font-medium text-gray-900">{elevatorPreference['Preferred Type']}</p>
                        </div>
                      )}
                      {elevatorPreference['Brand Expectation'] && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Brand Expectation</p>
                          <p className="font-medium text-gray-900">{elevatorPreference['Brand Expectation']}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Client Intent & Commercial */}
                {(clientIntent['Interest Level'] || clientIntent['Budget Discussion'] || clientIntent['Decision Timeline']) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <IoCheckmarkDone className="w-5 h-5 text-primary-600" />
                      Client Intent & Commercial
                    </h3>
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                      {clientIntent['Interest Level'] && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Interest Level</p>
                          <p className="font-medium text-gray-900">{clientIntent['Interest Level']}</p>
                        </div>
                      )}
                      {clientIntent['Budget Discussion'] && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Budget Discussion</p>
                          <p className="font-medium text-gray-900">{clientIntent['Budget Discussion']}</p>
                        </div>
                      )}
                      {clientIntent['Decision Timeline'] && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Decision Timeline</p>
                          <p className="font-medium text-gray-900">{clientIntent['Decision Timeline']}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Next Action */}
                {(nextAction['Next Step'] || nextAction['Expected Timeline'] || nextAction['Next Follow-up']) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <IoCalendar className="w-5 h-5 text-primary-600" />
                      Next Action
                    </h3>
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                      {nextAction['Next Step'] && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Next Step</p>
                          <p className="font-medium text-gray-900">{nextAction['Next Step']}</p>
                        </div>
                      )}
                      {nextAction['Expected Timeline'] && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Expected Timeline</p>
                          <p className="font-medium text-gray-900">{nextAction['Expected Timeline']}</p>
                        </div>
                      )}
                      {nextAction['Next Follow-up'] && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Next Follow-up</p>
                          <p className="font-medium text-gray-900">{nextAction['Next Follow-up']}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sales Owner */}
                {(salesOwner['Sales Executive'] || salesOwner['Remarks']) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <IoPerson className="w-5 h-5 text-primary-600" />
                      Sales Owner
                    </h3>
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                      {salesOwner['Sales Executive'] && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Sales Executive</p>
                          <p className="font-medium text-gray-900">{salesOwner['Sales Executive']}</p>
                        </div>
                      )}
                      {salesOwner['Remarks'] && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500 mb-1">Remarks</p>
                          <p className="font-medium text-gray-900">{salesOwner['Remarks']}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Attachments Section */}
                {(() => {
                  const notes = selectedLead.notes || '';

                  // Parse attachments data from notes
                  let attachmentsData: { selfie: string | null; documents: Array<{ name: string; type: string; data: string }> } | null = null;
                  const attachmentsDataMatch = notes.match(/\[ATTACHMENTS_DATA\]\s*([\s\S]*?)\s*\[END_ATTACHMENTS_DATA\]/);

                  if (attachmentsDataMatch) {
                    try {
                      attachmentsData = JSON.parse(attachmentsDataMatch[1].trim());
                    } catch (e) {
                      console.error('Failed to parse attachments data:', e);
                    }
                  }

                  // Fallback: parse status from text
                  const attachmentsMatch = notes.match(/ATTACHMENTS:([\s\S]*?)(?=\n\n|\[ATTACHMENTS_DATA\]|$)/);
                  let selfieStatus = 'Not captured';
                  let documentsCount = 0;

                  if (attachmentsMatch) {
                    const attachmentsText = attachmentsMatch[1];
                    const selfieMatch = attachmentsText.match(/Selfie:\s*(.+)/);
                    const documentsMatch = attachmentsText.match(/Documents:\s*(\d+)/);

                    if (selfieMatch) {
                      selfieStatus = selfieMatch[1].trim();
                    }
                    if (documentsMatch) {
                      documentsCount = parseInt(documentsMatch[1]);
                    }
                  }

                  // Use parsed data if available
                  if (attachmentsData) {
                    if (attachmentsData.selfie) {
                      selfieStatus = 'Captured';
                    }
                    if (attachmentsData.documents && attachmentsData.documents.length > 0) {
                      documentsCount = attachmentsData.documents.length;
                    }
                  }

                  const hasAttachments = selfieStatus.toLowerCase().includes('captured') || documentsCount > 0;

                  return hasAttachments ? (
                    <div className="pb-4 border-b">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <IoCloudUpload className="w-5 h-5 text-primary-600" />
                        Attachments
                      </h3>
                      <div className="bg-gradient-to-br from-blue-50 to-primary-50 rounded-lg border-2 border-gray-200 p-4 shadow-sm">
                        <div className="space-y-4">
                          {/* Selfie Display */}
                          {selfieStatus.toLowerCase().includes('captured') && attachmentsData?.selfie && (
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <IoCamera className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">Selfie</p>
                                    <p className="text-xs text-gray-600">Captured during meeting</p>
                                  </div>
                                  <div className="ml-auto px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                                    ✓ Captured
                                  </div>
                                </div>
                              </div>
                              <div className="p-4">
                                <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100 group">
                                  <img
                                    src={attachmentsData.selfie}
                                    alt="Selfie"
                                    className="w-full h-auto max-h-96 object-contain mx-auto cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => setViewerItem({ type: 'image', src: attachmentsData.selfie!, name: 'Selfie' })}
                                    onError={(e) => {
                                      console.error("Selfie image failed to load");
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  <button
                                    onClick={() => setViewerItem({ type: 'image', src: attachmentsData.selfie!, name: 'Selfie' })}
                                    className="absolute top-3 right-3 p-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                    title="View Selfie"
                                  >
                                    <IoEye className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Documents Display */}
                          {documentsCount > 0 && attachmentsData?.documents && attachmentsData.documents.length > 0 && (
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <IoDocumentText className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">Documents</p>
                                    <p className="text-xs text-gray-600">{documentsCount} file(s) uploaded</p>
                                  </div>
                                  <div className="ml-auto px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                                    {documentsCount} File(s)
                                  </div>
                                </div>
                              </div>
                              <div className="p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {attachmentsData.documents.map((doc, index) => {
                                    const isPDF = doc.type === 'application/pdf' || doc.name.toLowerCase().endsWith('.pdf');
                                    const isImage = doc.type.startsWith('image/');

                                    return (
                                      <div key={index} className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 hover:shadow-md transition-shadow group">
                                        {isImage ? (
                                          <div className="relative">
                                            <img
                                              src={doc.data}
                                              alt={doc.name}
                                              className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                              onClick={() => setViewerItem({ type: 'image', src: doc.data, name: doc.name })}
                                              onError={(e) => {
                                                console.error("Document image failed to load:", doc.name);
                                                (e.target as HTMLImageElement).style.display = 'none';
                                              }}
                                            />
                                            <div className="absolute top-2 right-2 px-2 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full shadow-lg">
                                              Image
                                            </div>
                                            <button
                                              onClick={() => setViewerItem({ type: 'image', src: doc.data, name: doc.name })}
                                              className="absolute top-2 left-2 p-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                              title="View Image"
                                            >
                                              <IoEye className="w-4 h-4" />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="relative p-6 flex flex-col items-center justify-center min-h-[192px]">
                                            <IoDocumentText className="w-12 h-12 text-gray-400 mb-3" />
                                            <p className="text-sm font-medium text-gray-700 text-center break-words px-2">
                                              {doc.name}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                              {doc.type || 'File'}
                                            </p>
                                            <button
                                              onClick={() => {
                                                if (isPDF) {
                                                  setViewerItem({ type: 'pdf', src: doc.data, name: doc.name });
                                                } else {
                                                  // For non-PDF files, open in new tab
                                                  const link = document.createElement('a');
                                                  link.href = doc.data;
                                                  link.target = '_blank';
                                                  link.download = doc.name;
                                                  link.click();
                                                }
                                              }}
                                              className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2 opacity-0 group-hover:opacity-100"
                                              title={isPDF ? "View PDF" : "Download File"}
                                            >
                                              <IoEye className="w-4 h-4" />
                                              {isPDF ? 'View PDF' : 'Download'}
                                            </button>
                                          </div>
                                        )}
                                        <div className="p-3 bg-white border-t border-gray-200 flex items-center justify-between">
                                          <p className="text-xs font-medium text-gray-900 truncate flex-1" title={doc.name}>
                                            {doc.name}
                                          </p>
                                          {!isImage && (
                                            <button
                                              onClick={() => {
                                                if (isPDF) {
                                                  setViewerItem({ type: 'pdf', src: doc.data, name: doc.name });
                                                } else {
                                                  const link = document.createElement('a');
                                                  link.href = doc.data;
                                                  link.target = '_blank';
                                                  link.download = doc.name;
                                                  link.click();
                                                }
                                              }}
                                              className="ml-2 p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center"
                                              title={isPDF ? "View PDF" : "Download File"}
                                            >
                                              <IoEye className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Fallback: Show status only if data not available */}
                          {(!attachmentsData || (!attachmentsData.selfie && (!attachmentsData.documents || attachmentsData.documents.length === 0))) && (
                            <>
                              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shadow-sm">
                                    <IoCamera className="w-6 h-6 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">Selfie</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {selfieStatus.toLowerCase().includes('captured') ? 'Image captured during meeting' : 'No selfie available'}
                                    </p>
                                  </div>
                                </div>
                                <div className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-sm ${selfieStatus.toLowerCase().includes('captured')
                                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                                  : 'bg-gray-100 text-gray-600 border border-gray-300'
                                  }`}>
                                  {selfieStatus.toLowerCase().includes('captured') ? '✓ Captured' : 'Not Available'}
                                </div>
                              </div>

                              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center shadow-sm">
                                    <IoDocumentText className="w-6 h-6 text-primary-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">Documents</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {documentsCount > 0 ? `${documentsCount} file(s) uploaded during meeting` : 'No documents uploaded'}
                                    </p>
                                  </div>
                                </div>
                                <div className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-sm ${documentsCount > 0
                                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                                  : 'bg-gray-100 text-gray-600 border border-gray-300'
                                  }`}>
                                  {documentsCount > 0 ? `${documentsCount} File(s)` : 'None'}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Notes Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <IoDocumentText className="w-5 h-5 text-primary-600" />
                      Notes & Follow-ups
                    </h3>
                  </div>

                  {/* Existing Notes */}
                  {selectedLead.notes ? (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-4 mb-4 max-h-96 overflow-y-auto shadow-inner">
                      <div className="space-y-3">
                        {selectedLead.notes.split(/\n\n(?=\[|---)/).filter(Boolean).map((noteSection, index) => {
                          // Extract timestamp if present
                          const timestampMatch = noteSection.match(/^\[([^\]]+)\]/);
                          const timestamp = timestampMatch ? timestampMatch[1] : null;
                          let content = timestamp ? noteSection.replace(/^\[[^\]]+\]\s*/, '') : noteSection;

                          // Remove separator lines
                          content = content.replace(/^---\s*/gm, '');

                          // Split into lines for formatting
                          const lines = content.split('\n').filter(line => line.trim() || line === '');

                          return (
                            <div key={index} className="bg-white rounded-lg p-4 border-l-4 border-primary-500 shadow-sm hover:shadow-md transition-all">
                              {timestamp && (
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                                  <IoTime className="w-4 h-4 text-primary-600" />
                                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{timestamp}</span>
                                </div>
                              )}
                              <div className="text-sm text-gray-800 leading-relaxed">
                                {lines.map((line, lineIndex) => {
                                  const trimmedLine = line.trim();

                                  // Skip empty lines (but keep spacing)
                                  if (!trimmedLine) {
                                    return <div key={lineIndex} className="h-2" />;
                                  }

                                  // Format section headers (ALL CAPS with colon)
                                  if (/^[A-Z][A-Z\s&:]+:$/.test(trimmedLine)) {
                                    return (
                                      <div key={lineIndex} className="mb-2 mt-3 first:mt-0">
                                        <h4 className="font-bold text-gray-900 text-base uppercase tracking-wide">{trimmedLine}</h4>
                                      </div>
                                    );
                                  }

                                  // Format bullet points
                                  if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
                                    const bulletContent = trimmedLine.replace(/^[-•]\s*/, '');
                                    return (
                                      <div key={lineIndex} className="ml-5 mb-1.5 flex items-start gap-2">
                                        <span className="text-primary-600 font-bold mt-1 flex-shrink-0">•</span>
                                        <span className="flex-1">{bulletContent}</span>
                                      </div>
                                    );
                                  }

                                  // Format key-value pairs (with colon)
                                  if (trimmedLine.includes(':') && !trimmedLine.startsWith('http')) {
                                    const [key, ...valueParts] = trimmedLine.split(':');
                                    const value = valueParts.join(':').trim();
                                    if (key.length < 30 && value) {
                                      return (
                                        <div key={lineIndex} className="mb-1.5">
                                          <span className="font-semibold text-gray-700">{key.trim()}:</span>
                                          <span className="text-gray-800 ml-1">{value}</span>
                                        </div>
                                      );
                                    }
                                  }

                                  // Regular paragraph text
                                  return (
                                    <div key={lineIndex} className="mb-1.5 text-gray-800">
                                      {trimmedLine}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-6 mb-4 text-center">
                      <IoDocumentText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No notes yet. Add your first note below.</p>
                    </div>
                  )}

                  {/* Add New Note */}
                  <div className="space-y-3 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <IoDocumentText className="w-5 h-5 text-primary-600" />
                      <label className="block text-sm font-semibold text-gray-900">
                        Add New Note
                      </label>
                    </div>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Enter call notes, meeting notes, or follow-up updates...&#10;&#10;Tip: Use bullet points (-) for lists and clear formatting for better readability."
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none text-sm leading-relaxed"
                      rows={5}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Note will be saved with timestamp automatically
                      </p>
                      <button
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
                      >
                        <IoDocumentText className="w-4 h-4" />
                        Add Note
                      </button>
                    </div>
                  </div>
                </div>

                {/* Document Upload Section */}
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <IoDocumentText className="w-5 h-5 text-primary-600" />
                    Documents
                  </h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      id="document-upload"
                    />
                    <label
                      htmlFor="document-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <IoDocumentText className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Click to upload plans, drawings, emails & enquiry documents
                      </span>
                      <span className="text-xs text-gray-500">
                        PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                      </span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Document upload functionality will be connected to backend storage
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Meeting Verification Modal */}
      <Modal
        isOpen={isMeetingModalOpen && leadForMeeting !== null}
        onClose={() => {
          setIsMeetingModalOpen(false);
          setLeadForMeeting(null);
        }}
        title={leadForMeeting?.stage === "Meeting Scheduled" ? "Meeting Completion Report" : "Schedule Meeting"}
        size="lg"
      >
        <div className="max-h-[80vh] overflow-y-auto pr-2">
          {leadForMeeting && (leadForMeeting.stage === "New Lead" || leadForMeeting.stage === "Lead Contacted") ? (
            // --- SCHEDULING FORM (NEW) ---
            <div className="space-y-6">
              {/* 1. NEXT STEP IDENTIFIED */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Step Identified</h3>
                <div className="space-y-2">
                  {["Meeting to be Scheduled", "Site Visit Required", "Send Brochure", "Follow-up Call"].map((step) => (
                    <label key={step} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio" // Changed to radio as usually one next primary step, but could be checkbox if multiple allowed. Adhering to singular 'Next Step Identified'
                        name="nextStepIdentified"
                        value={step}
                        checked={meetingData.nextStepIdentified === step}
                        onChange={(e) => setMeetingData({ ...meetingData, nextStepIdentified: e.target.value })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{step}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 2. DATE AND TIME */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Date and Time</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={meetingData.meetingDateTime}
                    onChange={(e) => setMeetingData({ ...meetingData, meetingDateTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 3. TIMELINE & FOLLOW-UP */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline & Follow-up</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Meeting / Visit Timeline</label>
                    <input
                      type="text"
                      value={meetingData.expectedTimeline}
                      onChange={(e) => setMeetingData({ ...meetingData, expectedTimeline: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Next Week, Within 2 days..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up Date</label>
                    <input
                      type="date"
                      value={meetingData.nextFollowUpDate}
                      onChange={(e) => setMeetingData({ ...meetingData, nextFollowUpDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 4. SALES OWNER CONFIRMATION */}
              <div className="pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">SALES OWNER CONFIRMATION</h3> {/* Kept 9 as per request, likely to match other forms */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sales Executive Name *</label>
                    <input
                      type="text"
                      value={meetingData.salesExecutive}
                      onChange={(e) => setMeetingData({ ...meetingData, salesExecutive: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Notes</label>
                    <textarea
                      value={meetingData.meetingNotes} // Reusing meetingNotes for Remarks
                      onChange={(e) => setMeetingData({ ...meetingData, meetingNotes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={4}
                      placeholder="Enter remarks..."
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons for Scheduling */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleMeetingSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Schedule Meeting
                </button>
                <button
                  onClick={() => {
                    setIsMeetingModalOpen(false);
                    setLeadForMeeting(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // --- COMPLETION REPORT FORM (EXISTING) ---
            <div className="space-y-6">
              {/* 1. ACTUAL MEETING DETAILS */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actual Meeting Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Duration *</label>
                    <div className="space-y-2">
                      {["<30 mins", "30–60 mins", "60+ mins"].map((duration) => (
                        <label key={duration} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="meetingDuration"
                            value={duration}
                            checked={meetingData.meetingDuration === duration}
                            onChange={(e) => setMeetingData({ ...meetingData, meetingDuration: e.target.value })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{duration}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Attendees Present (Actual) *</label>
                    <div className="space-y-2">
                      {["Client", "Spouse / Family", "Architect", "Builder / Contractor"].map((attendee) => (
                        <label key={attendee} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={meetingData.attendeesPresent.includes(attendee)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMeetingData({ ...meetingData, attendeesPresent: [...meetingData.attendeesPresent, attendee] });
                              } else {
                                setMeetingData({ ...meetingData, attendeesPresent: meetingData.attendeesPresent.filter(a => a !== attendee) });
                              }
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{attendee}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. SITE & TECHNICAL CONFIRMATION */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Site & Technical Confirmation (Post-Meeting)</h3>

                {/* Pit Status */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Pit Status</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pit Available?</label>
                      <div className="flex gap-4">
                        {["Yes", "No", "Can Be Provided"].map((option) => (
                          <label key={option} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="pitAvailable"
                              value={option}
                              checked={meetingData.pitAvailable === option}
                              onChange={(e) => setMeetingData({ ...meetingData, pitAvailable: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {meetingData.pitAvailable && meetingData.pitAvailable !== "No" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pit Depth Confirmed:</label>
                        <div className="space-y-2">
                          {["<300 mm", "300–600 mm", "600–1000 mm"].map((depth) => (
                            <label key={depth} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name="pitDepthConfirmed"
                                value={depth}
                                checked={meetingData.pitDepthConfirmed === depth}
                                onChange={(e) => setMeetingData({ ...meetingData, pitDepthConfirmed: e.target.value })}
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

                {/* Shaft Status */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Shaft Status</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Shaft Status:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {["Existing", "Under Construction", "To Be Constructed", "Not Feasible"].map((status) => (
                          <label key={status} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="shaftStatus"
                              value={status}
                              checked={meetingData.shaftStatus === status}
                              onChange={(e) => setMeetingData({ ...meetingData, shaftStatus: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {meetingData.shaftStatus && meetingData.shaftStatus !== "Not Feasible" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Shaft Type:</label>
                          <div className="flex gap-4">
                            {["RCC", "Block", "Steel"].map((type) => (
                              <label key={type} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="shaftType"
                                  value={type}
                                  checked={meetingData.shaftType === type}
                                  onChange={(e) => setMeetingData({ ...meetingData, shaftType: e.target.value })}
                                  className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-sm text-gray-700">{type}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Approx Shaft Size (Confirmed):</label>
                          <input
                            type="text"
                            value={meetingData.shaftSize}
                            onChange={(e) => setMeetingData({ ...meetingData, shaftSize: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="L × W in mm (e.g., 2000 × 1500)"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Machine Room Status */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Machine Room Status</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Machine Room:</label>
                    <div className="space-y-2">
                      {["Available", "Not Available (MRL)", "Can Be Constructed"].map((option) => (
                        <label key={option} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="machineRoom"
                            value={option}
                            checked={meetingData.machineRoom === option}
                            onChange={(e) => setMeetingData({ ...meetingData, machineRoom: e.target.value })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. SOLUTION & PRODUCT FINALIZATION */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Solution & Product Finalization (Initial)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Proposed Elevator Type:</label>
                    <div className="space-y-2">
                      {["Traction (MRL)", "Hydraulic", "Pneumatic"].map((type) => (
                        <label key={type} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="proposedElevatorType"
                            value={type}
                            checked={meetingData.proposedElevatorType === type}
                            onChange={(e) => setMeetingData({ ...meetingData, proposedElevatorType: e.target.value })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Floors Finalized:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["G+1", "G+2", "G+3", "G+4"].map((floor) => (
                        <label key={floor} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={meetingData.floorsFinalized.includes(floor)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMeetingData({ ...meetingData, floorsFinalized: [...meetingData.floorsFinalized, floor] });
                              } else {
                                setMeetingData({ ...meetingData, floorsFinalized: meetingData.floorsFinalized.filter(f => f !== floor) });
                              }
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{floor}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Capacity Discussed:</label>
                    <div className="space-y-2">
                      {["250 kg", "300 kg", "400 kg"].map((capacity) => (
                        <label key={capacity} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="capacityDiscussed"
                            value={capacity}
                            checked={meetingData.capacityDiscussed === capacity}
                            onChange={(e) => setMeetingData({ ...meetingData, capacityDiscussed: e.target.value })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{capacity}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Special Requirements:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Senior Citizen Friendly", "Wheelchair Access", "Premium Interiors", "Noise Reduction"].map((req) => (
                        <label key={req} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={meetingData.specialRequirements.includes(req)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMeetingData({ ...meetingData, specialRequirements: [...meetingData.specialRequirements, req] });
                              } else {
                                setMeetingData({ ...meetingData, specialRequirements: meetingData.specialRequirements.filter(r => r !== req) });
                              }
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{req}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. COMMERCIAL DISCUSSION SUMMARY */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Commercial Discussion Summary</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Budget Alignment:</label>
                    <div className="space-y-2">
                      {["Within Expected Range", "Slightly Higher", "Budget Sensitive"].map((alignment) => (
                        <label key={alignment} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="budgetAlignment"
                            value={alignment}
                            checked={meetingData.budgetAlignment === alignment}
                            onChange={(e) => setMeetingData({ ...meetingData, budgetAlignment: e.target.value })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{alignment}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Approx Budget Indicated:</label>
                    <div className="space-y-2">
                      {["Not Shared", "₹10–15L", "₹15–20L", "₹20L+"].map((budget) => (
                        <label key={budget} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="approxBudgetIndicated"
                            value={budget}
                            checked={meetingData.approxBudgetIndicated === budget}
                            onChange={(e) => setMeetingData({ ...meetingData, approxBudgetIndicated: e.target.value })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{budget}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. CLIENT RESPONSE & QUALITY */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Response & Quality</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Client Interest Level:</label>
                    <div className="space-y-2">
                      {["Very High", "High", "Medium", "Low"].map((level) => (
                        <label key={level} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="clientInterestLevel"
                            value={level}
                            checked={meetingData.clientInterestLevel === level}
                            onChange={(e) => setMeetingData({ ...meetingData, clientInterestLevel: e.target.value })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Decision Maker Identified:</label>
                    <div className="flex gap-4">
                      {["Yes", "No"].map((option) => (
                        <label key={option} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="decisionMakerIdentified"
                            value={option}
                            checked={meetingData.decisionMakerIdentified === option}
                            onChange={(e) => setMeetingData({ ...meetingData, decisionMakerIdentified: e.target.value })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expected Decision Timeline:</label>
                    <div className="space-y-2">
                      {["Immediate", "1–2 Weeks", "1–3 Months"].map((timeline) => (
                        <label key={timeline} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="expectedDecisionTimeline"
                            value={timeline}
                            checked={meetingData.expectedDecisionTimeline === timeline}
                            onChange={(e) => setMeetingData({ ...meetingData, expectedDecisionTimeline: e.target.value })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{timeline}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. NEXT ACTION */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Action (Mandatory)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Next Step *</label>
                    <div className="space-y-2">
                      {["Prepare Quotation", "Revise Layout / Feasibility", "Second Meeting Required", "Follow-up Call"].map((step) => (
                        <label key={step} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="nextStep"
                            value={step}
                            checked={meetingData.nextStep === step}
                            onChange={(e) => setMeetingData({ ...meetingData, nextStep: e.target.value })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{step}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expected Quotation Date:</label>
                      <input
                        type="date"
                        value={meetingData.expectedQuotationDate}
                        onChange={(e) => setMeetingData({ ...meetingData, expectedQuotationDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up Date *</label>
                      <input
                        type="date"
                        value={meetingData.nextFollowUpDate}
                        onChange={(e) => setMeetingData({ ...meetingData, nextFollowUpDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. MEETING NOTES */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Meeting Notes</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Summary / Notes:</label>
                  <textarea
                    value={meetingData.meetingNotes}
                    onChange={(e) => setMeetingData({ ...meetingData, meetingNotes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={4}
                    placeholder="Enter meeting summary and notes..."
                  />
                </div>
              </div>

              {/* 8. TAKE SELFIE */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">TAKE SELFIE</h3>
                {!isCameraOpen && !selfieImage && (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <IoCamera className="w-5 h-5" />
                    Open Camera
                  </button>
                )}

                {isCameraOpen && (
                  <div className="space-y-3">
                    <div className="relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-lg border-2 border-gray-300"
                        style={{ maxHeight: "400px" }}
                      />
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={captureSelfie}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <IoCamera className="w-5 h-5" />
                        Capture
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {selfieImage && (
                  <div className="space-y-3">
                    <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={selfieImage}
                        alt="Selfie"
                        className="w-full rounded-lg"
                        style={{ maxHeight: "400px", objectFit: "contain", display: "block" }}
                      />
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full shadow-lg">
                          ✓ Captured
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelfieImage(null);
                        startCamera();
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Retake Selfie
                    </button>
                  </div>
                )}
              </div>

              {/* 9. UPLOAD DOCUMENTS */}
              <div className="pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">UPLOAD DOCUMENTS</h3>
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                      onChange={handleDocumentUpload}
                      className="hidden"
                      id="document-upload-meeting"
                    />
                    <label
                      htmlFor="document-upload-meeting"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <IoCloudUpload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Click to upload documents (Multiple files allowed)
                      </span>
                      <span className="text-xs text-gray-500">
                        PDF, DOC, DOCX, JPG, PNG, XLS, XLSX (Max 10MB per file)
                      </span>
                    </label>
                  </div>

                  {uploadedDocuments.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700">
                        Uploaded Documents ({uploadedDocuments.length}):
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {uploadedDocuments.map((file, index) => {
                          const isImage = file.type.startsWith('image/');
                          const preview = documentPreviews[index];

                          return (
                            <div
                              key={index}
                              className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                            >
                              {isImage && preview ? (
                                <div className="relative">
                                  <img
                                    src={preview}
                                    alt={file.name}
                                    className="w-full h-48 object-cover"
                                  />
                                  <div className="absolute top-2 right-2">
                                    <button
                                      type="button"
                                      onClick={() => removeDocument(index)}
                                      className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                                      title="Remove"
                                    >
                                      <IoClose className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <div className="p-2 bg-white border-t border-gray-200">
                                    <p className="text-xs text-gray-600 truncate font-medium">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-4">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <IoDocumentText className="w-6 h-6 text-blue-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 font-medium truncate">{file.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                        <p className="text-xs text-gray-400 mt-1">{file.type || 'Unknown type'}</p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeDocument(index)}
                                      className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Remove"
                                    >
                                      <IoClose className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons (Completion) */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleMeetingSubmit}
                  disabled={!meetingData.meetingDuration || meetingData.attendeesPresent.length === 0 || !meetingData.nextStep || !meetingData.nextFollowUpDate}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${meetingData.meetingDuration && meetingData.attendeesPresent.length > 0 && meetingData.nextStep && meetingData.nextFollowUpDate
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                    }`}
                >
                  Complete Meeting
                </button>
                <button
                  onClick={() => {
                    setIsMeetingModalOpen(false);
                    setLeadForMeeting(null);
                    stopCamera();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )} {/* End Condition */}
        </div>
      </Modal>

      {/* Quotation Confirmation Modal */}
      <Modal
        isOpen={isQuotationModalOpen && leadForQuotation !== null}
        onClose={() => {
          setIsQuotationModalOpen(false);
          setLeadForQuotation(null);
        }}
        title="Quotation Confirmation - Quotation Sent"
        size="lg"
      >
        <div className="max-h-[80vh] overflow-y-auto pr-2">
          <div className="space-y-6">
            {/* 1. QUOTATION CONFIRMATION */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔹 1. QUOTATION CONFIRMATION (MANDATORY)</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Has the quotation been prepared and sent to the client? *
                </label>
                <div className="space-y-2">
                  {["Yes", "No"].map((option) => (
                    <label key={option} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="quotationPrepared"
                        value={option}
                        checked={quotationData.quotationPrepared === option}
                        onChange={(e) => setQuotationData({ ...quotationData, quotationPrepared: e.target.value })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. QUOTATION DETAILS */}
            {quotationData.quotationPrepared === "Yes" && (
              <>
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">QUOTATION DETAILS</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Number</label>
                      <input
                        type="text"
                        value={quotationData.quotationNumber}
                        onChange={(e) => setQuotationData({ ...quotationData, quotationNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter quotation number"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Date</label>
                        <input
                          type="date"
                          value={quotationData.quotationDate}
                          onChange={(e) => setQuotationData({ ...quotationData, quotationDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Validity</label>
                        <select
                          value={quotationData.quotationValidity}
                          onChange={(e) => setQuotationData({ ...quotationData, quotationValidity: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select validity</option>
                          <option value="7 Days">7 Days</option>
                          <option value="15 Days">15 Days</option>
                          <option value="30 Days">30 Days</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Quotation Value (₹)</label>
                      <input
                        type="number"
                        value={quotationData.totalQuotationValue}
                        onChange={(e) => setQuotationData({ ...quotationData, totalQuotationValue: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter quotation value"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                      <div className="space-y-2">
                        {["Standard", "Customized"].map((term) => (
                          <label key={term} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="paymentTerms"
                              value={term}
                              checked={quotationData.paymentTerms === term}
                              onChange={(e) => setQuotationData({ ...quotationData, paymentTerms: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{term}</span>
                          </label>
                        ))}
                      </div>
                      {quotationData.paymentTerms === "Customized" && (
                        <input
                          type="text"
                          value={quotationData.paymentTermsCustom}
                          onChange={(e) => setQuotationData({ ...quotationData, paymentTermsCustom: e.target.value })}
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Specify custom payment terms"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. PRODUCT & TECHNICAL SUMMARY */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">PRODUCT & TECHNICAL SUMMARY</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Elevator Type Quoted</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Traction (MRL)", "Hydraulic", "Pneumatic"].map((type) => (
                          <label key={type} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="elevatorTypeQuoted"
                              value={type}
                              checked={quotationData.elevatorTypeQuoted === type}
                              onChange={(e) => setQuotationData({ ...quotationData, elevatorTypeQuoted: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Number of Floors</label>
                      <div className="grid grid-cols-4 gap-2">
                        {["G+1", "G+2", "G+3", "G+4"].map((floor) => (
                          <label key={floor} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={quotationData.numberOfFloors.includes(floor)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setQuotationData({ ...quotationData, numberOfFloors: [...quotationData.numberOfFloors, floor] });
                                } else {
                                  setQuotationData({ ...quotationData, numberOfFloors: quotationData.numberOfFloors.filter(f => f !== floor) });
                                }
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{floor}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rated Capacity</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["250 kg", "300 kg", "400 kg"].map((capacity) => (
                          <label key={capacity} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="ratedCapacity"
                              value={capacity}
                              checked={quotationData.ratedCapacity === capacity}
                              onChange={(e) => setQuotationData({ ...quotationData, ratedCapacity: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{capacity}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Speed (if applicable)</label>
                      <input
                        type="text"
                        value={quotationData.speed}
                        onChange={(e) => setQuotationData({ ...quotationData, speed: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter speed"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. SCOPE OF SUPPLY */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">SCOPE OF SUPPLY (CHECK ALL APPLICABLE)</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Elevator equipment supply",
                      "Installation & commissioning",
                      "Standard interiors",
                      "Custom / premium interiors",
                      "Civil interface support",
                      "Electrical interface support",
                      "Testing & handover"
                    ].map((item) => (
                      <label key={item} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={quotationData.scopeOfSupply.includes(item)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setQuotationData({ ...quotationData, scopeOfSupply: [...quotationData.scopeOfSupply, item] });
                            } else {
                              setQuotationData({ ...quotationData, scopeOfSupply: quotationData.scopeOfSupply.filter(s => s !== item) });
                            }
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 5. DELIVERY & TIMELINES */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">DELIVERY & TIMELINES</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturing / Delivery Lead Time</label>
                      <div className="space-y-2">
                        {["30–45 Days", "45–60 Days", "60–90 Days"].map((time) => (
                          <label key={time} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="manufacturingLeadTime"
                              value={time}
                              checked={quotationData.manufacturingLeadTime === time}
                              onChange={(e) => setQuotationData({ ...quotationData, manufacturingLeadTime: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{time}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Installation Duration</label>
                      <div className="space-y-2">
                        {["7–10 Days", "10–15 Days"].map((duration) => (
                          <label key={duration} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="installationDuration"
                              value={duration}
                              checked={quotationData.installationDuration === duration}
                              onChange={(e) => setQuotationData({ ...quotationData, installationDuration: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{duration}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. CLIENT COMMUNICATION DETAILS */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">CLIENT COMMUNICATION DETAILS</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quotation Sent Via</label>
                      <div className="grid grid-cols-2 gap-2">
                        {["Email", "WhatsApp"].map((method) => (
                          <label key={method} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={quotationData.quotationSentVia.includes(method)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setQuotationData({ ...quotationData, quotationSentVia: [...quotationData.quotationSentVia, method] });
                                } else {
                                  setQuotationData({ ...quotationData, quotationSentVia: quotationData.quotationSentVia.filter(m => m !== method) });
                                }
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{method}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Client Acknowledgement Received?</label>
                      <div className="flex gap-4">
                        {["Yes", "No"].map((option) => (
                          <label key={option} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="clientAcknowledgement"
                              value={option}
                              checked={quotationData.clientAcknowledgement === option}
                              onChange={(e) => setQuotationData({ ...quotationData, clientAcknowledgement: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Client Initial Feedback</label>
                      <div className="space-y-2">
                        {["Positive", "Needs Clarification", "Negotiation Expected"].map((feedback) => (
                          <label key={feedback} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="clientInitialFeedback"
                              value={feedback}
                              checked={quotationData.clientInitialFeedback === feedback}
                              onChange={(e) => setQuotationData({ ...quotationData, clientInitialFeedback: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{feedback}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7. COMMERCIAL POSITIONING */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">COMMERCIAL POSITIONING</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Status</label>
                      <div className="space-y-2">
                        {["As per discussion", "Revised after meeting", "Special approval taken"].map((status) => (
                          <label key={status} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="pricingStatus"
                              value={status}
                              checked={quotationData.pricingStatus === status}
                              onChange={(e) => setQuotationData({ ...quotationData, pricingStatus: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Discount Applied</label>
                      <div className="space-y-2">
                        {["No", "Yes"].map((option) => (
                          <label key={option} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="discountApplied"
                              value={option}
                              checked={quotationData.discountApplied === option}
                              onChange={(e) => setQuotationData({ ...quotationData, discountApplied: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                      {quotationData.discountApplied === "Yes" && (
                        <input
                          type="text"
                          value={quotationData.discountAmount}
                          onChange={(e) => setQuotationData({ ...quotationData, discountAmount: e.target.value })}
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter discount amount (₹)"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Manager Approval Reference (if any)</label>
                      <input
                        type="text"
                        value={quotationData.managerApprovalReference}
                        onChange={(e) => setQuotationData({ ...quotationData, managerApprovalReference: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter approval reference"
                      />
                    </div>
                  </div>
                </div>

                {/* 8. NEXT ACTION */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">NEXT ACTION (MANDATORY)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Next Step</label>
                      <div className="space-y-2">
                        {["Follow-up Call", "Price Discussion / Negotiation", "Manager Deliberation", "Client Approval Awaited"].map((step) => (
                          <label key={step} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="nextStep"
                              value={step}
                              checked={quotationData.nextStep === step}
                              onChange={(e) => setQuotationData({ ...quotationData, nextStep: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{step}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up Date</label>
                      <input
                        type="date"
                        value={quotationData.nextFollowUpDate}
                        onChange={(e) => setQuotationData({ ...quotationData, nextFollowUpDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 9. SALES OWNER CONFIRMATION */}
                <div className="pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">SALES OWNER CONFIRMATION</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sales Executive Name *
                      </label>
                      <input
                        type="text"
                        value={quotationData.salesExecutiveName}
                        onChange={(e) => setQuotationData({ ...quotationData, salesExecutiveName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter sales executive name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remarks / Notes
                      </label>
                      <textarea
                        value={quotationData.remarks}
                        onChange={(e) => setQuotationData({ ...quotationData, remarks: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={5}
                        placeholder="Enter remarks or notes..."
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleQuotationSubmit}
                disabled={quotationData.quotationPrepared !== "Yes"}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${quotationData.quotationPrepared === "Yes"
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
                  }`}
              >
                Submit Quotation
              </button>
              <button
                onClick={() => {
                  setIsQuotationModalOpen(false);
                  setLeadForQuotation(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Manager Deliberation Modal */}
      <Modal
        isOpen={isManagerDeliberationModalOpen && leadForDeliberation !== null}
        onClose={() => {
          setIsManagerDeliberationModalOpen(false);
          setLeadForDeliberation(null);
        }}
        title="Manager Deliberation"
        size="lg"
      >
        <div className="max-h-[80vh] overflow-y-auto pr-2">
          <div className="space-y-6">
            {/* 1. DELIBERATION TRIGGER */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">DELIBERATION TRIGGER (MANDATORY)</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Manager Deliberation *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Discount approval required",
                    "Special pricing / premium offer",
                    "Technical deviation from standard",
                    "Client negotiation requested",
                    "High-value order",
                    "Custom scope / special terms"
                  ].map((reason) => (
                    <label key={reason} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deliberationData.deliberationReasons.includes(reason)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDeliberationData({ ...deliberationData, deliberationReasons: [...deliberationData.deliberationReasons, reason] });
                          } else {
                            setDeliberationData({ ...deliberationData, deliberationReasons: deliberationData.deliberationReasons.filter(r => r !== reason) });
                          }
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. QUOTATION SUMMARY */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">QUOTATION SUMMARY (AUTO / CONFIRM)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Number</label>
                  <input
                    type="text"
                    value={deliberationData.quotationNumber}
                    onChange={(e) => setDeliberationData({ ...deliberationData, quotationNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Date</label>
                  <input
                    type="date"
                    value={deliberationData.quotationDate}
                    onChange={(e) => setDeliberationData({ ...deliberationData, quotationDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Value (₹)</label>
                  <input
                    type="number"
                    value={deliberationData.quotationValue}
                    onChange={(e) => setDeliberationData({ ...deliberationData, quotationValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Validity (Days)</label>
                  <input
                    type="number"
                    value={deliberationData.quotationValidity}
                    onChange={(e) => setDeliberationData({ ...deliberationData, quotationValidity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                  <input
                    type="text"
                    value={deliberationData.clientName}
                    onChange={(e) => setDeliberationData({ ...deliberationData, clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Location (State)</label>
                  <select
                    value={deliberationData.projectLocation}
                    onChange={(e) => setDeliberationData({ ...deliberationData, projectLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select State</option>
                    {indianStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. TECHNICAL OVERVIEW */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">TECHNICAL OVERVIEW (FOR MANAGER)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Elevator Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Traction (MRL)", "Hydraulic", "Pneumatic"].map((type) => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="elevatorType"
                          value={type}
                          checked={deliberationData.elevatorType === type}
                          onChange={(e) => setDeliberationData({ ...deliberationData, elevatorType: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Floors</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["G+1", "G+2", "G+3", "G+4"].map((floor) => (
                      <label key={floor} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={deliberationData.floors.includes(floor)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDeliberationData({ ...deliberationData, floors: [...deliberationData.floors, floor] });
                            } else {
                              setDeliberationData({ ...deliberationData, floors: deliberationData.floors.filter(f => f !== floor) });
                            }
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{floor}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["250 kg", "300 kg", "400 kg"].map((cap) => (
                      <label key={cap} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="capacity"
                          value={cap}
                          checked={deliberationData.capacity === cap}
                          onChange={(e) => setDeliberationData({ ...deliberationData, capacity: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{cap}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pit / Shaft / Machine Room Status</label>
                  <div className="space-y-2">
                    {["Standard", "Acceptable with modifications", "Risk / Special attention required"].map((status) => (
                      <label key={status} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="pitShaftStatus"
                          value={status}
                          checked={deliberationData.pitShaftStatus === status}
                          onChange={(e) => setDeliberationData({ ...deliberationData, pitShaftStatus: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. COMMERCIAL DETAILS */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">COMMERCIAL DETAILS</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Standard Price (₹)</label>
                    <input
                      type="number"
                      value={deliberationData.standardPrice}
                      onChange={(e) => setDeliberationData({ ...deliberationData, standardPrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quoted Price (₹)</label>
                    <input
                      type="number"
                      value={deliberationData.quotedPrice}
                      onChange={(e) => setDeliberationData({ ...deliberationData, quotedPrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Requested</label>
                  <div className="space-y-2">
                    {["No", "Yes"].map((option) => (
                      <label key={option} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="discountRequested"
                          value={option}
                          checked={deliberationData.discountRequested === option}
                          onChange={(e) => setDeliberationData({ ...deliberationData, discountRequested: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                  {deliberationData.discountRequested === "Yes" && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <input
                        type="text"
                        value={deliberationData.discountAmount}
                        onChange={(e) => setDeliberationData({ ...deliberationData, discountAmount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Discount Amount (₹)"
                      />
                      <input
                        type="text"
                        value={deliberationData.discountPercent}
                        onChange={(e) => setDeliberationData({ ...deliberationData, discountPercent: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Discount %"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Gross Margin</label>
                  <div className="space-y-2">
                    {["As per policy", "Below policy (justify below)"].map((margin) => (
                      <label key={margin} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="expectedGrossMargin"
                          value={margin}
                          checked={deliberationData.expectedGrossMargin === margin}
                          onChange={(e) => setDeliberationData({ ...deliberationData, expectedGrossMargin: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{margin}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. CLIENT POSITION & NEGOTIATION STATUS */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔹 5. CLIENT POSITION & NEGOTIATION STATUS</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Feedback on Quotation</label>
                  <div className="space-y-2">
                    {["Positive", "Negotiation Ongoing", "Price Sensitive", "Awaiting Response"].map((feedback) => (
                      <label key={feedback} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="clientFeedback"
                          value={feedback}
                          checked={deliberationData.clientFeedback === feedback}
                          onChange={(e) => setDeliberationData({ ...deliberationData, clientFeedback: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{feedback}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Competitor Presence</label>
                  <div className="flex gap-4">
                    {["Yes", "No"].map((option) => (
                      <label key={option} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="competitorPresence"
                          value={option}
                          checked={deliberationData.competitorPresence === option}
                          onChange={(e) => setDeliberationData({ ...deliberationData, competitorPresence: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                  {deliberationData.competitorPresence === "Yes" && (
                    <input
                      type="text"
                      value={deliberationData.competitorBrand}
                      onChange={(e) => setDeliberationData({ ...deliberationData, competitorBrand: e.target.value })}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brand (if known)"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 6. SALES JUSTIFICATION */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SALES JUSTIFICATION (MANDATORY)</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Justification for Approval / Revision *
                </label>
                <textarea
                  value={deliberationData.salesJustification}
                  onChange={(e) => setDeliberationData({ ...deliberationData, salesJustification: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={5}
                  placeholder="Why this pricing or deviation is required..."
                />
              </div>
            </div>

            {/* 7. MANAGER DECISION */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">MANAGER DECISION (MANAGER ONLY)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Approval Status</label>
                  <div className="space-y-2">
                    {["Approved as Quoted", "Approved with Revision", "Rejected"].map((status) => (
                      <label key={status} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="approvalStatus"
                          value={status}
                          checked={deliberationData.approvalStatus === status}
                          onChange={(e) => setDeliberationData({ ...deliberationData, approvalStatus: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Approved Final Value (₹)</label>
                  <input
                    type="number"
                    value={deliberationData.approvedFinalValue}
                    onChange={(e) => setDeliberationData({ ...deliberationData, approvedFinalValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter final approved value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Conditions / Remarks</label>
                  <textarea
                    value={deliberationData.specialConditions}
                    onChange={(e) => setDeliberationData({ ...deliberationData, specialConditions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="Enter special conditions or remarks..."
                  />
                </div>
              </div>
            </div>

            {/* 8. NEXT ACTION */}
            <div className="pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">NEXT ACTION (AUTO / SELECT)</h3>
              <div className="space-y-4">
                {deliberationData.approvalStatus === "Approved as Quoted" || deliberationData.approvalStatus === "Approved with Revision" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">If Approved</label>
                    <div className="space-y-2">
                      {["Share revised quotation with client", "Await client confirmation"].map((action) => (
                        <label key={action} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="nextActionIfApproved"
                            value={action}
                            checked={deliberationData.nextActionIfApproved === action}
                            onChange={(e) => setDeliberationData({ ...deliberationData, nextActionIfApproved: e.target.value })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : deliberationData.approvalStatus === "Rejected" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">If Rejected</label>
                    <div className="space-y-2">
                      {["Revise quotation", "Close as Lost"].map((action) => (
                        <label key={action} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="nextActionIfRejected"
                            value={action}
                            checked={deliberationData.nextActionIfRejected === action}
                            onChange={(e) => setDeliberationData({ ...deliberationData, nextActionIfRejected: e.target.value })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{action}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up Date</label>
                  <input
                    type="date"
                    value={deliberationData.nextFollowUpDate}
                    onChange={(e) => setDeliberationData({ ...deliberationData, nextFollowUpDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleDeliberationSubmit}
              disabled={deliberationData.deliberationReasons.length === 0 || !deliberationData.salesJustification}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${deliberationData.deliberationReasons.length > 0 && deliberationData.salesJustification
                ? "bg-primary-600 text-white hover:bg-primary-700"
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
                }`}
            >
              Submit Deliberation
            </button>
            <button
              onClick={() => {
                setIsManagerDeliberationModalOpen(false);
                setLeadForDeliberation(null);
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Quotation Confirmation Modal */}
      <Modal
        isOpen={isQuotationModalOpen && leadForQuotation !== null}
        onClose={() => {
          setIsQuotationModalOpen(false);
          setLeadForQuotation(null);
        }}
        title="Quotation Confirmation - Quotation Sent"
        size="lg"
      >
        <div className="max-h-[80vh] overflow-y-auto pr-2">
          <div className="space-y-6">
            {/* 1. QUOTATION CONFIRMATION */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">QUOTATION CONFIRMATION (MANDATORY)</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Has the quotation been prepared and sent to the client? *
                </label>
                <div className="space-y-2">
                  {["Yes", "No"].map((option) => (
                    <label key={option} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="quotationPrepared"
                        value={option}
                        checked={quotationData.quotationPrepared === option}
                        onChange={(e) => setQuotationData({ ...quotationData, quotationPrepared: e.target.value })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
                {quotationData.quotationPrepared && quotationData.quotationPrepared !== "Yes" && (
                  <p className="text-xs text-red-600 mt-2">❗ Only "Yes" allows movement to "Quotation Sent"</p>
                )}
              </div>
            </div>

            {/* 2. QUOTATION DETAILS */}
            {quotationData.quotationPrepared === "Yes" && (
              <>
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">QUOTATION DETAILS</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Number</label>
                      <input
                        type="text"
                        value={quotationData.quotationNumber}
                        onChange={(e) => setQuotationData({ ...quotationData, quotationNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter quotation number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Date</label>
                      <input
                        type="date"
                        value={quotationData.quotationDate}
                        onChange={(e) => setQuotationData({ ...quotationData, quotationDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quotation Validity</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["7 Days", "15 Days", "30 Days"].map((validity) => (
                          <label key={validity} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="quotationValidity"
                              value={validity}
                              checked={quotationData.quotationValidity === validity}
                              onChange={(e) => setQuotationData({ ...quotationData, quotationValidity: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{validity}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Quotation Value (₹)</label>
                      <input
                        type="text"
                        value={quotationData.totalQuotationValue}
                        onChange={(e) => setQuotationData({ ...quotationData, totalQuotationValue: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter total value"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="paymentTerms"
                            value="Standard"
                            checked={quotationData.paymentTerms === "Standard"}
                            onChange={(e) => setQuotationData({ ...quotationData, paymentTerms: e.target.value, paymentTermsCustom: "" })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">Standard</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="paymentTerms"
                            value="Customized"
                            checked={quotationData.paymentTerms === "Customized"}
                            onChange={(e) => setQuotationData({ ...quotationData, paymentTerms: e.target.value })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">Customized</span>
                        </label>
                        {quotationData.paymentTerms === "Customized" && (
                          <input
                            type="text"
                            value={quotationData.paymentTermsCustom}
                            onChange={(e) => setQuotationData({ ...quotationData, paymentTermsCustom: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                            placeholder="Specify custom payment terms"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. PRODUCT & TECHNICAL SUMMARY */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">PRODUCT & TECHNICAL SUMMARY</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Elevator Type Quoted</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Traction (MRL)", "Hydraulic", "Pneumatic"].map((type) => (
                          <label key={type} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="elevatorTypeQuoted"
                              value={type}
                              checked={quotationData.elevatorTypeQuoted === type}
                              onChange={(e) => setQuotationData({ ...quotationData, elevatorTypeQuoted: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Number of Floors</label>
                      <div className="grid grid-cols-4 gap-2">
                        {["G+1", "G+2", "G+3", "G+4"].map((floor) => (
                          <label key={floor} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={quotationData.numberOfFloors.includes(floor)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setQuotationData({ ...quotationData, numberOfFloors: [...quotationData.numberOfFloors, floor] });
                                } else {
                                  setQuotationData({ ...quotationData, numberOfFloors: quotationData.numberOfFloors.filter(f => f !== floor) });
                                }
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{floor}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rated Capacity</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["250 kg", "300 kg", "400 kg"].map((capacity) => (
                          <label key={capacity} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="ratedCapacity"
                              value={capacity}
                              checked={quotationData.ratedCapacity === capacity}
                              onChange={(e) => setQuotationData({ ...quotationData, ratedCapacity: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{capacity}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Speed (if applicable)</label>
                      <input
                        type="text"
                        value={quotationData.speed}
                        onChange={(e) => setQuotationData({ ...quotationData, speed: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter speed"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. SCOPE OF SUPPLY */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">SCOPE OF SUPPLY (CHECK ALL APPLICABLE)</h3>
                  <div className="space-y-2">
                    {[
                      "Elevator equipment supply",
                      "Installation & commissioning",
                      "Standard interiors",
                      "Custom / premium interiors",
                      "Civil interface support",
                      "Electrical interface support",
                      "Testing & handover"
                    ].map((item) => (
                      <label key={item} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={quotationData.scopeOfSupply.includes(item)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setQuotationData({ ...quotationData, scopeOfSupply: [...quotationData.scopeOfSupply, item] });
                            } else {
                              setQuotationData({ ...quotationData, scopeOfSupply: quotationData.scopeOfSupply.filter(s => s !== item) });
                            }
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 5. DELIVERY & TIMELINES */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">DELIVERY & TIMELINES</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturing / Delivery Lead Time</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["30–45 Days", "45–60 Days", "60–90 Days"].map((time) => (
                          <label key={time} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="manufacturingLeadTime"
                              value={time}
                              checked={quotationData.manufacturingLeadTime === time}
                              onChange={(e) => setQuotationData({ ...quotationData, manufacturingLeadTime: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{time}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Installation Duration</label>
                      <div className="grid grid-cols-2 gap-2">
                        {["7–10 Days", "10–15 Days"].map((duration) => (
                          <label key={duration} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="installationDuration"
                              value={duration}
                              checked={quotationData.installationDuration === duration}
                              onChange={(e) => setQuotationData({ ...quotationData, installationDuration: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{duration}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. CLIENT COMMUNICATION DETAILS */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">CLIENT COMMUNICATION DETAILS</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quotation Sent Via</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Email", "WhatsApp", "Both"].map((method) => (
                          <label key={method} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={quotationData.quotationSentVia.includes(method)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setQuotationData({ ...quotationData, quotationSentVia: [...quotationData.quotationSentVia, method] });
                                } else {
                                  setQuotationData({ ...quotationData, quotationSentVia: quotationData.quotationSentVia.filter(m => m !== method) });
                                }
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{method}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Client Acknowledgement Received?</label>
                      <div className="grid grid-cols-2 gap-2">
                        {["Yes", "No"].map((ack) => (
                          <label key={ack} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="clientAcknowledgement"
                              value={ack}
                              checked={quotationData.clientAcknowledgement === ack}
                              onChange={(e) => setQuotationData({ ...quotationData, clientAcknowledgement: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{ack}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Client Initial Feedback</label>
                      <div className="space-y-2">
                        {["Positive", "Needs Clarification", "Negotiation Expected"].map((feedback) => (
                          <label key={feedback} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="clientInitialFeedback"
                              value={feedback}
                              checked={quotationData.clientInitialFeedback === feedback}
                              onChange={(e) => setQuotationData({ ...quotationData, clientInitialFeedback: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{feedback}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7. COMMERCIAL POSITIONING */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">COMMERCIAL POSITIONING</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Status</label>
                      <div className="space-y-2">
                        {["As per discussion", "Revised after meeting", "Special approval taken"].map((status) => (
                          <label key={status} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="pricingStatus"
                              value={status}
                              checked={quotationData.pricingStatus === status}
                              onChange={(e) => setQuotationData({ ...quotationData, pricingStatus: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Discount Applied</label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="discountApplied"
                            value="No"
                            checked={quotationData.discountApplied === "No"}
                            onChange={(e) => setQuotationData({ ...quotationData, discountApplied: e.target.value, discountAmount: "" })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">No</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="discountApplied"
                            value="Yes"
                            checked={quotationData.discountApplied === "Yes"}
                            onChange={(e) => setQuotationData({ ...quotationData, discountApplied: e.target.value })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">Yes</span>
                        </label>
                        {quotationData.discountApplied === "Yes" && (
                          <input
                            type="text"
                            value={quotationData.discountAmount}
                            onChange={(e) => setQuotationData({ ...quotationData, discountAmount: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                            placeholder="Enter discount amount (₹)"
                          />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Manager Approval Reference (if any)</label>
                      <input
                        type="text"
                        value={quotationData.managerApprovalReference}
                        onChange={(e) => setQuotationData({ ...quotationData, managerApprovalReference: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter approval reference"
                      />
                    </div>
                  </div>
                </div>

                {/* 8. NEXT ACTION */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">NEXT ACTION (MANDATORY)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Next Step</label>
                      <div className="space-y-2">
                        {["Follow-up Call", "Price Discussion / Negotiation", "Manager Deliberation", "Client Approval Awaited"].map((step) => (
                          <label key={step} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="nextStep"
                              value={step}
                              checked={quotationData.nextStep === step}
                              onChange={(e) => setQuotationData({ ...quotationData, nextStep: e.target.value })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">{step}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up Date</label>
                      <input
                        type="date"
                        value={quotationData.nextFollowUpDate}
                        onChange={(e) => setQuotationData({ ...quotationData, nextFollowUpDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 9. SALES OWNER CONFIRMATION */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">SALES OWNER CONFIRMATION</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sales Executive Name *</label>
                      <input
                        type="text"
                        value={quotationData.salesExecutiveName}
                        onChange={(e) => setQuotationData({ ...quotationData, salesExecutiveName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter sales executive name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Notes</label>
                      <textarea
                        value={quotationData.remarks}
                        onChange={(e) => setQuotationData({ ...quotationData, remarks: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={5}
                        placeholder="Enter remarks and notes..."
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleQuotationSubmit}
                disabled={quotationData.quotationPrepared !== "Yes"}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${quotationData.quotationPrepared === "Yes"
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
                  }`}
              >
                Submit Quotation
              </button>
              <button
                onClick={() => {
                  setIsQuotationModalOpen(false);
                  setLeadForQuotation(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Manager Deliberation Modal */}
      <Modal
        isOpen={isManagerDeliberationModalOpen && leadForDeliberation !== null}
        onClose={() => {
          setIsManagerDeliberationModalOpen(false);
          setLeadForDeliberation(null);
        }}
        title="Manager Deliberation"
        size="lg"
      >
        <div className="max-h-[80vh] overflow-y-auto pr-2">
          <div className="space-y-6">
            {/* 1. DELIBERATION TRIGGER */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">DELIBERATION TRIGGER (MANDATORY)</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Manager Deliberation: *
                </label>
                <div className="space-y-2">
                  {[
                    "Discount approval required",
                    "Special pricing / premium offer",
                    "Technical deviation from standard",
                    "Client negotiation requested",
                    "High-value order",
                    "Custom scope / special terms"
                  ].map((reason) => (
                    <label key={reason} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deliberationData.deliberationReasons.includes(reason)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDeliberationData({ ...deliberationData, deliberationReasons: [...deliberationData.deliberationReasons, reason] });
                          } else {
                            setDeliberationData({ ...deliberationData, deliberationReasons: deliberationData.deliberationReasons.filter(r => r !== reason) });
                          }
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. QUOTATION SUMMARY */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">QUOTATION SUMMARY (AUTO / CONFIRM)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Number</label>
                  <input
                    type="text"
                    value={deliberationData.quotationNumber}
                    onChange={(e) => setDeliberationData({ ...deliberationData, quotationNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter quotation number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Date</label>
                  <input
                    type="date"
                    value={deliberationData.quotationDate}
                    onChange={(e) => setDeliberationData({ ...deliberationData, quotationDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Value (₹)</label>
                  <input
                    type="text"
                    value={deliberationData.quotationValue}
                    onChange={(e) => setDeliberationData({ ...deliberationData, quotationValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter quotation value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Validity (Days)</label>
                  <input
                    type="text"
                    value={deliberationData.quotationValidity}
                    onChange={(e) => setDeliberationData({ ...deliberationData, quotationValidity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter validity in days"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                  <input
                    type="text"
                    value={deliberationData.clientName}
                    onChange={(e) => setDeliberationData({ ...deliberationData, clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Location</label>
                  <input
                    type="text"
                    value={deliberationData.projectLocation}
                    onChange={(e) => setDeliberationData({ ...deliberationData, projectLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter project location"
                  />
                </div>
              </div>
            </div>

            {/* 3. TECHNICAL OVERVIEW */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">TECHNICAL OVERVIEW (FOR MANAGER)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Elevator Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Traction (MRL)", "Hydraulic", "Pneumatic"].map((type) => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="elevatorType"
                          value={type}
                          checked={deliberationData.elevatorType === type}
                          onChange={(e) => setDeliberationData({ ...deliberationData, elevatorType: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Floors</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["G+1", "G+2", "G+3", "G+4"].map((floor) => (
                      <label key={floor} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={deliberationData.floors.includes(floor)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDeliberationData({ ...deliberationData, floors: [...deliberationData.floors, floor] });
                            } else {
                              setDeliberationData({ ...deliberationData, floors: deliberationData.floors.filter(f => f !== floor) });
                            }
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{floor}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["250 kg", "300 kg", "400 kg"].map((capacity) => (
                      <label key={capacity} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="capacity"
                          value={capacity}
                          checked={deliberationData.capacity === capacity}
                          onChange={(e) => setDeliberationData({ ...deliberationData, capacity: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{capacity}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pit / Shaft / Machine Room Status</label>
                  <div className="space-y-2">
                    {["Standard", "Acceptable with modifications", "Risk / Special attention required"].map((status) => (
                      <label key={status} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="pitShaftStatus"
                          value={status}
                          checked={deliberationData.pitShaftStatus === status}
                          onChange={(e) => setDeliberationData({ ...deliberationData, pitShaftStatus: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. COMMERCIAL DETAILS */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">COMMERCIAL DETAILS</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Standard Price (as per rate card) (₹)</label>
                  <input
                    type="text"
                    value={deliberationData.standardPrice}
                    onChange={(e) => setDeliberationData({ ...deliberationData, standardPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter standard price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quoted Price (₹)</label>
                  <input
                    type="text"
                    value={deliberationData.quotedPrice}
                    onChange={(e) => setDeliberationData({ ...deliberationData, quotedPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter quoted price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Requested</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="discountRequested"
                        value="No"
                        checked={deliberationData.discountRequested === "No"}
                        onChange={(e) => setDeliberationData({ ...deliberationData, discountRequested: e.target.value, discountAmount: "", discountPercent: "" })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">No</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="discountRequested"
                        value="Yes"
                        checked={deliberationData.discountRequested === "Yes"}
                        onChange={(e) => setDeliberationData({ ...deliberationData, discountRequested: e.target.value })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Yes</span>
                    </label>
                    {deliberationData.discountRequested === "Yes" && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <input
                          type="text"
                          value={deliberationData.discountAmount}
                          onChange={(e) => setDeliberationData({ ...deliberationData, discountAmount: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Amount (₹)"
                        />
                        <input
                          type="text"
                          value={deliberationData.discountPercent}
                          onChange={(e) => setDeliberationData({ ...deliberationData, discountPercent: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Percent (%)"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Gross Margin</label>
                  <div className="space-y-2">
                    {["As per policy", "Below policy (justify below)"].map((margin) => (
                      <label key={margin} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="expectedGrossMargin"
                          value={margin}
                          checked={deliberationData.expectedGrossMargin === margin}
                          onChange={(e) => setDeliberationData({ ...deliberationData, expectedGrossMargin: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{margin}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. CLIENT POSITION & NEGOTIATION STATUS */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">CLIENT POSITION & NEGOTIATION STATUS</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Feedback on Quotation</label>
                  <div className="space-y-2">
                    {["Positive", "Negotiation Ongoing", "Price Sensitive", "Awaiting Response"].map((feedback) => (
                      <label key={feedback} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="clientFeedback"
                          value={feedback}
                          checked={deliberationData.clientFeedback === feedback}
                          onChange={(e) => setDeliberationData({ ...deliberationData, clientFeedback: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{feedback}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Competitor Presence</label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {["Yes", "No"].map((presence) => (
                        <label key={presence} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="competitorPresence"
                            value={presence}
                            checked={deliberationData.competitorPresence === presence}
                            onChange={(e) => setDeliberationData({ ...deliberationData, competitorPresence: e.target.value, competitorBrand: "" })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{presence}</span>
                        </label>
                      ))}
                    </div>
                    {deliberationData.competitorPresence === "Yes" && (
                      <input
                        type="text"
                        value={deliberationData.competitorBrand}
                        onChange={(e) => setDeliberationData({ ...deliberationData, competitorBrand: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                        placeholder="If Yes, Brand (if known)"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 6. SALES JUSTIFICATION */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SALES JUSTIFICATION (MANDATORY)</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Justification for Approval / Revision *
                </label>
                <textarea
                  value={deliberationData.salesJustification}
                  onChange={(e) => setDeliberationData({ ...deliberationData, salesJustification: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={5}
                  placeholder="Why this pricing or deviation is required"
                  required
                />
              </div>
            </div>

            {/* 7. MANAGER DECISION */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">MANAGER DECISION (MANAGER ONLY)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Approval Status</label>
                  <div className="space-y-2">
                    {["Approved as Quoted", "Approved with Revision", "Rejected"].map((status) => (
                      <label key={status} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="approvalStatus"
                          value={status}
                          checked={deliberationData.approvalStatus === status}
                          onChange={(e) => setDeliberationData({ ...deliberationData, approvalStatus: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Approved Final Value (₹)</label>
                  <input
                    type="text"
                    value={deliberationData.approvedFinalValue}
                    onChange={(e) => setDeliberationData({ ...deliberationData, approvedFinalValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter approved final value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Conditions / Remarks</label>
                  <textarea
                    value={deliberationData.specialConditions}
                    onChange={(e) => setDeliberationData({ ...deliberationData, specialConditions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="Enter special conditions or remarks"
                  />
                </div>
              </div>
            </div>

            {/* 8. NEXT ACTION */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">NEXT ACTION (AUTO / SELECT)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">If Approved</label>
                  <div className="space-y-2">
                    {["Share revised quotation with client", "Await client confirmation"].map((action) => (
                      <label key={action} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="nextActionIfApproved"
                          value={action}
                          checked={deliberationData.nextActionIfApproved === action}
                          onChange={(e) => setDeliberationData({ ...deliberationData, nextActionIfApproved: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{action}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">If Rejected</label>
                  <div className="space-y-2">
                    {["Revise quotation", "Close as Lost"].map((action) => (
                      <label key={action} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="nextActionIfRejected"
                          value={action}
                          checked={deliberationData.nextActionIfRejected === action}
                          onChange={(e) => setDeliberationData({ ...deliberationData, nextActionIfRejected: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{action}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up Date</label>
                  <input
                    type="date"
                    value={deliberationData.nextFollowUpDate}
                    onChange={(e) => setDeliberationData({ ...deliberationData, nextFollowUpDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleDeliberationSubmit}
                disabled={deliberationData.deliberationReasons.length === 0 || !deliberationData.salesJustification}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${deliberationData.deliberationReasons.length > 0 && deliberationData.salesJustification
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
                  }`}
              >
                Submit Deliberation
              </button>
              <button
                onClick={() => {
                  setIsManagerDeliberationModalOpen(false);
                  setLeadForDeliberation(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal - Dark Theme */}
      {isDeleteModalOpen && leadToDelete && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setLeadToDelete(null);
            }}
          />

          {/* Dark Theme Card - Exact match to provided design */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="group select-none w-[250px] flex flex-col p-4 relative items-center justify-center bg-gray-800 border border-gray-800 shadow-lg rounded-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="text-center p-3 flex-auto justify-center">
                  <svg
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    className="group-hover:animate-bounce w-12 h-12 flex items-center text-gray-600 fill-red-500 mx-auto"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      clipRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      fillRule="evenodd"
                    />
                  </svg>
                  <h2 className="text-xl font-bold py-4 text-gray-200">Are you sure?</h2>
                  <p className="font-bold text-sm text-gray-500 px-2">
                    Do you really want to continue ? This process cannot be undone
                  </p>
                </div>
                <div className="p-2 mt-2 text-center space-x-1 md:block">
                  <button
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setLeadToDelete(null);
                    }}
                    className="mb-2 md:mb-0 bg-gray-700 px-5 py-2 text-sm shadow-sm font-medium tracking-wider border-2 border-gray-600 hover:border-gray-700 text-gray-300 rounded-full hover:shadow-lg hover:bg-gray-800 transition ease-in duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="bg-red-500 hover:bg-transparent px-5 ml-4 py-2 text-sm shadow-sm hover:shadow-lg font-medium tracking-wider border-2 border-red-500 hover:border-red-500 text-white hover:text-red-500 rounded-full transition ease-in duration-300"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        title={`Delete ${selectedLeadIds.size} Lead(s)?`}
        size="md"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Are you sure?
            </h3>
            <p className="text-sm text-gray-500">
              You are about to delete <span className="font-semibold text-gray-900">{selectedLeadIds.size}</span> lead(s). This action cannot be undone.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsBulkDeleteModalOpen(false)}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDeleteConfirm}
              disabled={deleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <IoCloseCircle className="w-4 h-4" />
                  Delete All
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Contact Report Modal */}
      <ContactReportModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onSubmit={handleContactReportSubmit}
        leadName={leadForContact?.name}
      />

      {/* Assign Lead Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setUserSearchTerm("");
        }}
        title={`Assign ${selectedLeadIds.size} Lead(s)`}
        size="md"
      >
        <div className="space-y-4">
          <div className="relative">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            {users
              .filter((user) =>
                user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                user.role.toLowerCase().includes(userSearchTerm.toLowerCase())
              )
              .map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleAssignLeads(user.id, user.name)}
                  disabled={assigning}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">{user.role}</p>
                    </div>
                    {assigning && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    )}
                  </div>
                </button>
              ))}
            {users.filter((user) =>
              user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
              user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
              user.role.toLowerCase().includes(userSearchTerm.toLowerCase())
            ).length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                No users found
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Image/PDF Viewer Modal */}
      <Modal
        isOpen={viewerItem !== null}
        onClose={() => setViewerItem(null)}
        title={viewerItem?.name || 'Viewer'}
        size="xl"
      >
        {viewerItem && (
          <div className="space-y-4">
            {viewerItem.type === 'image' ? (
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={viewerItem.src}
                  alt={viewerItem.name}
                  className="w-full h-auto max-h-[80vh] object-contain mx-auto"
                  onError={(e) => {
                    console.error("Image failed to load in viewer");
                    toast.error("Failed to load image");
                    setViewerItem(null);
                  }}
                />
              </div>
            ) : (
              <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '600px' }}>
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <a
                    href={viewerItem.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
                    onClick={(e) => {
                      e.preventDefault();
                      const newWindow = window.open();
                      if (newWindow) {
                        newWindow.document.write(`
                          <html>
                            <head><title>${viewerItem.name}</title></head>
                            <body style="margin:0; padding:0;">
                              <embed src="${viewerItem.src}" type="application/pdf" width="100%" height="100%" style="position:absolute; top:0; left:0; width:100%; height:100vh;" />
                            </body>
                          </html>
                        `);
                      }
                    }}
                  >
                    <IoEye className="w-4 h-4" />
                    Open in New Tab
                  </a>
                </div>
                <iframe
                  src={`${viewerItem.src}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="w-full h-full"
                  style={{ minHeight: '600px', border: 'none' }}
                  title={viewerItem.name}
                />
              </div>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 font-medium">{viewerItem.name}</p>
              <button
                onClick={() => setViewerItem(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <IoClose className="w-4 h-4" />
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}






