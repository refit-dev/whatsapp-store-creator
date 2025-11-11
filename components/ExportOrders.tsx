"use client";

import { useState } from "react";
import { toLocaleString } from "@/lib/currency";

interface Order {
  id: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_address: string | null;
  total_cents: number;
  status: string;
  created_at: string;
  items: Array<{
    title: string;
    qty: number;
    priceCents: number;
  }>;
}

interface ExportOrdersProps {
  orders: Order[];
  currency: string;
  storeName: string;
}

export function ExportOrders({
  orders,
  currency,
  storeName,
}: ExportOrdersProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [reportType, setReportType] = useState<"daily" | "monthly">("monthly");

  const generateCSV = (ordersToExport: Order[]) => {
    const headers = [
      "Order Date",
      "Order Time",
      "Customer Name",
      "Phone",
      "Address",
      "Products",
      "Quantity",
      "Total Amount",
      "Status",
    ];

    const rows = ordersToExport.map((order) => {
      const date = new Date(order.created_at);
      const products =
        order.items?.map((item) => item.title).join("; ") || "N/A";
      const quantities =
        order.items?.map((item) => item.qty).join("; ") || "N/A";

      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        order.buyer_name,
        order.buyer_phone,
        order.buyer_address || "N/A",
        products,
        quantities,
        (order.total_cents / 100).toFixed(2),
        order.status,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    return csvContent;
  };

  const generateHTML = (ordersToExport: Order[], title: string) => {
    const totalRevenue = ordersToExport.reduce(
      (sum, o) => sum + (o.total_cents || 0),
      0
    );
    const paidOrders = ordersToExport.filter((o) => o.status === "paid").length;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title} - ${storeName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      margin: 0;
      padding: 40px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1a1a1a;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 15px;
      margin-bottom: 30px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 10px;
    }
    .summary-card h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .summary-card p {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background: #3b82f6;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:hover {
      background: #f9fafb;
    }
    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-paid {
      background: #d1fae5;
      color: #065f46;
    }
    .status-created {
      background: #dbeafe;
      color: #1e40af;
    }
    .status-cancelled {
      background: #fee2e2;
      color: #991b1b;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    @media print {
      body {
        padding: 0;
        background: white;
      }
      .container {
        box-shadow: none;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 ${title}</h1>
    <p style="color: #6b7280; margin-bottom: 30px;">
      Generated on ${new Date().toLocaleString()} | ${storeName}
    </p>

    <div class="summary">
      <div class="summary-card">
        <h3>Total Orders</h3>
        <p>${ordersToExport.length}</p>
      </div>
      <div class="summary-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
        <h3>Paid Orders</h3>
        <p>${paidOrders}</p>
      </div>
      <div class="summary-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
        <h3>Total Revenue</h3>
        <p>${toLocaleString(totalRevenue, currency)}</p>
      </div>
      <div class="summary-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
        <h3>Avg Order Value</h3>
        <p>${toLocaleString(
          totalRevenue / ordersToExport.length || 0,
          currency
        )}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Date & Time</th>
          <th>Customer</th>
          <th>Products</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${ordersToExport
          .map(
            (order) => `
          <tr>
            <td>
              <strong>${new Date(
                order.created_at
              ).toLocaleDateString()}</strong><br>
              <small style="color: #6b7280;">${new Date(
                order.created_at
              ).toLocaleTimeString()}</small>
            </td>
            <td>
              <strong>${order.buyer_name}</strong><br>
              <small style="color: #6b7280;">${order.buyer_phone}</small><br>
              <small style="color: #9ca3af;">${
                order.buyer_address || "N/A"
              }</small>
            </td>
            <td>
              ${
                order.items
                  ?.map((item) => `${item.qty}x ${item.title}`)
                  .join("<br>") || "N/A"
              }
            </td>
            <td><strong>${toLocaleString(
              order.total_cents,
              currency
            )}</strong></td>
            <td>
              <span class="status status-${
                order.status
              }">${order.status.toUpperCase()}</span>
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <div class="footer">
      <p><strong>${storeName}</strong></p>
      <p>This report was automatically generated by your store management system</p>
    </div>
  </div>
</body>
</html>
    `;
  };

  const downloadCSV = () => {
    setIsExporting(true);
    try {
      const ordersToExport = filterOrdersByType(reportType);
      const csv = generateCSV(ordersToExport);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${storeName.replace(/\s+/g, "_")}_orders_${reportType}_${
          new Date().toISOString().split("T")[0]
        }.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export CSV. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadPDF = () => {
    setIsExporting(true);
    try {
      const ordersToExport = filterOrdersByType(reportType);
      const title =
        reportType === "daily"
          ? "Daily Orders Report"
          : "Monthly Orders Report";
      const html = generateHTML(ordersToExport, title);

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();

        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            setIsExporting(false);
          }, 250);
        };
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again.");
      setIsExporting(false);
    }
  };

  const filterOrdersByType = (type: "daily" | "monthly"): Order[] => {
    const now = new Date();
    const cutoffDate = new Date();

    if (type === "daily") {
      cutoffDate.setDate(now.getDate() - 1);
    } else {
      cutoffDate.setMonth(now.getMonth() - 1);
    }

    return orders.filter((order) => new Date(order.created_at) >= cutoffDate);
  };

  const previewReport = () => {
    const ordersToExport = filterOrdersByType(reportType);
    const title =
      reportType === "daily" ? "Daily Orders Report" : "Monthly Orders Report";
    const html = generateHTML(ordersToExport, title);

    const previewWindow = window.open("", "_blank");
    if (previewWindow) {
      previewWindow.document.write(html);
      previewWindow.document.close();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Report Type Selector - Compact */}
      <div className="relative">
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value as "daily" | "monthly")}
          className="pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none cursor-pointer"
        >
          <option value="daily">📅 Last 24h</option>
          <option value="monthly">📆 Last 30d</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Export Buttons - Compact */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={downloadCSV}
          disabled={isExporting || orders.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          title="Download as Excel CSV"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="hidden sm:inline">Excel</span>
        </button>

        <button
          onClick={downloadPDF}
          disabled={isExporting || orders.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          title="Print as PDF"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          <span className="hidden sm:inline">PDF</span>
        </button>

        <button
          onClick={previewReport}
          disabled={orders.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          title="Preview report"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span className="hidden sm:inline">Preview</span>
        </button>
      </div>
    </div>
  );
}
