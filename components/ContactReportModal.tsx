"use client";

import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { toast } from "./Toast";
import { IoCheckmarkCircle, IoClose, IoSave } from "react-icons/io5";

interface ContactReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    leadName?: string;
}

export default function ContactReportModal({
    isOpen,
    onClose,
    onSubmit,
    leadName,
}: ContactReportModalProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        // CONTACT CONFIRMATION
        status: "", // "New Lead" or "Lead Contacted" logic handled by parent, here capture "No" -> stay New Lead
        contactSuccessful: "", // "Yes" or "No"

        // 3. CONTACT DETAILS
        contactMode: "",
        contactDateTime: "",
        spokenTo: "",

        // 4. PROPERTY & REQUIREMENT
        propertyType: "",
        totalFloors: "",
        primaryUsage: "",

        // 5. SITE READINESS
        pitAvailable: "",
        pitDepth: "",
        shaftAvailable: "",
        shaftType: "",
        shaftSize: "",
        machineRoom: "",

        // 6. ELEVATOR PREFERENCE
        elevatorType: "",
        brandExpectation: "",

        // 7. CLIENT INTENT & COMMERCIAL
        interestLevel: "",
        budgetDiscussion: "",
        decisionTimeline: "",

        // 8. NEXT ACTION
        nextStep: "",
        expectedMeetingTimeline: "",
        nextFollowUpDate: "",

        // 9. SALES OWNER
        salesExecutiveName: "",
        remarks: "",
    });

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            // Initialize date/time to now
            const now = new Date();
            const isoString = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

            setFormData(prev => ({
                ...prev,
                contactDateTime: isoString,
                contactSuccessful: "Yes" // Default to Yes ?
            }));
        }
    }, [isOpen]);

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.contactSuccessful) {
            toast.error("Please confirm if contact was successful.");
            return;
        }

        if (formData.contactSuccessful === "No") {
            // If No, just close/alert but maybe still save as a note? 
            // Requirement: status must remain "New Lead"
            // We will pass this info to parent
        } else {
            // Mandatory fields check if Yes
            if (!formData.contactMode) return toast.error("Contact Mode is required");
            if (!formData.salesExecutiveName) return toast.error("Sales Executive Name is required");
            if (!formData.nextStep) return toast.error("Next Step is required");
            if (!formData.pitAvailable) return toast.error("Pit Availability is required");
        }

        setLoading(true);
        try {
            await onSubmit(formData);
            // onClose(); // Parent handles close
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit report");
        } finally {
            setLoading(false);
        }
    };

    // Helper to render radio group
    const renderRadioGroup = (
        label: string,
        field: keyof typeof formData,
        options: string[],
        isRow = true
    ) => (
        <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
            <div className={`flex ${isRow ? 'flex-row flex-wrap gap-4' : 'flex-col gap-2'}`}>
                {options.map((option) => (
                    <label key={option} className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name={field}
                            value={option}
                            checked={formData[field] === option}
                            onChange={() => handleChange(field, option)}
                            className="form-radio h-4 w-4 text-accent-600 focus:ring-accent-500"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                    </label>
                ))}
            </div>
        </div>
    );

    // Helper to render radio group for detailed mapped options (display vs value)
    const renderDetailedRadioGroup = (
        label: string,
        field: keyof typeof formData,
        options: { label: string, value: string }[],
        isRow = true
    ) => (
        <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
            <div className={`flex ${isRow ? 'flex-row flex-wrap gap-4' : 'flex-col gap-2'}`}>
                {options.map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name={field}
                            value={option.value}
                            checked={formData[field] === option.value}
                            onChange={() => handleChange(field, option.value)}
                            className="form-radio h-4 w-4 text-accent-600 focus:ring-accent-500"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={leadName ? `Contact Report: ${leadName}` : "Contact Report"}
            size="xl"
        >
            <div className="space-y-6">
                {/* 2. CONTACT CONFIRMATION */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded mr-2">MANDATORY</span>
                        Contact Confirmation
                    </h3>
                    {renderRadioGroup("Was the lead successfully contacted?", "contactSuccessful", ["Yes", "No"])}

                    {formData.contactSuccessful === "No" && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm font-medium border border-red-200 animate-pulse">
                            ❗ If “No”, status must remain “New Lead”. You can save this attempt but stage will not advance.
                        </div>
                    )}
                </div>

                {formData.contactSuccessful === "Yes" && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 3. CONTACT DETAILS */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-base font-bold text-blue-700 mb-4 border-b pb-2">Contact Details</h3>
                                {renderRadioGroup("Contact Mode", "contactMode", ["Call", "WhatsApp", "Email", "Walk-in"])}

                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date & Time of Contact</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.contactDateTime}
                                        onChange={(e) => handleChange("contactDateTime", e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                                    />
                                </div>

                                {renderRadioGroup("Spoken To", "spokenTo", ["Client", "Family Member", "Architect", "Builder", "Caretaker"])}
                            </div>

                            {/* 4. PROPERTY DETAILS */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-base font-bold text-blue-700 mb-4 border-b pb-2">Property & Requirement</h3>
                                {renderRadioGroup("Property Type", "propertyType", ["Independent Villa", "Duplex", "Apartment", "Commercial"])}
                                {renderRadioGroup("Total Floors Required", "totalFloors", ["G+1", "G+2", "G+3", "G+4"])}
                                {renderDetailedRadioGroup("Primary Usage Purpose", "primaryUsage", [
                                    { label: "Senior Citizen", value: "Senior Citizen" },
                                    { label: "Family Convenience", value: "Family Convenience" },
                                    { label: "Luxury / Premium", value: "Luxury / Premium" },
                                    { label: "Medical / Accessibility", value: "Medical / Accessibility" },
                                ], false)}
                            </div>
                        </div>

                        {/* 5. SITE READINESS */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-base font-bold text-blue-700 mb-4 border-b pb-2">Site Readiness Details (Very Important)</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Pit */}
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Pit Availability</h4>
                                    {renderRadioGroup("Pit Available?", "pitAvailable", ["Yes", "No"])}
                                    {formData.pitAvailable === "Yes" && renderDetailedRadioGroup("Pit Depth", "pitDepth", [
                                        { label: "< 300 mm", value: "< 300 mm" },
                                        { label: "300–600 mm", value: "300–600 mm" },
                                        { label: "600–1000 mm", value: "600–1000 mm" },
                                        { label: "Not Sure", value: "Not Sure" },
                                    ], false)}
                                </div>

                                {/* Shaft */}
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Shaft Availability</h4>
                                    {renderRadioGroup("Shaft Available?", "shaftAvailable", ["Yes", "No", "Planned"])}

                                    {(formData.shaftAvailable === "Yes" || formData.shaftAvailable === "Planned") && (
                                        <>
                                            {renderRadioGroup("Shaft Type", "shaftType", ["RCC", "Block Work", "Steel Structure", "Not Sure"], false)}
                                            <div className="mb-4">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Approx Shaft Size (L x W mm)</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. 1500 x 1500"
                                                    value={formData.shaftSize}
                                                    onChange={(e) => handleChange("shaftSize", e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Machine Room */}
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Machine Room</h4>
                                    {renderDetailedRadioGroup("Machine Room Available?", "machineRoom", [
                                        { label: "Yes", value: "Yes" },
                                        { label: "No (MRL preferred)", value: "No (MRL preferred)" },
                                        { label: "Can be constructed", value: "Can be constructed" },
                                        { label: "Not Sure", value: "Not Sure" },
                                    ], false)}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 6. ELEVATOR PREFERENCE */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-base font-bold text-blue-700 mb-4 border-b pb-2">Elevator Preference</h3>
                                {renderRadioGroup("Preferred Elevator Type", "elevatorType", ["Traction (MRL)", "Hydraulic", "Pneumatic", "Not Decided"])}
                                {renderRadioGroup("Brand Expectation", "brandExpectation", ["Standard", "Premium", "Luxury"])}
                            </div>

                            {/* 7. CLIENT INTENT */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-base font-bold text-blue-700 mb-4 border-b pb-2">Client Intent & Commercial</h3>
                                {renderRadioGroup("Interest Level", "interestLevel", ["High", "Medium", "Low"])}
                                {renderRadioGroup("Budget Discussion", "budgetDiscussion", ["Not Discussed", "₹7-10L", "₹10–15L", "₹15–20L", "₹20L+"], false)}
                                {renderRadioGroup("Decision Timeline", "decisionTimeline", ["Immediate", "1–3 Months", "3–6 Months"])}
                            </div>
                        </div>

                        {/* 8. NEXT ACTION */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm border-l-4 border-l-blue-600">
                            <h3 className="text-base font-bold text-blue-700 mb-4 border-b pb-2 flex items-center">
                                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded mr-2">MANDATORY</span>
                                Next Action
                            </h3>
                            {renderRadioGroup("Next Step Identified", "nextStep", ["Meeting to be Scheduled", "Site Visit Required", "Send Brochure", "Follow-up Call"])}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Meeting / Visit Timeline</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Next Week"
                                        value={formData.expectedMeetingTimeline}
                                        onChange={(e) => handleChange("expectedMeetingTimeline", e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Next Follow-up Date</label>
                                    <input
                                        type="date"
                                        value={formData.nextFollowUpDate}
                                        onChange={(e) => handleChange("nextFollowUpDate", e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 9. SALES OWNER */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-base font-bold text-blue-700 mb-4 border-b pb-2">Sales Owner Confirmation</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Sales Executive Name</label>
                                <input
                                    type="text"
                                    value={formData.salesExecutiveName}
                                    onChange={(e) => handleChange("salesExecutiveName", e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks / Notes</label>
                                <textarea
                                    value={formData.remarks}
                                    onChange={(e) => handleChange("remarks", e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-accent-500 focus:border-accent-500 min-h-[100px]"
                                    placeholder="Any additional observations..."
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* FOOTER ACTIONS */}
                <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2.5 text-white bg-accent-600 hover:bg-accent-700 rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg shadow-accent-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <IoCheckmarkCircle className="w-5 h-5" />
                                Confirm & Save Report
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
