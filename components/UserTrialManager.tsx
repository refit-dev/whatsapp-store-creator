"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function UserTrialManager({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail: string;
}) {
  const supabase = createClientComponentClient();
  const [extending, setExtending] = useState(false);
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleExtend() {
    if (!reason.trim()) {
      setMessage({
        type: "error",
        text: "Please provide a reason for extension",
      });
      return;
    }

    setExtending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/extend-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          days,
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to extend trial");
      }

      setMessage({
        type: "success",
        text: `Successfully added ${days} days to trial`,
      });
      setReason("");
      setDays(7);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setExtending(false);
    }
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-semibold mb-4">Extend Trial for {userEmail}</h3>

      {message && (
        <div
          className={`mb-4 p-3 rounded text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Days to Add
          </label>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="7">7 Days</option>
            <option value="14">14 Days</option>
            <option value="30">30 Days</option>
            <option value="60">60 Days</option>
            <option value="90">90 Days</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Compensation for downtime, Active user reward, etc."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <button
          onClick={handleExtend}
          disabled={extending || !reason.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {extending ? "Extending..." : `Add ${days} Days`}
        </button>
      </div>
    </div>
  );
}
