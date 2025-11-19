"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

type TrialSettings = Database["public"]["Tables"]["trial_settings"]["Row"];

export default function TrialSettingsManager() {
  const supabase = createClientComponentClient<Database>();
  const [settings, setSettings] = useState<TrialSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    default_trial_days: 14,
    auto_extend_active_users: false,
    auto_extend_days: 0,
    min_activity_threshold: 5,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data, error } = await supabase
        .from("trial_settings")
        .select("*")
        .single();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setFormData({
          default_trial_days: data.default_trial_days,
          auto_extend_active_users: data.auto_extend_active_users || false,
          auto_extend_days: data.auto_extend_days || 0,
          min_activity_threshold: data.min_activity_threshold || 5,
        });
      }
    } catch (error) {
      console.error("Error loading trial settings:", error);
      setMessage({ type: "error", text: "Failed to load trial settings" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("trial_settings")
        .update({
          ...formData,
          updated_by: user.id,
        })
        .eq("id", settings!.id);

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Trial settings updated successfully",
      });
      loadSettings();
    } catch (error) {
      console.error("Error saving trial settings:", error);
      setMessage({ type: "error", text: "Failed to save trial settings" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-3">
      <h2 className="text-base font-bold mb-2">Global Trial Settings</h2>

      {message && (
        <div
          className={`mb-4 p-4 rounded ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-2">
        {/* Default Trial Days */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">
            Default Trial Period (Days)
          </label>
          <select
            value={formData.default_trial_days}
            onChange={(e) =>
              setFormData({
                ...formData,
                default_trial_days: parseInt(e.target.value),
              })
            }
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="7">7 Days</option>
            <option value="14">14 Days (Recommended)</option>
            <option value="30">30 Days</option>
            <option value="60">60 Days</option>
            <option value="90">90 Days</option>
          </select>
          <p className="mt-0.5 text-xs text-gray-500">
            New users will receive this trial duration by default
          </p>
        </div>

        {/* Auto Extend Settings */}
        <div className="border-t pt-3">
          <label className="flex items-center space-x-2 mb-2">
            <input
              type="checkbox"
              checked={formData.auto_extend_active_users}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  auto_extend_active_users: e.target.checked,
                })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Auto-extend trials for active users
            </span>
          </label>

          {formData.auto_extend_active_users && (
            <div className="ml-6 space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Additional Days to Extend
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={formData.auto_extend_days}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      auto_extend_days: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Automatically add this many days to active users&apos; trials
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Minimum Activity (Orders)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.min_activity_threshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_activity_threshold: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Users must have at least this many orders to qualify for
                  auto-extension
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="border-t pt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            📊 Current Configuration
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• New users get {formData.default_trial_days} days trial</li>
            <li>
              • Auto-extend:{" "}
              {formData.auto_extend_active_users
                ? `Yes (${formData.auto_extend_days} days for ${formData.min_activity_threshold}+ orders)`
                : "Disabled"}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
