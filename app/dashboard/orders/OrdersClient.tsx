"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { OrderAnalytics } from "@/components/OrderAnalytics";
import { ExportOrders } from "@/components/ExportOrders";
import { AllOrdersTable } from "@/components/AllOrdersTable";
import { LogoutButton } from "@/components/LogoutButton";

type Order = {
  id: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_address: string | null;
  buyer_notes: string | null;
  total_cents: number;
  status: string;
  created_at: string;
  payment_provider: string | null;
  payment_id: string | null;
  items: Array<{
    title: string;
    qty: number;
    priceCents: number;
    productId: string;
  }>;
};

type Props = {
  orders: Order[];
  currency: string;
  storeId: string;
  storeName: string;
  monthlyTargetCents: number;
};

const PAGE_SIZES = [25, 50, 100];

export function OrdersClient({
  orders,
  currency,
  storeId,
  storeName,
  monthlyTargetCents,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [dateTo, setDateTo] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [page, setPage] = useState<number>(1);
  const [chartsVisible, setChartsVisible] = useState<boolean>(false);
  const chartsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ref = chartsRef.current;
    if (!ref) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setChartsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, []);

  const handleQuickRange = (days: number) => {
    const to = new Date();
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    setDateFrom(from.toISOString().slice(0, 10));
    setDateTo(to.toISOString().slice(0, 10));
    setPage(1);
  };

  const filteredOrders = useMemo(() => {
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : -Infinity;
    const toTs = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 : Infinity;
    return orders.filter((order) => {
      const created = new Date(order.created_at).getTime();
      if (created < fromTs || created > toTs) return false;

      if (statusFilter === "all") return true;
      if (statusFilter === "paid") return order.status === "paid";
      if (statusFilter === "cancelled") return order.status === "cancelled";
      if (statusFilter === "delivered") return order.status === "delivered";
      if (statusFilter === "pending") {
        return (
          order.status === "created" ||
          order.status === "opened_whatsapp" ||
          order.status === "customer_confirmed"
        );
      }
      return true;
    });
  }, [orders, dateFrom, dateTo, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pagedOrders = filteredOrders.slice(start, end);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-8 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                dY"S Orders & Analytics
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Track orders, analyze performance & export reports
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <Link href="/dashboard" className="px-4 md:px-6 py-2 md:py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm md:text-base">�+? Dashboard</Link>
              <div className="hidden sm:block border-l border-gray-200 pl-2 md:pl-3">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-3 md:gap-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuickRange(1)}
                className="px-3 py-2 text-xs md:text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Today
              </button>
              <button
                onClick={() => handleQuickRange(7)}
                className="px-3 py-2 text-xs md:text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Last 7 days
              </button>
              <button
                onClick={() => handleQuickRange(30)}
                className="px-3 py-2 text-xs md:text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Last 30 days
              </button>
            </div>
          </div>
        </div>

        {/* Analytics & Export */}
        <div className="mb-4 md:mb-6">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">
                  dY"S Analytics & Reports
                </h2>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  Track performance and export data
                </p>
              </div>

              <ExportOrders
                orders={filteredOrders as Order[]}
                currency={currency}
                storeName={storeName}
              />
            </div>

            <div ref={chartsRef}>
              {chartsVisible ? (
                <OrderAnalytics
                  orders={filteredOrders as Order[]}
                  currency={currency}
                  storeId={storeId}
                  monthlyTargetCents={monthlyTargetCents}
                />
              ) : (
                <ChartsSkeleton />
              )}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <AllOrdersTable
          orders={pagedOrders as Order[]}
          currency={currency}
          storeId={storeId}
          totalCount={filteredOrders.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>
    </main>
  );
}

function ChartsSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6 animate-pulse">
      <div className="bg-gray-100 h-10 rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="h-48 bg-gray-100 rounded-lg" />
        <div className="h-48 bg-gray-100 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="h-48 bg-gray-100 rounded-lg" />
        <div className="h-48 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

