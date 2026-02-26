"use client";

import { useState } from "react";

interface ConditionalSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: T[];
  requiredOption?: T; // The option that must be selected first
  enabledOptions?: T[]; // Options that become enabled after required option is selected
  isOptionEnabled?: (option: T, currentValue: T) => boolean; // Custom enable logic
  disabled?: boolean;
  className?: string;
  errorMessage?: string;
  placeholder?: string;
  getOptionLabel?: (option: T) => string;
}

export default function ConditionalSelect<T extends string>({
  value,
  onChange,
  options,
  requiredOption,
  enabledOptions,
  isOptionEnabled,
  disabled = false,
  className = "",
  errorMessage,
  placeholder = "Select an option",
  getOptionLabel = (opt) => opt,
}: ConditionalSelectProps<T>) {
  const [localError, setLocalError] = useState<string>("");

  const checkIfOptionEnabled = (option: T): boolean => {
    // If disabled prop is set, disable all
    if (disabled) return false;

    // If no required option, all options are enabled
    if (!requiredOption) return true;

    // If required option is selected, check enabled options
    if (value === requiredOption) {
      if (enabledOptions) {
        return enabledOptions.includes(option);
      }
      // If no enabledOptions specified, enable all after required option
      return true;
    }

    // If required option is not selected yet
    // Only allow selecting the required option
    if (option === requiredOption) {
      return true;
    }

    // Use custom logic if provided
    if (isOptionEnabled) {
      return isOptionEnabled(option, value);
    }

    // Default: disable all except required option
    return false;
  };

  const handleChange = (newValue: T) => {
    // Validate selection
    if (!checkIfOptionEnabled(newValue)) {
      const error = requiredOption
        ? `Please select "${getOptionLabel(requiredOption)}" first before selecting other options.`
        : "This option is not available at this time.";
      setLocalError(error);
      
      // Clear error after 5 seconds
      setTimeout(() => setLocalError(""), 5000);
      return;
    }

    // Clear any errors
    setLocalError("");
    onChange(newValue);
  };

  const displayError = errorMessage || localError;

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value as T)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 border-2 rounded-lg 
          focus:outline-none focus:ring-2 transition-all bg-white
          ${displayError 
            ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
            : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          }
          ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
          ${className}
        `}
      >
        {!value && <option value="">{placeholder}</option>}
        {options.map((option) => {
          const isEnabled = checkIfOptionEnabled(option);
          const isSelected = value === option;
          
          return (
            <option
              key={option}
              value={option}
              disabled={!isEnabled}
              className={`
                ${isSelected ? "bg-blue-600 text-white font-semibold" : ""}
                ${!isEnabled ? "text-gray-400 bg-gray-100" : ""}
              `}
            >
              {getOptionLabel(option)} {!isEnabled && !isSelected ? "(Locked)" : ""}
            </option>
          );
        })}
      </select>
      
      {displayError && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 z-10 whitespace-nowrap max-w-xs shadow-sm">
          {displayError}
        </div>
      )}
    </div>
  );
}

