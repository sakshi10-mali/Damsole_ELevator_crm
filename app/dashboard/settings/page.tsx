"use client";

import { useState } from "react";
import { IoSave, IoNotifications, IoLockClosed, IoColorPalette } from "react-icons/io5";
import { toast } from "@/components/Toast";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: "Damsole Technologies",
    email: "info@damsoletechnologies.com",
    phone: "+91 98765 43210",
    address: "123 Business Street, Mumbai, Maharashtra",
    notifications: {
      email: true,
      sms: false,
      whatsapp: true,
    },
    theme: "light",
  });

  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Settings</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage your account and system preferences</p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Company Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            <IoColorPalette className="w-4 h-4 sm:w-5 sm:h-5" />
            Company Information
          </h2>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            <IoNotifications className="w-4 h-4 sm:w-5 sm:h-5" />
            Notification Preferences
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive updates via email</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, email: e.target.checked },
                  })
                }
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <div>
                <p className="font-medium text-gray-900">SMS Notifications</p>
                <p className="text-sm text-gray-500">Receive updates via SMS</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.sms}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, sms: e.target.checked },
                  })
                }
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <div>
                <p className="font-medium text-gray-900">WhatsApp Notifications</p>
                <p className="text-sm text-gray-500">Receive updates via WhatsApp</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.whatsapp}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, whatsapp: e.target.checked },
                  })
                }
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* Theme */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <IoColorPalette className="w-5 h-5" />
            Appearance
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
            >
              <option value="light" className={settings.theme === "light" ? "bg-primary-600 text-white font-semibold" : ""}>Light</option>
              <option value="dark" className={settings.theme === "dark" ? "bg-primary-600 text-white font-semibold" : ""}>Dark</option>
              <option value="auto" className={settings.theme === "auto" ? "bg-primary-600 text-white font-semibold" : ""}>Auto</option>
            </select>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <IoSave className="w-5 h-5" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

