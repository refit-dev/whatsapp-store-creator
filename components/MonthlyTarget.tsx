"use client";

import { useState } from "react";
import { toLocaleString } from "@/lib/currency";

interface MonthlyTargetProps {
  storeId: string;
  initialTarget: number; // in cents
  currency: string;
  currentRevenue: number; // in cents for current month
}

export function MonthlyTarget({
  storeId,
  initialTarget,
  currency,
  currentRevenue,
}: MonthlyTargetProps) {
  const [target, setTarget] = useState(initialTarget / 100); // Convert to currency units
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tempTarget, setTempTarget] = useState(initialTarget / 100);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/store/update-target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          targetCents: Math.round(tempTarget * 100),
        }),
      });

      if (response.ok) {
        setTarget(tempTarget);
        setIsEditing(false);
      } else {
        alert("Failed to update target. Please try again.");
      }
    } catch (error) {
      console.error("Error updating target:", error);
      alert("Failed to update target. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempTarget(target);
    setIsEditing(false);
  };

  const achievementPercentage =
    target > 0 ? Math.round((currentRevenue / (target * 100)) * 100) : 0;

  const isAchieved = achievementPercentage >= 100;

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md p-4 md:p-6 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <h3 className="text-base md:text-lg font-semibold">Monthly Target</h3>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs md:text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs md:text-sm mb-2 opacity-90">
              Set Monthly Target
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={tempTarget}
                onChange={(e) => setTempTarget(parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 rounded-lg text-gray-900 text-sm md:text-base focus:ring-2 focus:ring-white/50"
                placeholder="Enter target amount"
                min="0"
                step="100"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs md:text-sm opacity-90 mb-1">Target</p>
              <p className="text-xl md:text-2xl font-bold">
                {target > 0
                  ? toLocaleString(target * 100, currency)
                  : "Not Set"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs md:text-sm opacity-90 mb-1">Achieved</p>
              <p className="text-xl md:text-2xl font-bold">
                {toLocaleString(currentRevenue, currency)}
              </p>
            </div>
          </div>

          {target > 0 && (
            <>
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-xs md:text-sm mb-2">
                  <span className="opacity-90">Progress</span>
                  <span className="font-bold">
                    {achievementPercentage}%{isAchieved && " 🎉"}
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      isAchieved
                        ? "bg-green-400"
                        : achievementPercentage >= 75
                        ? "bg-yellow-400"
                        : "bg-white"
                    }`}
                    style={{
                      width: `${Math.min(achievementPercentage, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Achievement Status */}
              <div
                className={`text-center py-2 rounded-lg ${
                  isAchieved ? "bg-green-500/30" : "bg-white/10"
                }`}
              >
                <p className="text-xs md:text-sm font-medium">
                  {isAchieved ? (
                    <>🎊 Target Achieved! Congratulations!</>
                  ) : (
                    <>
                      {toLocaleString(target * 100 - currentRevenue, currency)}{" "}
                      more to reach target
                    </>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
