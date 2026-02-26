"use client";

import { useState, useEffect, useMemo } from "react";
import { quotationsAPI, Quotation, leadsAPI, Lead } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import { toast } from "@/components/Toast";
import { IoAdd, IoDocumentText, IoSearch, IoDownload, IoEye, IoTrash } from "react-icons/io5";

export default function QuotationsPage() {
  const [quotationList, setQuotationList] = useState<Quotation[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newQuotation, setNewQuotation] = useState({
    leadId: "",
    leadName: "",
    projectAddress: "",
    contactNumber: "",
    elevatorType: "Home Elevator",
    modelNumber: "Damsole-GX630",
    floors: "",
    capacity: "",
    speed: "",
    shaftType: "G S",
    application: "Outdoor",
    cabinType: "Standard",
    doorType: "Automatic Door",
    // Standard rates
    standardBasicCost: "1450000",
    standardShaftMasonry: "0",
    standardShaftFilling: "0",
    standardInstallation: "60000",
    standardExtraTravelHeight: "0",
    standardPremiumCabin: "80000",
    standardMultiColorLED: "25000",
    standardGlassDoor: "75000",
    standardPremiumRALColor: "45000",
    standardCustomizedCabinSize: "40000",
    standardTransportation: "50000",
    standardAdvancedFeatures: "112000",
    // Signature rates
    signatureBasicCost: "1440000",
    signatureShaftMasonry: "0",
    signatureShaftFilling: "0",
    signatureInstallation: "0",
    signatureExtraTravelHeight: "0",
    signaturePremiumCabin: "0",
    signatureMultiColorLED: "0",
    signatureGlassDoor: "0",
    signaturePremiumRALColor: "0",
    signatureCustomizedCabinSize: "0",
    signatureTransportation: "0",
    signatureAdvancedFeatures: "0",
    timeOfDelivery: "3 months from customer's confirmation of drawings and finishes.",
    paymentPercentage1: "50",
    paymentPercentage2: "50",
  });

  useEffect(() => {
    loadQuotations();
    loadLeads();
  }, []);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const quotations = await quotationsAPI.getAll();
      setQuotationList(quotations);
    } catch (error) {
      console.error("Failed to load quotations:", error);
      toast.error("Failed to load quotations");
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      const leadsData = await leadsAPI.getAll();
      setLeads(leadsData);
    } catch (error) {
      console.error("Failed to load leads:", error);
    }
  };

  const handleCreateQuotation = async () => {
    try {
      // Calculate totals
      const standardRates = {
        basicCost: parseFloat(newQuotation.standardBasicCost) || 0,
        shaftMasonry: parseFloat(newQuotation.standardShaftMasonry) || 0,
        shaftFilling: parseFloat(newQuotation.standardShaftFilling) || 0,
        installation: parseFloat(newQuotation.standardInstallation) || 0,
        extraTravelHeight: parseFloat(newQuotation.standardExtraTravelHeight) || 0,
        premiumCabin: parseFloat(newQuotation.standardPremiumCabin) || 0,
        multiColorLED: parseFloat(newQuotation.standardMultiColorLED) || 0,
        glassDoor: parseFloat(newQuotation.standardGlassDoor) || 0,
        premiumRALColor: parseFloat(newQuotation.standardPremiumRALColor) || 0,
        customizedCabinSize: parseFloat(newQuotation.standardCustomizedCabinSize) || 0,
        transportation: parseFloat(newQuotation.standardTransportation) || 0,
        advancedFeatures: parseFloat(newQuotation.standardAdvancedFeatures) || 0,
      };

      const signatureRates = {
        basicCost: parseFloat(newQuotation.signatureBasicCost) || 0,
        shaftMasonry: parseFloat(newQuotation.signatureShaftMasonry) || 0,
        shaftFilling: parseFloat(newQuotation.signatureShaftFilling) || 0,
        installation: parseFloat(newQuotation.signatureInstallation) || 0,
        extraTravelHeight: parseFloat(newQuotation.signatureExtraTravelHeight) || 0,
        premiumCabin: parseFloat(newQuotation.signaturePremiumCabin) || 0,
        multiColorLED: parseFloat(newQuotation.signatureMultiColorLED) || 0,
        glassDoor: parseFloat(newQuotation.signatureGlassDoor) || 0,
        premiumRALColor: parseFloat(newQuotation.signaturePremiumRALColor) || 0,
        customizedCabinSize: parseFloat(newQuotation.signatureCustomizedCabinSize) || 0,
        transportation: parseFloat(newQuotation.signatureTransportation) || 0,
        advancedFeatures: parseFloat(newQuotation.signatureAdvancedFeatures) || 0,
      };

      const standardTotal = Object.values(standardRates).reduce((a, b) => a + b, 0);
      const standardGST = Math.round(standardTotal * 0.18);
      const standardNet = standardTotal + standardGST;

      const signatureTotal = Object.values(signatureRates).reduce((a, b) => a + b, 0);
      const signatureGST = Math.round(signatureTotal * 0.18);
      const signatureNet = signatureTotal + signatureGST;

      const paymentPercentage1 = parseFloat(newQuotation.paymentPercentage1) || 50;
      const paymentPercentage2 = parseFloat(newQuotation.paymentPercentage2) || 50;

      const quotationData = {
        leadId: newQuotation.leadId,
        leadName: newQuotation.leadName,
        projectAddress: newQuotation.projectAddress,
        contactNumber: newQuotation.contactNumber,
        elevatorType: newQuotation.elevatorType,
        modelNumber: newQuotation.modelNumber,
        floors: parseInt(newQuotation.floors) || 0,
        capacity: parseInt(newQuotation.capacity) || 0,
        speed: parseFloat(newQuotation.speed) || 0,
        shaftType: newQuotation.shaftType,
        application: newQuotation.application,
        cabinType: newQuotation.cabinType,
        doorType: newQuotation.doorType,
        features: ["Auto Door", "Emergency Phone", "LED Display"],
        standardRates,
        signatureRates,
        standardTotal,
        standardGST,
        standardNet,
        signatureTotal,
        signatureGST,
        signatureNet,
        timeOfDelivery: newQuotation.timeOfDelivery,
        paymentTerms: {
          percentage1: paymentPercentage1,
          amount1: Math.round(signatureNet * (paymentPercentage1 / 100)),
          percentage2: paymentPercentage2,
          amount2: Math.round(signatureNet * (paymentPercentage2 / 100)),
        },
        // Legacy fields for backward compatibility
        basePrice: signatureTotal,
        installationCost: 0,
        tax: signatureGST,
        totalAmount: signatureNet,
        status: "Pending" as const,
      };

      const createdQuotation = await quotationsAPI.create(quotationData);
      setQuotationList([...quotationList, createdQuotation]);
      setIsCreateModalOpen(false);
      toast.success("Quotation created successfully!");
      
      // Reset form
      setNewQuotation({
        leadId: "",
        leadName: "",
        projectAddress: "",
        contactNumber: "",
        elevatorType: "Home Elevator",
        modelNumber: "Damsole-GX630",
        floors: "",
        capacity: "",
        speed: "",
        shaftType: "G S",
        application: "Outdoor",
        cabinType: "Standard",
        doorType: "Automatic Door",
        standardBasicCost: "1450000",
        standardShaftMasonry: "0",
        standardShaftFilling: "0",
        standardInstallation: "60000",
        standardExtraTravelHeight: "0",
        standardPremiumCabin: "80000",
        standardMultiColorLED: "25000",
        standardGlassDoor: "75000",
        standardPremiumRALColor: "45000",
        standardCustomizedCabinSize: "40000",
        standardTransportation: "50000",
        standardAdvancedFeatures: "112000",
        signatureBasicCost: "1440000",
        signatureShaftMasonry: "0",
        signatureShaftFilling: "0",
        signatureInstallation: "0",
        signatureExtraTravelHeight: "0",
        signaturePremiumCabin: "0",
        signatureMultiColorLED: "0",
        signatureGlassDoor: "0",
        signaturePremiumRALColor: "0",
        signatureCustomizedCabinSize: "0",
        signatureTransportation: "0",
        signatureAdvancedFeatures: "0",
        timeOfDelivery: "3 months from customer's confirmation of drawings and finishes.",
        paymentPercentage1: "50",
        paymentPercentage2: "50",
      });
    } catch (error) {
      console.error("Failed to create quotation:", error);
      toast.error("Failed to create quotation. Please try again.");
    }
  };

  const handlePreview = (quotation: Quotation) => {
    setPreviewQuotation(quotation);
    setIsPreviewModalOpen(true);
  };

  const handleViewPDF = async (quotation: Quotation) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/quotations/${quotation.id}/pdf`);
      if (!response.ok) throw new Error('Failed to fetch PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error("Failed to view PDF:", error);
      toast.error("Failed to view quotation PDF. Please try again.");
    }
  };

  const handleDownload = async (quotation: Quotation) => {
    try {
      toast.info("Generating PDF...");
      await quotationsAPI.downloadPDF(quotation.id);
      toast.success("Quotation PDF downloaded successfully!");
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error("Failed to download quotation PDF. Please try again.");
    }
  };

  const handleLeadSelect = (leadId: string) => {
    const selectedLead = leads.find(l => l.id === leadId);
    if (selectedLead) {
      setNewQuotation({
        ...newQuotation,
        leadId: selectedLead.id,
        leadName: `${selectedLead.name}${selectedLead.company ? ` - ${selectedLead.company}` : ''}`,
        contactNumber: selectedLead.phone,
      });
    }
  };

  // Filter quotations based on search query
  const filteredQuotations = useMemo(() => {
    if (!searchQuery.trim()) return quotationList;
    const query = searchQuery.toLowerCase().trim();
    return quotationList.filter((quotation) => {
      return (
        quotation.id.toLowerCase().includes(query) ||
        quotation.leadId.toLowerCase().includes(query) ||
        quotation.leadName.toLowerCase().includes(query) ||
        quotation.elevatorType.toLowerCase().includes(query) ||
        quotation.status.toLowerCase().includes(query) ||
        quotation.totalAmount.toString().includes(query) ||
        quotation.validUntil.toLowerCase().includes(query)
      );
    });
  }, [quotationList, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading quotations...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Quotations</h1>
          <p className="text-sm sm:text-base text-gray-600">Create and manage customer quotations</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-48 md:w-56">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search quotations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap text-sm sm:text-base"
          >
            <IoAdd className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Create Quotation</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className={`mb-4 text-sm rounded-lg px-4 py-2 inline-block ${
          filteredQuotations.length > 0
            ? "bg-primary-50 border border-primary-200 text-gray-600"
            : "bg-red-50 border border-red-200 text-red-600"
        }`}>
          {filteredQuotations.length > 0 ? (
            <>Showing <span className="font-semibold text-primary-700">{filteredQuotations.length}</span> of <span className="font-semibold">{quotationList.length}</span> quotations</>
          ) : (
            <>No quotations found for "<span className="font-semibold">{searchQuery}</span>"</>
          )}
        </div>
      )}

      {filteredQuotations.length === 0 && !loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">
            {quotationList.length === 0 ? "No quotations yet" : "No quotations match your search"}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredQuotations.map((quotation) => (
          <div
            key={quotation.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow w-full overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{quotation.id}</h3>
                  <StatusBadge status={quotation.status} />
                </div>
                <p className="text-sm sm:text-base text-gray-600 truncate">{quotation.leadName}</p>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  ₹{(quotation.totalAmount / 100000).toFixed(2)}L
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Valid until {quotation.validUntil}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Elevator Type</p>
                <p className="font-medium text-gray-900">{quotation.elevatorType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Floors</p>
                <p className="font-medium text-gray-900">{quotation.floors}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Capacity</p>
                <p className="font-medium text-gray-900">{quotation.capacity} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Speed</p>
                <p className="font-medium text-gray-900">{quotation.speed} m/s</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-gray-200">
              <div className="text-xs sm:text-sm text-gray-500">
                <span className="block sm:inline">Created: {quotation.createdAt}</span>
                <span className="hidden sm:inline"> | </span>
                <span className="block sm:inline">Version: {quotation.version}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleViewPDF(quotation)}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
                >
                  <IoEye className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => handlePreview(quotation)}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
                >
                  <IoDocumentText className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={() => handleDownload(quotation)}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
                >
                  <IoDownload className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("Delete this quotation? This action cannot be undone.")) return;
                    try {
                      await quotationsAPI.delete(quotation.id);
                      setQuotationList((prev) => prev.filter((q) => q.id !== quotation.id));
                      toast.success("Quotation deleted");
                    } catch (err) {
                      console.error("Failed to delete quotation:", err);
                      toast.error("Failed to delete quotation. Please try again.");
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
                >
                  <IoTrash className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Create Quotation Modal - Comprehensive Form */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Quotation"
        size="xl"
      >
        <div className="space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Basic Information */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Lead *
                </label>
                <select
                  value={newQuotation.leadId}
                  onChange={(e) => handleLeadSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a lead...</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} {lead.company ? `- ${lead.company}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={newQuotation.leadName}
                  onChange={(e) => setNewQuotation({ ...newQuotation, leadName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter client name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Address
                </label>
                <input
                  type="text"
                  value={newQuotation.projectAddress}
                  onChange={(e) => setNewQuotation({ ...newQuotation, projectAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={newQuotation.contactNumber}
                  onChange={(e) => setNewQuotation({ ...newQuotation, contactNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>
            </div>
          </div>

          {/* Elevator Specifications */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Elevator Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model Number
                </label>
                <input
                  type="text"
                  value={newQuotation.modelNumber}
                  onChange={(e) => setNewQuotation({ ...newQuotation, modelNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Floors *
                </label>
                <input
                  type="number"
                  value={newQuotation.floors}
                  onChange={(e) => setNewQuotation({ ...newQuotation, floors: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity (kg) *
                </label>
                <input
                  type="number"
                  value={newQuotation.capacity}
                  onChange={(e) => setNewQuotation({ ...newQuotation, capacity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="440"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Speed (m/s) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newQuotation.speed}
                  onChange={(e) => setNewQuotation({ ...newQuotation, speed: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application
                </label>
                <input
                  type="text"
                  value={newQuotation.application}
                  onChange={(e) => setNewQuotation({ ...newQuotation, application: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shaft Type
                </label>
                <input
                  type="text"
                  value={newQuotation.shaftType}
                  onChange={(e) => setNewQuotation({ ...newQuotation, shaftType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Cost Breakdown - Standard Rates */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Standard Rates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Basic Cost</label>
                <input
                  type="number"
                  value={newQuotation.standardBasicCost}
                  onChange={(e) => setNewQuotation({ ...newQuotation, standardBasicCost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Installation</label>
                <input
                  type="number"
                  value={newQuotation.standardInstallation}
                  onChange={(e) => setNewQuotation({ ...newQuotation, standardInstallation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Premium Cabin</label>
                <input
                  type="number"
                  value={newQuotation.standardPremiumCabin}
                  onChange={(e) => setNewQuotation({ ...newQuotation, standardPremiumCabin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Multi Color LED</label>
                <input
                  type="number"
                  value={newQuotation.standardMultiColorLED}
                  onChange={(e) => setNewQuotation({ ...newQuotation, standardMultiColorLED: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Glass Door</label>
                <input
                  type="number"
                  value={newQuotation.standardGlassDoor}
                  onChange={(e) => setNewQuotation({ ...newQuotation, standardGlassDoor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transportation</label>
                <input
                  type="number"
                  value={newQuotation.standardTransportation}
                  onChange={(e) => setNewQuotation({ ...newQuotation, standardTransportation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advanced Features</label>
                <input
                  type="number"
                  value={newQuotation.standardAdvancedFeatures}
                  onChange={(e) => setNewQuotation({ ...newQuotation, standardAdvancedFeatures: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Cost Breakdown - Signature Rates */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Signature Rates (Customer Pays)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Basic Cost</label>
                <input
                  type="number"
                  value={newQuotation.signatureBasicCost}
                  onChange={(e) => setNewQuotation({ ...newQuotation, signatureBasicCost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Installation</label>
                <input
                  type="number"
                  value={newQuotation.signatureInstallation}
                  onChange={(e) => setNewQuotation({ ...newQuotation, signatureInstallation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Premium Cabin</label>
                <input
                  type="number"
                  value={newQuotation.signaturePremiumCabin}
                  onChange={(e) => setNewQuotation({ ...newQuotation, signaturePremiumCabin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Multi Color LED</label>
                <input
                  type="number"
                  value={newQuotation.signatureMultiColorLED}
                  onChange={(e) => setNewQuotation({ ...newQuotation, signatureMultiColorLED: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Glass Door</label>
                <input
                  type="number"
                  value={newQuotation.signatureGlassDoor}
                  onChange={(e) => setNewQuotation({ ...newQuotation, signatureGlassDoor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transportation</label>
                <input
                  type="number"
                  value={newQuotation.signatureTransportation}
                  onChange={(e) => setNewQuotation({ ...newQuotation, signatureTransportation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advanced Features</label>
                <input
                  type="number"
                  value={newQuotation.signatureAdvancedFeatures}
                  onChange={(e) => setNewQuotation({ ...newQuotation, signatureAdvancedFeatures: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Terms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time of Delivery
                </label>
                <input
                  type="text"
                  value={newQuotation.timeOfDelivery}
                  onChange={(e) => setNewQuotation({ ...newQuotation, timeOfDelivery: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Split 1 (%)
                </label>
                <input
                  type="number"
                  value={newQuotation.paymentPercentage1}
                  onChange={(e) => setNewQuotation({ ...newQuotation, paymentPercentage1: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Split 2 (%)
                </label>
                <input
                  type="number"
                  value={newQuotation.paymentPercentage2}
                  onChange={(e) => setNewQuotation({ ...newQuotation, paymentPercentage2: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleCreateQuotation}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Quotation
            </button>
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title="Quotation Preview"
        size="lg"
      >
        {previewQuotation && (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Damsole Technologies</h3>
              <p className="text-gray-600">Quotation #{previewQuotation.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Customer</p>
              <p className="font-medium text-gray-900">{previewQuotation.leadName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Elevator Type</p>
                <p className="font-medium text-gray-900">{previewQuotation.elevatorType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Floors</p>
                <p className="font-medium text-gray-900">{previewQuotation.floors}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Capacity</p>
                <p className="font-medium text-gray-900">{previewQuotation.capacity} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Speed</p>
                <p className="font-medium text-gray-900">{previewQuotation.speed} m/s</p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Price</span>
                  <span className="font-medium">₹{previewQuotation.basePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Installation Cost</span>
                  <span className="font-medium">₹{previewQuotation.installationCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">₹{previewQuotation.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                  <span className="text-lg font-bold text-blue-600">
                    ₹{previewQuotation.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Valid until: {previewQuotation.validUntil}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
