"use client";

import { useState, useEffect } from "react";

interface DeliverySlot {
  id: string;
  label: string;
}

interface DeliverySettingsProps {
  storeId: string;
  initialEnabled?: boolean;
  initialType?: string;
  initialSlots?: string[];
}

const PRESET_TIME_SLOTS = [
  "9AM-12PM",
  "12PM-3PM",
  "3PM-6PM",
  "6PM-9PM",
  "Morning (9AM-12PM)",
  "Afternoon (12PM-3PM)",
  "Evening (3PM-6PM)",
  "Night (6PM-9PM)",
];

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function DeliverySettings({
  storeId,
  initialEnabled = false,
  initialType = "none",
  initialSlots = [],
}: DeliverySettingsProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [deliveryType, setDeliveryType] = useState(initialType);
  const [selectedSlots, setSelectedSlots] = useState<string[]>(initialSlots);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [customSlot, setCustomSlot] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setEnabled(initialEnabled);
    setDeliveryType(initialType);
    setSelectedSlots(initialSlots);

    // Parse day_and_time format: "Monday|9AM-12PM", "Friday|6PM-9PM"
    if (initialType === "day_and_time" && initialSlots.length > 0) {
      const days = new Set<string>();
      const times = new Set<string>();
      initialSlots.forEach((slot) => {
        const [day, time] = slot.split("|");
        if (day && time) {
          days.add(day);
          times.add(time);
        }
      });
      setSelectedDays(Array.from(days));
      setSelectedTimes(Array.from(times));
    }
  }, [initialEnabled, initialType, initialSlots]);

  const handleDeliveryTypeChange = (newType: string) => {
    setDeliveryType(newType);
    // Clear all selections when changing delivery type
    setSelectedSlots([]);
    setSelectedDays([]);
    setSelectedTimes([]);
  };

  const handleToggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleToggleTime = (time: string) => {
    setSelectedTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const handleToggleSlot = (slot: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handleAddCustomSlot = () => {
    if (customSlot.trim() && !selectedSlots.includes(customSlot.trim())) {
      setSelectedSlots([...selectedSlots, customSlot.trim()]);
      setCustomSlot("");
    }
  };

  const handleRemoveSlot = (slot: string) => {
    setSelectedSlots(selectedSlots.filter((s) => s !== slot));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");

    // Prepare slots based on delivery type
    let slotsToSave: string[] = [];
    if (enabled) {
      if (deliveryType === "day_and_time") {
        // Combine days and times: "Monday|9AM-12PM", "Monday|6PM-9PM", "Friday|9AM-12PM"
        slotsToSave = selectedDays.flatMap((day) =>
          selectedTimes.map((time) => `${day}|${time}`)
        );
      } else {
        slotsToSave = selectedSlots;
      }
    }

    try {
      const response = await fetch("/api/store/update-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          deliveryEnabled: enabled,
          deliveryType: enabled ? deliveryType : "none",
          deliverySlots: slotsToSave,
        }),
      });

      if (response.ok) {
        setMessage("✅ Delivery settings saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const error = await response.json();
        setMessage(`❌ Error: ${error.error || "Failed to save"}`);
      }
    } catch (error) {
      console.error("Error saving delivery settings:", error);
      setMessage("❌ Failed to save delivery settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
        🚚 Delivery Scheduling
      </h3>

      {/* Enable/Disable Toggle */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <span className="font-medium text-gray-900">
              Enable Delivery Scheduling
            </span>
            <p className="text-sm text-gray-600">
              Let customers choose delivery time/day
            </p>
          </div>
        </label>
      </div>

      {enabled && (
        <div className="space-y-6">
          {/* Delivery Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Type
            </label>
            {(selectedSlots.length > 0 ||
              selectedDays.length > 0 ||
              selectedTimes.length > 0) && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                ℹ️ Changing delivery type will clear your current selections
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <button
                onClick={() => handleDeliveryTypeChange("day_and_time")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  deliveryType === "day_and_time"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-2">📅⏰</div>
                <div className="font-medium text-gray-900">Day + Time</div>
                <div className="text-xs text-gray-600 mt-1">
                  Mon 10PM, Tue 10AM
                </div>
              </button>

              <button
                onClick={() => handleDeliveryTypeChange("time_slots")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  deliveryType === "time_slots"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-2">⏰</div>
                <div className="font-medium text-gray-900">Time Slots</div>
                <div className="text-xs text-gray-600 mt-1">
                  9AM-12PM, 2PM-5PM
                </div>
              </button>

              <button
                onClick={() => handleDeliveryTypeChange("days")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  deliveryType === "days"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-2">📅</div>
                <div className="font-medium text-gray-900">Delivery Days</div>
                <div className="text-xs text-gray-600 mt-1">Mon, Wed, Fri</div>
              </button>

              <button
                onClick={() => handleDeliveryTypeChange("immediate")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  deliveryType === "immediate"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-2">⚡</div>
                <div className="font-medium text-gray-900">Immediate</div>
                <div className="text-xs text-gray-600 mt-1">ASAP delivery</div>
              </button>
            </div>
          </div>

          {/* Time Slots Configuration */}
          {deliveryType === "time_slots" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Available Time Slots
              </label>

              {/* Preset Slots */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                {PRESET_TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => handleToggleSlot(slot)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedSlots.includes(slot)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              {/* Custom Slot */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSlot}
                  onChange={(e) => setCustomSlot(e.target.value)}
                  placeholder="Custom slot (e.g., 7PM-10PM)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  onKeyPress={(e) => e.key === "Enter" && handleAddCustomSlot()}
                />
                <button
                  onClick={handleAddCustomSlot}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Days Configuration */}
          {deliveryType === "days" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Available Delivery Days
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    onClick={() => handleToggleSlot(day)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedSlots.includes(day)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day + Time Configuration */}
          {deliveryType === "day_and_time" && (
            <div className="space-y-6">
              {/* Select Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Delivery Days
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day}
                      onClick={() => handleToggleDay(day)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedDays.includes(day)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Time Slots */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Time Slots
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {PRESET_TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => handleToggleTime(slot)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedTimes.includes(slot)
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Combinations */}
              {selectedDays.length > 0 && selectedTimes.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    📋 Customer will see these options ({selectedDays.length} ×{" "}
                    {selectedTimes.length} ={" "}
                    {selectedDays.length * selectedTimes.length} combinations):
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedDays.slice(0, 2).map((day) =>
                      selectedTimes.slice(0, 2).map((time) => (
                        <span
                          key={`${day}-${time}`}
                          className="px-2 py-1 bg-white rounded text-xs text-gray-700 border border-blue-200"
                        >
                          {day}, {time}
                        </span>
                      ))
                    )}
                    {selectedDays.length * selectedTimes.length > 4 && (
                      <span className="px-2 py-1 text-xs text-gray-600">
                        +{selectedDays.length * selectedTimes.length - 4}{" "}
                        more...
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Immediate Delivery Info */}
          {deliveryType === "immediate" && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="font-medium text-gray-900">
                    Immediate Delivery Mode
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Orders will be delivered as soon as possible. Customers
                    won't need to select a specific time or day.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Selected Slots Display */}
          {selectedSlots.length > 0 && deliveryType !== "immediate" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected {deliveryType === "days" ? "Days" : "Slots"} (
                {selectedSlots.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedSlots.map((slot) => (
                  <span
                    key={slot}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm"
                  >
                    {slot}
                    <button
                      onClick={() => handleRemoveSlot(slot)}
                      className="hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm ${
            message.startsWith("✅")
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      {/* Save Button */}
      <div className="mt-6">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSaving ? "Saving..." : "Save Delivery Settings"}
        </button>
      </div>
    </div>
  );
}
