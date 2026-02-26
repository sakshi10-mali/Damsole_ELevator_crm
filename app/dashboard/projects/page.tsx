"use client";

import { useState, useEffect, useMemo } from "react";
import { projectsAPI, Project, ProjectStage } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import Modal from "@/components/Modal";
import { IoAdd, IoSearch, IoDocumentText, IoCloudUpload, IoCheckmarkCircle, IoCloseCircle, IoTime, IoStatsChart, IoBuild, IoConstruct, IoClipboard, IoShieldCheckmark, IoCube, IoCalendar, IoWallet, IoTrendingUp, IoTrendingDown, IoCreate, IoTrash } from "react-icons/io5";
import { toast } from "@/components/Toast";
import ProjectLineGraph from "@/components/ProjectLineGraph";
import AnimatedDeleteButton from "@/components/AnimatedDeleteButton";
import { can, getUserPermissions, PERMISSIONS } from "@/lib/permissions";

const projectStages: ProjectStage[] = [
  "First Technical Visit",
  "Drawings Prepared",
  "Client Confirmation of Drawings",
  "Interior Selection",
  "Moved to Factory",
  "Ready for Dispatch",
  "Installation Team Scheduled",
  "Installation in Progress",
  "Testing & Final Handover",
];

// Stage configuration with icons and colors matching the flowchart
const stageConfig = [
  { stage: "First Technical Visit", icon: IoBuild, color: "bg-orange-500", bgColor: "bg-orange-50", textColor: "text-orange-700", borderColor: "border-orange-200", phase: "Planning" },
  { stage: "Drawings Prepared", icon: IoDocumentText, color: "bg-purple-500", bgColor: "bg-purple-50", textColor: "text-purple-700", borderColor: "border-purple-200", phase: "Production" },
  { stage: "Client Confirmation of Drawings", icon: IoCheckmarkCircle, color: "bg-purple-500", bgColor: "bg-purple-50", textColor: "text-purple-700", borderColor: "border-purple-200", phase: "Production" },
  { stage: "Interior Selection", icon: IoCube, color: "bg-purple-500", bgColor: "bg-purple-50", textColor: "text-purple-700", borderColor: "border-purple-200", phase: "Production" },
  { stage: "Moved to Factory", icon: IoConstruct, color: "bg-purple-500", bgColor: "bg-purple-50", textColor: "text-purple-700", borderColor: "border-purple-200", phase: "Production" },
  { stage: "Ready for Dispatch", icon: IoCalendar, color: "bg-primary-500", bgColor: "bg-primary-50", textColor: "text-primary-700", borderColor: "border-primary-200", phase: "Installation" },
  { stage: "Installation Team Scheduled", icon: IoConstruct, color: "bg-primary-500", bgColor: "bg-primary-50", textColor: "text-primary-700", borderColor: "border-primary-200", phase: "Installation" },
  { stage: "Installation in Progress", icon: IoClipboard, color: "bg-primary-500", bgColor: "bg-primary-50", textColor: "text-primary-700", borderColor: "border-primary-200", phase: "Installation" },
  { stage: "Testing & Final Handover", icon: IoShieldCheckmark, color: "bg-primary-500", bgColor: "bg-primary-50", textColor: "text-primary-700", borderColor: "border-primary-200", phase: "Installation" },
];

export default function ProjectsPage() {
  const userPermissions = getUserPermissions();
  const canViewExpense = can(PERMISSIONS.EXPENSE_VIEW, userPermissions);
  const canAddExpense = can(PERMISSIONS.EXPENSE_ADD, userPermissions);
  const canEditExpense = can(PERMISSIONS.EXPENSE_EDIT, userPermissions);
  const canDeleteExpense = can(PERMISSIONS.EXPENSE_DELETE, userPermissions);
  const canSeeExpenseList = canViewExpense || canDeleteExpense || canEditExpense;
  const addExpenseOnly = canAddExpense && !canViewExpense && !canEditExpense && !canDeleteExpense;
  const hasAllOrMultipleExpensePermissions =
    canViewExpense && (canAddExpense || canEditExpense || canDeleteExpense);

  const [projectList, setProjectList] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseProject, setExpenseProject] = useState<Project | null>(null);
  const [projectExpenses, setProjectExpenses] = useState<{ id: string; amount: number; description: string }[]>([]);
  const [expenseForm, setExpenseForm] = useState({ amount: "", description: "" });
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expensesByProject, setExpensesByProject] = useState<Record<string, { id: string; amount: number; description: string }[]>>({});
  const [projectCostInput, setProjectCostInput] = useState("");
  const [savingProjectCost, setSavingProjectCost] = useState(false);
  const [isExpenseDetailOpen, setIsExpenseDetailOpen] = useState(false);
  const [expenseDetailProject, setExpenseDetailProject] = useState<Project | null>(null);
  const [expenseDetailList, setExpenseDetailList] = useState<{ id: string; amount: number; description: string }[]>([]);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpenseForm, setEditExpenseForm] = useState({ amount: "", description: "" });
  const [editingExpenseIdInAddModal, setEditingExpenseIdInAddModal] = useState<string | null>(null);
  const [editExpenseFormInAddModal, setEditExpenseFormInAddModal] = useState({ amount: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newProject, setNewProject] = useState({
    projectName: "",
    customerName: "",
    location: "",
    elevatorType: "",
    quotationId: "",
    startDate: "",
    expectedCompletion: "",
    assignedEngineer: "",
    status: "On Track" as "On Track" | "Delayed" | "On Hold",
    currentStage: "First Technical Visit" as ProjectStage,
  });

  useEffect(() => {
    loadProjects();
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

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projects = await projectsAPI.getAll();
      setProjectList(projects);
      if (!canSeeExpenseList) {
        setExpensesByProject({});
        return;
      }
      const map: Record<string, { id: string; amount: number; description: string }[]> = {};
      await Promise.all(
        projects.map(async (p: Project) => {
          try {
            const list = await projectsAPI.getExpenses(p.id);
            map[p.id] = Array.isArray(list) ? list : [];
          } catch {
            map[p.id] = [];
          }
        })
      );
      setExpensesByProject(map);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (projectId: string, newStage: ProjectStage) => {
    try {
      await projectsAPI.update(projectId, { currentStage: newStage });
      const updatedProjects = projectList.map(project => {
        if (project.id === projectId) {
          const stageIndex = projectStages.indexOf(newStage);
          // Calculate progress: current stage index (0-based) + 1, divided by total stages
          const progress = stageIndex >= 0 ? Math.round(((stageIndex + 1) / projectStages.length) * 100) : 0;
          return { ...project, currentStage: newStage, progress };
        }
        return project;
      });
      setProjectList(updatedProjects);
      toast.success(`Project stage updated to "${newStage}"`);
    } catch (error) {
      console.error("Failed to update project stage:", error);
      toast.error("Failed to update project stage. Please try again.");
    }
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    try {
      await projectsAPI.delete(projectToDelete.id);
      setProjectList(projectList.filter(project => project.id !== projectToDelete.id));
      toast.success("Project deleted successfully!");
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete project:", error);
      toast.error(error?.message || "Failed to delete project. Please try again.");
    }
  };

  const openExpenseModal = async (project: Project) => {
    setExpenseProject(project);
    setExpenseForm({ amount: "", description: "" });
    setProjectCostInput((project.orderValue ?? 0) > 0 ? String(project.orderValue) : "");
    setIsExpenseModalOpen(true);
    if (addExpenseOnly) {
      setProjectExpenses([]);
      return;
    }
    try {
      const list = await projectsAPI.getExpenses(project.id);
      setProjectExpenses(Array.isArray(list) ? list : []);
    } catch {
      setProjectExpenses([]);
    }
  };

  const handleSaveProjectCost = async () => {
    if (!expenseProject) return;
    const value = parseFloat(projectCostInput.replace(/[^\d.-]/g, ""));
    if (isNaN(value) || value < 0) {
      toast.error("Please enter a valid project cost.");
      return;
    }
    try {
      setSavingProjectCost(true);
      await projectsAPI.update(expenseProject.id, { orderValue: value });
      setProjectList((prev) =>
        prev.map((p) => (p.id === expenseProject.id ? { ...p, orderValue: value } : p))
      );
      setExpenseProject((p) => (p && p.id === expenseProject.id ? { ...p, orderValue: value } : p));
      setExpensesByProject((prev) => prev);
      toast.success("Project cost saved.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save project cost.");
    } finally {
      setSavingProjectCost(false);
    }
  };

  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setExpenseProject(null);
    setProjectExpenses([]);
    setExpenseForm({ amount: "", description: "" });
    setProjectCostInput("");
    setEditingExpenseIdInAddModal(null);
  };

  const handleAddExpense = async () => {
    if (!expenseProject) return;
    const amount = parseFloat(expenseForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid expense amount.");
      return;
    }
    try {
      setExpenseLoading(true);
      await projectsAPI.addExpense(expenseProject.id, {
        amount,
        description: expenseForm.description.trim() || "Expense",
      });
      const list = await projectsAPI.getExpenses(expenseProject.id);
      setProjectExpenses(Array.isArray(list) ? list : []);
      setExpensesByProject((prev) => ({ ...prev, [expenseProject.id]: list }));
      setExpenseForm({ amount: "", description: "" });
      toast.success("Expense added successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to add expense. Please try again.");
    } finally {
      setExpenseLoading(false);
    }
  };

  const openExpenseDetail = async (project: Project) => {
    setIsExpenseModalOpen(false);
    setExpenseDetailProject(project);
    setEditingExpenseId(null);
    setIsExpenseDetailOpen(true);
    try {
      const list = await projectsAPI.getExpenses(project.id);
      setExpenseDetailList(Array.isArray(list) ? list : []);
    } catch {
      setExpenseDetailList([]);
    }
  };

  const closeExpenseDetail = () => {
    setIsExpenseDetailOpen(false);
    setExpenseDetailProject(null);
    setExpenseDetailList([]);
    setEditingExpenseId(null);
  };

  const refreshExpenseDetailAndCard = async () => {
    if (!expenseDetailProject) return;
    const list = await projectsAPI.getExpenses(expenseDetailProject.id);
    setExpenseDetailList(Array.isArray(list) ? list : []);
    setExpensesByProject((prev) => ({ ...prev, [expenseDetailProject.id]: list }));
  };

  const handleUpdateExpense = async () => {
    if (!expenseDetailProject || !editingExpenseId) return;
    const amount = parseFloat(editExpenseForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    try {
      await projectsAPI.updateExpense(expenseDetailProject.id, editingExpenseId, {
        amount,
        description: editExpenseForm.description.trim() || "Expense",
      });
      await refreshExpenseDetailAndCard();
      setEditingExpenseId(null);
      toast.success("Expense updated.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update expense.");
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!expenseDetailProject) return;
    if (!confirm("Delete this expense?")) return;
    try {
      await projectsAPI.deleteExpense(expenseDetailProject.id, expenseId);
      await refreshExpenseDetailAndCard();
      toast.success("Expense deleted.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete expense.");
    }
  };

  const refreshAddModalExpenses = async () => {
    if (!expenseProject) return;
    const list = await projectsAPI.getExpenses(expenseProject.id);
    setProjectExpenses(Array.isArray(list) ? list : []);
    setExpensesByProject((prev) => ({ ...prev, [expenseProject.id]: list }));
  };

  const handleUpdateExpenseInAddModal = async () => {
    if (!expenseProject || !editingExpenseIdInAddModal) return;
    const amount = parseFloat(editExpenseFormInAddModal.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    try {
      await projectsAPI.updateExpense(expenseProject.id, editingExpenseIdInAddModal, {
        amount,
        description: editExpenseFormInAddModal.description.trim() || "Expense",
      });
      await refreshAddModalExpenses();
      setEditingExpenseIdInAddModal(null);
      toast.success("Expense updated.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update expense.");
    }
  };

  const handleDeleteExpenseInAddModal = async (expenseId: string) => {
    if (!expenseProject) return;
    if (!confirm("Delete this expense?")) return;
    try {
      await projectsAPI.deleteExpense(expenseProject.id, expenseId);
      await refreshAddModalExpenses();
      setEditingExpenseIdInAddModal(null);
      toast.success("Expense deleted.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete expense.");
    }
  };

  const handleCreateProject = async () => {
    try {
      // Validate required fields
      if (!newProject.projectName || !newProject.customerName || !newProject.location || 
          !newProject.startDate || !newProject.expectedCompletion) {
        toast.error("Please fill all required fields (Project Name, Customer Name, Location, Start Date, Expected Completion)");
        return;
      }

      // Validate other required fields
      if (!newProject.elevatorType || !newProject.assignedEngineer) {
        toast.error("Please fill Elevator Type and Assigned Engineer fields");
        return;
      }

      // Ensure quotationId is provided (backend requires it)
      if (!newProject.quotationId || newProject.quotationId.trim() === "") {
        toast.error("Please provide a Quotation ID");
        return;
      }

      // Prepare project data with proper defaults
      // Note: progress will be calculated automatically by backend pre-save hook based on currentStage
      const projectData = {
        projectName: newProject.projectName.trim(),
        customerName: newProject.customerName.trim(),
        location: newProject.location.trim(),
        elevatorType: newProject.elevatorType.trim(),
        quotationId: newProject.quotationId.trim(),
        assignedEngineer: newProject.assignedEngineer.trim(),
        startDate: newProject.startDate,
        expectedCompletion: newProject.expectedCompletion,
        status: newProject.status,
        currentStage: "First Technical Visit" as ProjectStage, // Start from First Technical Visit
        // progress will be auto-calculated by backend based on currentStage
      };

      console.log("Creating project with data:", projectData);
      await projectsAPI.create(projectData);
      toast.success("Project created successfully!");
      setIsCreateModalOpen(false);
      // Reset form
      setNewProject({
        projectName: "",
        customerName: "",
        location: "",
        elevatorType: "",
        quotationId: "",
        startDate: "",
        expectedCompletion: "",
        assignedEngineer: "",
        status: "On Track",
        currentStage: "First Technical Visit",
      });
      loadProjects();
    } catch (error: any) {
      console.error("Failed to create project:", error);
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      // Extract error message - prefer the actual error message over generic messages
      let errorMessage = "Failed to create project. Please try again.";
      if (error?.message) {
        errorMessage = error.message;
        // Remove duplicate "Failed to create project" prefix if present
        if (errorMessage.includes("Failed to create project: Failed to create project")) {
          errorMessage = errorMessage.replace("Failed to create project: Failed to create project", "Failed to create project");
        }
      }
      toast.error(errorMessage);
    }
  };

  const timelineItems = selectedProject
    ? projectStages.map((stage) => ({
        stage,
        completed: projectStages.indexOf(stage) < projectStages.indexOf(selectedProject.currentStage),
        date: selectedProject.startDate,
      }))
    : [];

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projectList;
    const query = searchQuery.toLowerCase().trim();
    return projectList.filter((project) => {
      return (
        project.id.toLowerCase().includes(query) ||
        project.projectName.toLowerCase().includes(query) ||
        project.customerName.toLowerCase().includes(query) ||
        project.location.toLowerCase().includes(query) ||
        project.elevatorType.toLowerCase().includes(query) ||
        project.assignedEngineer.toLowerCase().includes(query) ||
        project.status.toLowerCase().includes(query) ||
        project.currentStage.toLowerCase().includes(query)
      );
    });
  }, [projectList, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading projects...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Projects & Installation</h1>
          <p className="text-sm sm:text-base text-gray-600">Track project progress from order to handover</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-48 md:w-56">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap text-sm sm:text-base font-semibold"
          >
            <IoAdd className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Line Graph for Project Tracking */}
      <div className="mb-6">
        <ProjectLineGraph projects={filteredProjects} selectedProject={selectedProject} />
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className={`mb-4 text-sm rounded-lg px-4 py-2 inline-block ${
          filteredProjects.length > 0
            ? "bg-primary-50 border border-primary-200 text-gray-600"
            : "bg-red-50 border border-red-200 text-red-600"
        }`}>
          {filteredProjects.length > 0 ? (
            <>Showing <span className="font-semibold text-primary-700">{filteredProjects.length}</span> of <span className="font-semibold">{projectList.length}</span> projects</>
          ) : (
            <>No projects found for "<span className="font-semibold">{searchQuery}</span>"</>
          )}
        </div>
      )}

      {filteredProjects.length === 0 && !loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">
            {projectList.length === 0 ? "No projects yet" : "No projects match your search"}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow w-full overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{project.projectName}</h3>
                  <StatusBadge status={project.status} />
                </div>
                <p className="text-sm sm:text-base text-gray-600 mb-1 truncate">{project.customerName}</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{project.location}</p>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <p className="text-xs sm:text-sm text-gray-500">Progress</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{project.progress}%</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Current Stage</span>
                <select
                  value={project.currentStage}
                  onChange={(e) => handleStageChange(project.id, e.target.value as ProjectStage)}
                  className="text-sm border-2 border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                >
                  {projectStages.map((stage) => (
                    <option key={stage} value={stage} className={project.currentStage === stage ? "bg-primary-600 text-white font-semibold" : ""}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              {/* Stages Progress Line with Percentages */}
              <div className="relative mt-4 pt-4 border-t border-gray-200">
                <div className="mb-2">
                  <span className="text-xs font-semibold text-gray-600">Project Stages Progress</span>
                </div>
                <div className="relative">
                  {/* Background connector line */}
                  <div className="absolute top-5 sm:top-6 left-0 right-0 h-1 bg-gray-200 rounded-full z-0" />
                  
                  {/* Progress connector line */}
                  <div 
                    className="absolute top-5 sm:top-6 left-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 rounded-full z-0 transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                  
                  {/* Stages */}
                  <div className="relative flex items-start justify-between gap-1 sm:gap-2 overflow-x-auto pb-2">
                    {projectStages.map((stage, index) => {
                      const stageIndex = index;
                      const stageProgress = ((stageIndex + 1) / projectStages.length) * 100;
                      const isCompleted = stageIndex < projectStages.indexOf(project.currentStage);
                      const isCurrent = stage === project.currentStage;
                      const config = stageConfig.find(c => c.stage === stage);
                      const Icon = config?.icon || IoTime;
                      
                      return (
                        <div key={stage} className="flex flex-col items-center min-w-[70px] sm:min-w-[90px] flex-1 relative z-10">
                          {/* Stage Icon */}
                          <div className={`
                            w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2
                            transition-all duration-300 shadow-md
                            ${isCompleted 
                              ? "bg-primary-500 text-white shadow-primary-300 scale-100" 
                              : isCurrent 
                                ? "bg-blue-500 text-white shadow-lg ring-2 ring-blue-300 scale-110 animate-pulse" 
                                : "bg-gray-300 text-gray-500 scale-90"
                            }
                          `}>
                            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          {/* Stage Percentage */}
                          <div className={`
                            text-xs sm:text-sm font-bold mb-1
                            ${isCompleted ? "text-primary-600" : isCurrent ? "text-blue-600" : "text-gray-400"}
                          `}>
                            {Math.round(stageProgress)}%
                          </div>
                          {/* Stage Name */}
                          <div className={`
                            text-[9px] sm:text-[10px] text-center px-1 leading-tight
                            ${isCompleted ? "text-primary-700 font-semibold" : isCurrent ? "text-blue-700 font-bold" : "text-gray-500"}
                            line-clamp-2 min-h-[28px] sm:min-h-[32px]
                          `}>
                            {stage}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-gray-200 ${
                addExpenseOnly ? "lg:grid-cols-4" : hasAllOrMultipleExpensePermissions ? "lg:grid-cols-6" : "lg:grid-cols-5"
              }`}
            >
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Elevator Type</p>
                <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{project.elevatorType}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Assigned Engineer</p>
                <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{project.assignedEngineer}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Start Date</p>
                <p className="text-sm sm:text-base font-medium text-gray-900">{project.startDate}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Expected Completion</p>
                <p className="text-sm sm:text-base font-medium text-gray-900">{project.expectedCompletion}</p>
              </div>
              {/* Total project cost - show when user has all/multiple expense permissions (view + add/edit/delete) */}
              {hasAllOrMultipleExpensePermissions && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Total project cost</p>
                  <p className="text-sm sm:text-base font-medium text-gray-900">
                    {(project.orderValue ?? 0) > 0 ? `₹${(project.orderValue ?? 0).toLocaleString("en-IN")}` : "—"}
                  </p>
                </div>
              )}
              {/* Expense / P&L - hide for add-only; show "View expenses" or P&L numbers when user has all/multiple */}
              {!addExpenseOnly && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Expense / P&amp;L</p>
                  {canSeeExpenseList ? (
                    <button
                      type="button"
                      onClick={() => openExpenseDetail(project)}
                      className="text-left w-full rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
                    >
                      {hasAllOrMultipleExpensePermissions ? (() => {
                        const expenses = expensesByProject[project.id] || [];
                        const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
                        const cost = project.orderValue ?? 0;
                        const profitLoss = cost - totalExpense;
                        return cost <= 0 ? (
                          <p className="text-sm text-gray-500">Set cost for P/L</p>
                        ) : (
                          <p className={`text-sm font-medium flex items-center gap-1 ${profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {profitLoss >= 0 ? <IoTrendingUp className="w-4 h-4" /> : <IoTrendingDown className="w-4 h-4" />}
                            {profitLoss >= 0 ? "Profit" : "Loss"} ₹{Math.abs(profitLoss).toLocaleString("en-IN")}
                          </p>
                        );
                      })() : (
                        <p className="text-sm text-blue-600 font-medium">View expenses</p>
                      )}
                    </button>
                  ) : (
                    <p className="text-sm text-gray-400 py-2">—</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
              <button
                onClick={() => handleViewDetails(project)}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm text-center sm:text-left"
              >
                <span className="hidden sm:inline">View Timeline →</span>
                <span className="sm:hidden">View Timeline</span>
              </button>
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                {canAddExpense && (
                <button
                  onClick={() => openExpenseModal(project)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm flex-1 sm:flex-none"
                >
                  <IoWallet className="w-4 h-4" />
                  Add Expense
                </button>
                )}
                <button
                  onClick={() => {
                    setSelectedProject(project);
                    setIsDocumentsModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm flex-1 sm:flex-none"
                >
                  <IoDocumentText className="w-4 h-4" />
                  Documents
                </button>
                {/* Delete button for Admin: allow deleting any project */}
                <AnimatedDeleteButton
                  onClick={() => handleDeleteClick(project)}
                  size="sm"
                  title="Delete Project"
                />
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen && selectedProject !== null}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProject(null);
        }}
        title="Project Timeline"
        size="lg"
      >
        {selectedProject && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedProject.projectName}</h3>
              <p className="text-gray-600">{selectedProject.customerName} • {selectedProject.location}</p>
            </div>
            <Timeline items={timelineItems} currentStage={selectedProject.currentStage} />
          </div>
        )}
      </Modal>

      {/* Project Documents Modal */}
      <Modal
        isOpen={isDocumentsModalOpen && selectedProject !== null}
        onClose={() => {
          setIsDocumentsModalOpen(false);
          setSelectedProject(null);
        }}
        title={`Project Documents - ${selectedProject?.projectName}`}
        size="lg"
      >
        {selectedProject && (
          <div className="space-y-6">
            {/* Document Upload by Stage */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Documents by Stage</h3>
              
              {projectStages.map((stage) => (
                <div key={stage} className="mb-4 p-4 border-2 border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{stage}</h4>
                    {selectedProject.currentStage === stage && (
                      <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs font-medium">
                        Current Stage
                      </span>
                    )}
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.dwg"
                      className="hidden"
                      id={`upload-${stage}`}
                    />
                    <label
                      htmlFor={`upload-${stage}`}
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <IoCloudUpload className="w-6 h-6 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Upload drawings, approvals, or documents for {stage}
                      </span>
                      <span className="text-xs text-gray-500">
                        PDF, DOC, DWG, JPG, PNG (Max 10MB)
                      </span>
                    </label>
                  </div>
                  {/* Document List (placeholder) */}
                  <div className="mt-2 text-xs text-gray-500">
                    No documents uploaded yet for this stage
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                Document upload functionality will be connected to backend storage
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen && expenseProject !== null}
        onClose={closeExpenseModal}
        title={expenseProject ? `Add Expense - ${expenseProject.projectName}` : "Add Expense"}
        size="lg"
      >
        {expenseProject && (
          <div className="space-y-6">
            {/* Total project cost - show when user has all/multiple expense permissions */}
            {hasAllOrMultipleExpensePermissions && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-2">Total project cost</h4>
              <p className="text-sm text-gray-600 mb-2">Set the project cost (order value) to calculate profit or loss.</p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={projectCostInput}
                  onChange={(e) => setProjectCostInput(e.target.value)}
                  className="w-40 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="₹ Project cost"
                />
                <button
                  onClick={handleSaveProjectCost}
                  disabled={savingProjectCost}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium text-sm"
                >
                  {savingProjectCost ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
            )}

            {/* Add expense form - only when user can add */}
            {canAddExpense && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">New Expense</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="e.g. Material, Labour"
                  />
                </div>
              </div>
              <button
                onClick={handleAddExpense}
                disabled={expenseLoading || !expenseForm.amount.trim()}
                className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                {expenseLoading ? "Adding…" : "Add Expense"}
              </button>
            </div>
            )}

            {/* Summary: Project cost, Total expense, Profit/Loss - show when user has all/multiple expense permissions */}
            {hasAllOrMultipleExpensePermissions && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500 mb-1">Project cost</p>
                <p className="text-lg font-bold text-gray-900">
                  {(expenseProject.orderValue ?? 0) > 0
                    ? `₹${(expenseProject.orderValue ?? 0).toLocaleString("en-IN")}`
                    : "Not set"}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500 mb-1">Total expense</p>
                <p className="text-lg font-bold text-gray-900">
                  ₹{projectExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString("en-IN")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => expenseProject && openExpenseDetail(expenseProject)}
                className="bg-white rounded-lg border border-gray-200 p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <p className="text-sm text-gray-500 mb-1">Profit / Loss (click to view all)</p>
                {(expenseProject.orderValue ?? 0) <= 0 ? (
                  <p className="text-sm text-gray-400">Set project cost to see P/L</p>
                ) : (
                  <p className={`text-lg font-bold flex items-center gap-1 ${(() => {
                    const projectCost = expenseProject.orderValue ?? 0;
                    const totalExpense = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
                    const profitLoss = projectCost - totalExpense;
                    return profitLoss >= 0 ? "text-green-600" : "text-red-600";
                  })()}`}>
                    {(() => {
                      const projectCost = expenseProject.orderValue ?? 0;
                      const totalExpense = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
                      const profitLoss = projectCost - totalExpense;
                      return (
                        <>
                          {profitLoss >= 0 ? <IoTrendingUp className="w-5 h-5" /> : <IoTrendingDown className="w-5 h-5" />}
                          {profitLoss >= 0 ? "Profit" : "Loss"} ₹{Math.abs(profitLoss).toLocaleString("en-IN")}
                        </>
                      );
                    })()}
                  </p>
                )}
                <p className="text-xs text-blue-600 mt-1">View all expenses →</p>
              </button>
            </div>
            )}

            {/* List of existing expenses - hide for add-only */}
            {!addExpenseOnly && projectExpenses.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Expense history</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Description</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">Amount</th>
                        {(canEditExpense || canDeleteExpense) && <th className="px-3 py-2 text-right font-medium text-gray-700 w-24">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {projectExpenses.map((e) => (
                        <tr key={e.id} className="hover:bg-gray-50">
                          {editingExpenseIdInAddModal === e.id && canEditExpense ? (
                            <>
                              <td className="px-3 py-2">
                                <input
                                  value={editExpenseFormInAddModal.description}
                                  onChange={(ev) => setEditExpenseFormInAddModal((f) => ({ ...f, description: ev.target.value }))}
                                  className="w-full px-2 py-1 border rounded text-sm"
                                  placeholder="Description"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editExpenseFormInAddModal.amount}
                                  onChange={(ev) => setEditExpenseFormInAddModal((f) => ({ ...f, amount: ev.target.value }))}
                                  className="w-full px-2 py-1 border rounded text-sm text-right"
                                  placeholder="Amount"
                                />
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button type="button" onClick={handleUpdateExpenseInAddModal} className="text-primary-600 hover:text-primary-700 font-medium text-xs mr-2">Save</button>
                                <button type="button" onClick={() => setEditingExpenseIdInAddModal(null)} className="text-gray-500 hover:text-gray-700 text-xs">Cancel</button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-3 py-2 text-gray-900">{e.description}</td>
                              <td className="px-3 py-2 text-right font-medium">₹{e.amount.toLocaleString("en-IN")}</td>
                              {(canEditExpense || canDeleteExpense) && (
                              <td className="px-3 py-2 text-right">
                                {canEditExpense && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingExpenseIdInAddModal(e.id);
                                    setEditExpenseFormInAddModal({ amount: String(e.amount), description: e.description });
                                  }}
                                  className="text-blue-600 hover:text-blue-700 p-1 rounded"
                                  title="Edit"
                                >
                                  <IoCreate className="w-4 h-4 inline" />
                                </button>
                                )}
                                {canDeleteExpense && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExpenseInAddModal(e.id)}
                                  className="text-red-600 hover:text-red-700 p-1 rounded ml-1"
                                  title="Delete"
                                >
                                  <IoTrash className="w-4 h-4 inline" />
                                </button>
                                )}
                              </td>
                              )}
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Expense detail modal - list only for view; + delete for delete perm; + cost/P&L and edit for edit perm */}
      <Modal
        isOpen={isExpenseDetailOpen && expenseDetailProject !== null}
        onClose={closeExpenseDetail}
        title={expenseDetailProject ? `Expenses - ${expenseDetailProject.projectName}` : "Expenses"}
        size="lg"
      >
        {expenseDetailProject && (
          <div className="space-y-4">
            {/* Project cost, Total expense, P/L - show when user has all/multiple expense permissions */}
            {hasAllOrMultipleExpensePermissions && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Project cost</p>
                <p className="font-bold text-gray-900">
                  {(expenseDetailProject.orderValue ?? 0) > 0 ? `₹${(expenseDetailProject.orderValue ?? 0).toLocaleString("en-IN")}` : "Not set"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Total expense</p>
                <p className="font-bold text-gray-900">₹{expenseDetailList.reduce((s, e) => s + e.amount, 0).toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">P/L</p>
                {(expenseDetailProject.orderValue ?? 0) <= 0 ? (
                  <p className="text-gray-400">Set cost</p>
                ) : (
                  <p className={`font-bold ${(expenseDetailProject.orderValue ?? 0) - expenseDetailList.reduce((s, e) => s + e.amount, 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {(expenseDetailProject.orderValue ?? 0) - expenseDetailList.reduce((s, e) => s + e.amount, 0) >= 0 ? "Profit" : "Loss"} ₹
                    {Math.abs((expenseDetailProject.orderValue ?? 0) - expenseDetailList.reduce((s, e) => s + e.amount, 0)).toLocaleString("en-IN")}
                  </p>
                )}
              </div>
            </div>
            )}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Description</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Amount</th>
                    {(canEditExpense || canDeleteExpense) && <th className="px-3 py-2 text-right font-medium text-gray-700 w-24">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenseDetailList.length === 0 ? (
                    <tr>
                      <td colSpan={canEditExpense || canDeleteExpense ? 3 : 2} className="px-3 py-6 text-center text-gray-500">No expenses yet. Add from the project card.</td>
                    </tr>
                  ) : (
                    expenseDetailList.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        {editingExpenseId === e.id && canEditExpense ? (
                          <>
                            <td className="px-3 py-2">
                              <input
                                value={editExpenseForm.description}
                                onChange={(ev) => setEditExpenseForm((f) => ({ ...f, description: ev.target.value }))}
                                className="w-full px-2 py-1 border rounded text-sm"
                                placeholder="Description"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editExpenseForm.amount}
                                onChange={(ev) => setEditExpenseForm((f) => ({ ...f, amount: ev.target.value }))}
                                className="w-full px-2 py-1 border rounded text-sm text-right"
                                placeholder="Amount"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button onClick={handleUpdateExpense} className="text-primary-600 hover:text-primary-700 font-medium text-xs mr-2">Save</button>
                              <button onClick={() => setEditingExpenseId(null)} className="text-gray-500 hover:text-gray-700 text-xs">Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2 text-gray-900">{e.description}</td>
                            <td className="px-3 py-2 text-right font-medium">₹{e.amount.toLocaleString("en-IN")}</td>
                            {(canEditExpense || canDeleteExpense) && (
                            <td className="px-3 py-2 text-right">
                              {canEditExpense && (
                              <button
                                onClick={() => {
                                  setEditingExpenseId(e.id);
                                  setEditExpenseForm({ amount: String(e.amount), description: e.description });
                                }}
                                className="text-blue-600 hover:text-blue-700 p-1 rounded"
                                title="Edit"
                              >
                                <IoCreate className="w-4 h-4 inline" />
                              </button>
                              )}
                              {canDeleteExpense && (
                              <button
                                onClick={() => handleDeleteExpense(e.id)}
                                className="text-red-600 hover:text-red-700 p-1 rounded ml-1"
                                title="Delete"
                              >
                                <IoTrash className="w-4 h-4 inline" />
                              </button>
                              )}
                            </td>
                            )}
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewProject({
            projectName: "",
            customerName: "",
            location: "",
            elevatorType: "",
            quotationId: "",
            startDate: "",
            expectedCompletion: "",
            assignedEngineer: "",
            status: "On Track",
            currentStage: "First Technical Visit",
          });
        }}
        title="Create New Project"
        size="lg"
      >
        <div className="space-y-6">
          {/* Project Stages Flow Visualization */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6 border-2 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <IoStatsChart className="w-5 h-5 text-primary-600" />
              Project Flow Stages
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {stageConfig.map((config, index) => {
                const Icon = config.icon;
                const isFirst = index === 0;
                const isLast = index === stageConfig.length - 1;
                const isOrange = config.color.includes("orange");
                const isPurple = config.color.includes("purple");
                const isGreen = config.color.includes("primary");
                // First 5 steps use orange connector, rest use green
                const connectorColor = index < 5 ? "bg-orange-400" : "bg-primary-400";
                
                return (
                  <div key={config.stage} className="relative">
                    {!isLast && (
                      <div className={`absolute left-5 top-10 w-0.5 h-6 ${connectorColor}`} />
                    )}
                    <div className={`
                      flex items-center gap-3 p-3 rounded-lg border-2
                      ${config.bgColor} ${config.borderColor} ${config.textColor}
                      transition-all hover:shadow-md
                    `}>
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-lg
                        ${config.color} text-white flex-shrink-0
                      `}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm sm:text-base">{config.stage}</p>
                        <p className="text-xs opacity-75 mt-0.5">
                          {isFirst && "Initial stage - Project will start here"}
                          {!isFirst && !isLast && `Stage ${index + 1} of ${stageConfig.length}`}
                          {isLast && "Final stage - Project completion"}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`
                          px-2 py-1 rounded text-xs font-medium
                          ${isOrange ? "bg-orange-200 text-orange-800" : ""}
                          ${isPurple ? "bg-purple-200 text-purple-800" : ""}
                          ${isGreen ? "bg-primary-200 text-primary-800" : ""}
                        `}>
                          {index + 1}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-300">
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-500"></div>
                  <span className="text-gray-600">Planning Phase</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-500"></div>
                  <span className="text-gray-600">Production Phase</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary-500"></div>
                  <span className="text-gray-600">Installation Phase</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
              <input
                type="text"
                value={newProject.projectName}
                onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                value={newProject.customerName}
                onChange={(e) => setNewProject({ ...newProject, customerName: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <input
                type="text"
                value={newProject.location}
                onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                placeholder="Enter location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Elevator Type *</label>
              <input
                type="text"
                value={newProject.elevatorType}
                onChange={(e) => setNewProject({ ...newProject, elevatorType: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                placeholder="e.g., MRL, Hydraulic"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quotation ID *</label>
              <input
                type="text"
                value={newProject.quotationId}
                onChange={(e) => setNewProject({ ...newProject, quotationId: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                placeholder="Enter quotation ID"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Engineer *</label>
              <input
                type="text"
                value={newProject.assignedEngineer}
                onChange={(e) => setNewProject({ ...newProject, assignedEngineer: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                placeholder="Enter engineer name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                value={newProject.startDate}
                onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Completion *</label>
              <input
                type="date"
                value={newProject.expectedCompletion}
                onChange={(e) => setNewProject({ ...newProject, expectedCompletion: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={newProject.status}
                onChange={(e) => setNewProject({ ...newProject, status: e.target.value as "On Track" | "Delayed" | "On Hold" })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
              >
                <option value="On Track">On Track</option>
                <option value="Delayed">Delayed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>

          {/* Project Information Summary */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <IoCheckmarkCircle className="w-5 h-5" />
              Project Information
            </h4>
            <p className="text-sm text-blue-800 mb-2">
              Project will start from <strong>"First Technical Visit"</strong> stage and progress through all {stageConfig.length} stages.
            </p>
            <p className="text-xs text-blue-700">
              After creating the project, you can track progress through each stage and update documents at each milestone.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 border-t">
            <button
              onClick={handleCreateProject}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              Create Project
            </button>
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewProject({
                  projectName: "",
                  customerName: "",
                  location: "",
                  elevatorType: "",
                  quotationId: "",
                  startDate: "",
                  expectedCompletion: "",
                  assignedEngineer: "",
                  status: "On Track",
                  currentStage: "First Technical Visit",
                });
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal - Dark Theme */}
      {isDeleteModalOpen && projectToDelete && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setProjectToDelete(null);
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
                      setProjectToDelete(null);
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
    </div>
  );
}
