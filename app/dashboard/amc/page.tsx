"use client";

import { useState, useEffect, useMemo } from "react";
import { amcAPI, AMCContract } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import { toast } from "@/components/Toast";
import { IoAdd, IoCalendar, IoSearch, IoDocumentText, IoCheckmarkCircle } from "react-icons/io5";

export default function AMCPage() {
  const [amcList, setAmcList] = useState<AMCContract[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAMC, setSelectedAMC] = useState<AMCContract | null>(null);
  const [isServiceReportModalOpen, setIsServiceReportModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceReport, setServiceReport] = useState({
    serviceDate: new Date().toISOString().split("T")[0],
    serviceType: "Regular Maintenance",
    workDone: "",
    partsReplaced: "",
    customerSignature: null as File | null,
    technicianNotes: "",
  });
  const [newAMC, setNewAMC] = useState({
    contractId: "",
    customerName: "",
    elevatorName: "",
    amcType: "Comprehensive" as "Comprehensive" | "Non-Comprehensive",
    projectName: "",
    elevatorId: "",
    contractStartDate: "",
    contractEndDate: "",
    amcAmount: "",
    amountType: "Yearly" as "Yearly" | "Monthly",
    paymentStatus: "Pending" as "Paid" | "Pending" | "Overdue",
    paymentMode: "Cash" as "Cash" | "UPI" | "Bank Transfer" | "Cheque",
    invoiceNumber: "",
    invoiceDate: "",
    gstAmount: "",
    netRevenue: "",
    nextPaymentDueDate: "",
    remarks: "",
    serviceFrequency: "Monthly",
    assignedTechnician: "Technician 1",
  });

  useEffect(() => {
    loadAMCContracts();
  }, []);

  const loadAMCContracts = async () => {
    try {
      setLoading(true);
      const contracts = await amcAPI.getAll();
      setAmcList(contracts);
    } catch (error) {
      console.error("Failed to load AMC contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTechnicianChange = async (amcId: string, technician: string) => {
    try {
      await amcAPI.update(amcId, { assignedTechnician: technician });
      setAmcList(amcList.map(amc =>
        amc.id === amcId ? { ...amc, assignedTechnician: technician } : amc
      ));
    } catch (error) {
      console.error("Failed to update technician:", error);
    }
  };

  const handleViewDetails = (amc: AMCContract) => {
    setSelectedAMC(amc);
    setIsModalOpen(true);
  };

  const handleCreateAMC = async () => {
    try {
      // Validate required fields
      if (!newAMC.contractId || !newAMC.customerName || !newAMC.elevatorName || !newAMC.projectName || 
          !newAMC.elevatorId || !newAMC.contractStartDate || !newAMC.contractEndDate || !newAMC.amcAmount) {
        toast.error("Please fill all required fields");
        return;
      }

      // Calculate duration in months
      const startDate = new Date(newAMC.contractStartDate);
      const endDate = new Date(newAMC.contractEndDate);
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

      // Calculate total value based on amount type
      const amcAmountNum = parseFloat(newAMC.amcAmount);
      const totalValue = newAMC.amountType === "Yearly" ? amcAmountNum : amcAmountNum * 12;

      // Calculate GST and Net Revenue if provided
      const gstAmount = newAMC.gstAmount ? parseFloat(newAMC.gstAmount) : 0;
      const netRevenue = newAMC.netRevenue ? parseFloat(newAMC.netRevenue) : (totalValue - gstAmount);

      // Set next service date (1 month from start date for monthly, or calculate based on frequency)
      const nextServiceDate = new Date(startDate);
      if (newAMC.serviceFrequency === "Monthly") {
        nextServiceDate.setMonth(nextServiceDate.getMonth() + 1);
      } else if (newAMC.serviceFrequency === "Quarterly") {
        nextServiceDate.setMonth(nextServiceDate.getMonth() + 3);
      } else {
        nextServiceDate.setMonth(nextServiceDate.getMonth() + 6);
      }

      const amcData = {
        contractId: newAMC.contractId,
        customerName: newAMC.customerName,
        elevatorName: newAMC.elevatorName,
        amcType: newAMC.amcType,
        projectName: newAMC.projectName,
        elevatorId: newAMC.elevatorId,
        contractStartDate: newAMC.contractStartDate,
        contractEndDate: newAMC.contractEndDate,
        duration: duration,
        amcAmount: amcAmountNum,
        amountType: newAMC.amountType,
        paymentStatus: newAMC.paymentStatus,
        paymentMode: newAMC.paymentMode,
        invoiceNumber: newAMC.invoiceNumber || undefined,
        invoiceDate: newAMC.invoiceDate || undefined,
        gstAmount: gstAmount || undefined,
        netRevenue: netRevenue || undefined,
        nextPaymentDueDate: newAMC.nextPaymentDueDate || undefined,
        remarks: newAMC.remarks || undefined,
        serviceFrequency: newAMC.serviceFrequency,
        assignedTechnician: newAMC.assignedTechnician,
        status: "Active" as const,
        totalValue: totalValue,
        servicesCompleted: 0,
        servicesPending: 0,
        nextServiceDate: nextServiceDate.toISOString().split('T')[0],
      };

      await amcAPI.create(amcData);
      toast.success("AMC Contract created successfully!");
      setIsCreateModalOpen(false);
      setNewAMC({
        contractId: "",
        customerName: "",
        elevatorName: "",
        amcType: "Comprehensive",
        projectName: "",
        elevatorId: "",
        contractStartDate: "",
        contractEndDate: "",
        amcAmount: "",
        amountType: "Yearly",
        paymentStatus: "Pending",
        paymentMode: "Cash",
        invoiceNumber: "",
        invoiceDate: "",
        gstAmount: "",
        netRevenue: "",
        nextPaymentDueDate: "",
        remarks: "",
        serviceFrequency: "Monthly",
        assignedTechnician: "Technician 1",
      });
      loadAMCContracts();
    } catch (error) {
      console.error("Failed to create AMC contract:", error);
      toast.error("Failed to create AMC contract. Please try again.");
    }
  };

  const technicians = ["Technician 1", "Technician 2", "Technician 3"];

  // Filter AMC contracts based on search query
  const filteredAMCList = useMemo(() => {
    if (!searchQuery.trim()) return amcList;
    const query = searchQuery.toLowerCase().trim();
    return amcList.filter((amc) => {
      return (
        amc.id.toLowerCase().includes(query) ||
        amc.projectName.toLowerCase().includes(query) ||
        amc.customerName.toLowerCase().includes(query) ||
        amc.elevatorId.toLowerCase().includes(query) ||
        amc.status.toLowerCase().includes(query) ||
        amc.assignedTechnician.toLowerCase().includes(query) ||
        amc.contractStartDate.toLowerCase().includes(query) ||
        amc.contractEndDate.toLowerCase().includes(query) ||
        amc.nextServiceDate.toLowerCase().includes(query)
      );
    });
  }, [amcList, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading AMC contracts...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">AMC & Service Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage Annual Maintenance Contracts and service schedules</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-48 md:w-56">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search AMC contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap text-sm sm:text-base"
          >
            <IoAdd className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">New AMC Contract</span>
            <span className="sm:hidden">New AMC</span>
          </button>
        </div>
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className={`mb-4 text-sm rounded-lg px-4 py-2 inline-block ${
          filteredAMCList.length > 0
            ? "bg-primary-50 border border-primary-200 text-gray-600"
            : "bg-red-50 border border-red-200 text-red-600"
        }`}>
          {filteredAMCList.length > 0 ? (
            <>Showing <span className="font-semibold text-primary-700">{filteredAMCList.length}</span> of <span className="font-semibold">{amcList.length}</span> AMC contracts</>
          ) : (
            <>No AMC contracts found for "<span className="font-semibold">{searchQuery}</span>"</>
          )}
        </div>
      )}

      {filteredAMCList.length === 0 && !loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">
            {amcList.length === 0 ? "No AMC contracts yet" : "No AMC contracts match your search"}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredAMCList.map((amc) => (
          <div
            key={amc.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow w-full overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{amc.projectName}</h3>
                  <StatusBadge status={amc.status} />
                </div>
                <p className="text-sm sm:text-base text-gray-600 mb-1 truncate">{amc.customerName}</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Elevator ID: {amc.elevatorId}</p>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <p className="text-xs sm:text-sm text-gray-500">Contract Value</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">₹{(amc.totalValue / 1000).toFixed(0)}K</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Contract Period</p>
                <p className="text-sm sm:text-base font-medium text-gray-900">
                  {amc.contractStartDate} to {amc.contractEndDate}
                </p>
                <p className="text-xs text-gray-500">{amc.duration} months</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Next Service Due</p>
                <div className="flex items-center gap-2">
                  <IoCalendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                  <p className="text-sm sm:text-base font-medium text-gray-900">{amc.nextServiceDate}</p>
                </div>
                <p className="text-xs text-gray-500">{amc.serviceFrequency}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Services</p>
                <p className="text-sm sm:text-base font-medium text-primary-600">{amc.servicesCompleted} completed</p>
                <p className="text-xs text-orange-600">{amc.servicesPending} pending</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Assigned Technician</p>
                <select
                  value={amc.assignedTechnician}
                  onChange={(e) => handleTechnicianChange(amc.id, e.target.value)}
                  className="text-sm border-2 border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white w-full"
                >
                  {technicians.map((tech) => (
                    <option key={tech} value={tech} className={amc.assignedTechnician === tech ? "bg-green-600 text-white font-semibold" : ""}>
                      {tech}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
              <button
                onClick={() => handleViewDetails(amc)}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm text-center sm:text-left"
              >
                <span className="hidden sm:inline">View Details →</span>
                <span className="sm:hidden">View Details</span>
              </button>
              <button
                onClick={() => {
                  setSelectedAMC(amc);
                  setIsServiceReportModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm w-full sm:w-auto"
              >
                <IoCheckmarkCircle className="w-4 h-4" />
                Service Report
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen && selectedAMC !== null}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAMC(null);
        }}
        title="AMC Contract Details"
        size="lg"
      >
        {selectedAMC && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedAMC.projectName}</h3>
              <p className="text-gray-600">{selectedAMC.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Elevator ID</p>
                <p className="font-medium text-gray-900">{selectedAMC.elevatorId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <StatusBadge status={selectedAMC.status} />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Contract Start</p>
                <p className="font-medium text-gray-900">{selectedAMC.contractStartDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Contract End</p>
                <p className="font-medium text-gray-900">{selectedAMC.contractEndDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Duration</p>
                <p className="font-medium text-gray-900">{selectedAMC.duration} months</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Service Frequency</p>
                <p className="font-medium text-gray-900">{selectedAMC.serviceFrequency}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Next Service Date</p>
                <p className="font-medium text-blue-600">{selectedAMC.nextServiceDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Assigned Technician</p>
                <p className="font-medium text-gray-900">{selectedAMC.assignedTechnician}</p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Services Completed</span>
                <span className="font-semibold text-primary-600">{selectedAMC.servicesCompleted}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Services Pending</span>
                <span className="font-semibold text-orange-600">{selectedAMC.servicesPending}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-lg font-semibold text-gray-900">Total Contract Value</span>
                <span className="text-lg font-bold text-blue-600">
                  ₹{selectedAMC.totalValue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Service Report Modal */}
      <Modal
        isOpen={isServiceReportModalOpen && selectedAMC !== null}
        onClose={() => {
          setIsServiceReportModalOpen(false);
          setSelectedAMC(null);
          setServiceReport({
            serviceDate: new Date().toISOString().split("T")[0],
            serviceType: "Regular Maintenance",
            workDone: "",
            partsReplaced: "",
            customerSignature: null,
            technicianNotes: "",
          });
        }}
        title={`Service Report - ${selectedAMC?.projectName}`}
        size="lg"
      >
        {selectedAMC && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Date *
                </label>
                <input
                  type="date"
                  value={serviceReport.serviceDate}
                  onChange={(e) => setServiceReport({ ...serviceReport, serviceDate: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type *
                </label>
                <select
                  value={serviceReport.serviceType}
                  onChange={(e) => setServiceReport({ ...serviceReport, serviceType: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
                >
                  <option value="Regular Maintenance">Regular Maintenance</option>
                  <option value="Emergency Service">Emergency Service</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Repair">Repair</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Work Done *
              </label>
              <textarea
                value={serviceReport.workDone}
                onChange={(e) => setServiceReport({ ...serviceReport, workDone: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                rows={4}
                placeholder="Describe the work performed..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parts Replaced
              </label>
              <input
                type="text"
                value={serviceReport.partsReplaced}
                onChange={(e) => setServiceReport({ ...serviceReport, partsReplaced: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="List parts replaced (if any)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technician Notes
              </label>
              <textarea
                value={serviceReport.technicianNotes}
                onChange={(e) => setServiceReport({ ...serviceReport, technicianNotes: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                rows={3}
                placeholder="Additional notes from technician..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Signature Upload *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  id="signature-upload"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setServiceReport({ ...serviceReport, customerSignature: e.target.files[0] });
                    }
                  }}
                />
                <label
                  htmlFor="signature-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <IoDocumentText className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {serviceReport.customerSignature 
                      ? `Selected: ${serviceReport.customerSignature.name}`
                      : "Upload customer signature (JPG, PNG, PDF)"}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  // TODO: Save service report to backend
                  toast.success("Service report saved successfully!");
                  setIsServiceReportModalOpen(false);
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold"
              >
                Save Service Report
              </button>
              <button
                onClick={() => {
                  setIsServiceReportModalOpen(false);
                  setServiceReport({
                    serviceDate: new Date().toISOString().split("T")[0],
                    serviceType: "Regular Maintenance",
                    workDone: "",
                    partsReplaced: "",
                    customerSignature: null,
                    technicianNotes: "",
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create AMC Contract Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewAMC({
            contractId: "",
            customerName: "",
            elevatorName: "",
            amcType: "Comprehensive",
            projectName: "",
            elevatorId: "",
            contractStartDate: "",
            contractEndDate: "",
            amcAmount: "",
            amountType: "Yearly",
            paymentStatus: "Pending",
            paymentMode: "Cash",
            invoiceNumber: "",
            invoiceDate: "",
            gstAmount: "",
            netRevenue: "",
            nextPaymentDueDate: "",
            remarks: "",
            serviceFrequency: "Monthly",
            assignedTechnician: "Technician 1",
          });
        }}
        title="Create New AMC Contract"
        size="lg"
      >
        <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AMC Contract ID / Number *
                </label>
                <input
                  type="text"
                  value={newAMC.contractId}
                  onChange={(e) => setNewAMC({ ...newAMC, contractId: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="AMC-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={newAMC.customerName}
                  onChange={(e) => setNewAMC({ ...newAMC, customerName: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Elevator / Product Name *
                </label>
                <input
                  type="text"
                  value={newAMC.elevatorName}
                  onChange={(e) => setNewAMC({ ...newAMC, elevatorName: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="Enter elevator/product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AMC Type *
                </label>
                <select
                  value={newAMC.amcType}
                  onChange={(e) => setNewAMC({ ...newAMC, amcType: e.target.value as "Comprehensive" | "Non-Comprehensive" })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
                >
                  <option value="Comprehensive">Comprehensive</option>
                  <option value="Non-Comprehensive">Non-Comprehensive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newAMC.projectName}
                  onChange={(e) => setNewAMC({ ...newAMC, projectName: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Elevator ID *
                </label>
                <input
                  type="text"
                  value={newAMC.elevatorId}
                  onChange={(e) => setNewAMC({ ...newAMC, elevatorId: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="Enter elevator ID"
                />
              </div>
            </div>
          </div>

          {/* Contract Dates */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract Start Date *
                </label>
                <input
                  type="date"
                  value={newAMC.contractStartDate}
                  onChange={(e) => setNewAMC({ ...newAMC, contractStartDate: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract End Date *
                </label>
                <input
                  type="date"
                  value={newAMC.contractEndDate}
                  onChange={(e) => setNewAMC({ ...newAMC, contractEndDate: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* AMC Amount & Payment */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AMC Amount & Payment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AMC Amount *
                </label>
                <input
                  type="number"
                  value={newAMC.amcAmount}
                  onChange={(e) => setNewAMC({ ...newAMC, amcAmount: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yearly / Monthly *
                </label>
                <select
                  value={newAMC.amountType}
                  onChange={(e) => setNewAMC({ ...newAMC, amountType: e.target.value as "Yearly" | "Monthly" })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
                >
                  <option value="Yearly">Yearly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status *
                </label>
                <select
                  value={newAMC.paymentStatus}
                  onChange={(e) => setNewAMC({ ...newAMC, paymentStatus: e.target.value as "Paid" | "Pending" | "Overdue" })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode *
                </label>
                <select
                  value={newAMC.paymentMode}
                  onChange={(e) => setNewAMC({ ...newAMC, paymentMode: e.target.value as "Cash" | "UPI" | "Bank Transfer" | "Cheque" })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Payment Due Date
                </label>
                <input
                  type="date"
                  value={newAMC.nextPaymentDueDate}
                  onChange={(e) => setNewAMC({ ...newAMC, nextPaymentDueDate: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Invoice Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={newAMC.invoiceNumber}
                  onChange={(e) => setNewAMC({ ...newAMC, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="Enter invoice number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={newAMC.invoiceDate}
                  onChange={(e) => setNewAMC({ ...newAMC, invoiceDate: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Amount
                </label>
                <input
                  type="number"
                  value={newAMC.gstAmount}
                  onChange={(e) => setNewAMC({ ...newAMC, gstAmount: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="Enter GST amount"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Net Revenue (after tax)
                </label>
                <input
                  type="number"
                  value={newAMC.netRevenue}
                  onChange={(e) => setNewAMC({ ...newAMC, netRevenue: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="Enter net revenue"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Service & Assignment */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Service & Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Frequency
                </label>
                <select
                  value={newAMC.serviceFrequency}
                  onChange={(e) => setNewAMC({ ...newAMC, serviceFrequency: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half-Yearly">Half-Yearly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Technician
                </label>
                <select
                  value={newAMC.assignedTechnician}
                  onChange={(e) => setNewAMC({ ...newAMC, assignedTechnician: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
                >
                  {technicians.map((tech) => (
                    <option key={tech} value={tech}>{tech}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks / Notes
            </label>
            <textarea
              value={newAMC.remarks}
              onChange={(e) => setNewAMC({ ...newAMC, remarks: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
              rows={3}
              placeholder="Enter any additional remarks or notes..."
            />
          </div>

          {/* Advanced Section */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Extra (Advanced)</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Month-wise revenue:</strong> Will be calculated automatically based on payment history
              </p>
              <p className="text-sm text-gray-600">
                <strong>Year-wise revenue:</strong> Will be calculated automatically based on payment history
              </p>
              <p className="text-sm text-gray-600">
                <strong>Total AMC income:</strong> Will be calculated automatically
              </p>
              <p className="text-sm text-gray-600">
                <strong>Pending amount summary:</strong> Will be calculated automatically based on payment status
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleCreateAMC}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Create AMC Contract
            </button>
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewAMC({
                  contractId: "",
                  customerName: "",
                  elevatorName: "",
                  amcType: "Comprehensive",
                  projectName: "",
                  elevatorId: "",
                  contractStartDate: "",
                  contractEndDate: "",
                  amcAmount: "",
                  amountType: "Yearly",
                  paymentStatus: "Pending",
                  paymentMode: "Cash",
                  invoiceNumber: "",
                  invoiceDate: "",
                  gstAmount: "",
                  netRevenue: "",
                  nextPaymentDueDate: "",
                  remarks: "",
                  serviceFrequency: "Monthly",
                  assignedTechnician: "Technician 1",
                });
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
