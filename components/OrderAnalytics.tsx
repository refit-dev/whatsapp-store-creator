"use client";

import { useEffect, useMemo, useState } from "react";
import { toLocaleString } from "@/lib/currency";
import { MonthlyTarget } from "./MonthlyTarget";

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

interface OrderAnalyticsProps {
  orders: Order[];
  currency: string;
  storeId?: string;
  monthlyTargetCents?: number;
}

export function OrderAnalytics({
  orders,
  currency,
  storeId,
  monthlyTargetCents = 0,
}: OrderAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month" | "all">(
    "month"
  );
  const [cachedAnalytics, setCachedAnalytics] = useState<
    ReturnType<typeof buildAnalytics> | null
  >(null);
  const [cachedMonthlyRevenue, setCachedMonthlyRevenue] = useState<
    number | null
  >(null);

  const cacheKey = `order-analytics-${storeId || "default"}-${timeRange}`;
  const signature = useMemo(() => {
    if (!orders || orders.length === 0) return "empty";
    const latestDate = orders.reduce((max, o) => {
      const t = new Date(o.created_at).getTime();
      return Math.max(max, t);
    }, 0);
    return `${orders.length}-${latestDate}`;
  }, [orders]);

  // Filter orders by time range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();

    switch (timeRange) {
      case "day":
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case "week":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "month":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "all":
        return orders;
    }

    return orders.filter((order) => new Date(order.created_at) >= cutoffDate);
  }, [orders, timeRange]);

  // Calculate monthly revenue (current month only)
  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return orders
      .filter((order) => {
        const isCancelled =
          order.status?.toLowerCase() === "cancelled" ||
          order.status?.toLowerCase() === "canceled";
        const orderDate = new Date(order.created_at);
        return orderDate >= startOfMonth && !isCancelled;
      })
      .reduce((sum, o) => sum + (o.total_cents || 0), 0);
  }, [orders]);

  const analytics = useMemo(
    () => buildAnalytics(filteredOrders, orders),
    [filteredOrders, orders]
  );

  // Cache analytics in sessionStorage to avoid recompute/fetch within TTL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ttlMs = 5 * 60 * 1000; // 5 minutes
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed.signature === signature &&
          Date.now() - parsed.timestamp < ttlMs
        ) {
          setCachedAnalytics(parsed.analytics);
          setCachedMonthlyRevenue(parsed.monthlyRevenue);
          return;
        }
      }
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          signature,
          timestamp: Date.now(),
          analytics,
          monthlyRevenue,
        })
      );
      setCachedAnalytics(null);
      setCachedMonthlyRevenue(null);
    } catch (err) {
      console.warn("Analytics cache skipped:", err);
    }
  }, [analytics, monthlyRevenue, cacheKey, signature]);

  const displayAnalytics = cachedAnalytics ?? analytics;
  const displayMonthlyRevenue = cachedMonthlyRevenue ?? monthlyRevenue;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Time Range Selector */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { value: "day", label: "Last 24h" },
            { value: "week", label: "Last 7 days" },
            { value: "month", label: "Last 30 days" },
            { value: "all", label: "All Time" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                timeRange === option.value
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Target - Only show if storeId is provided */}
      {storeId && (
        <MonthlyTarget
          storeId={storeId}
          initialTarget={monthlyTargetCents}
          currency={currency}
          currentRevenue={displayMonthlyRevenue}
        />
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title="Total Orders"
          value={displayAnalytics.totalOrders}
          icon="📦"
          color="blue"
        />
        <MetricCard
          title="Paid Orders"
          value={displayAnalytics.paidOrders}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="Revenue"
          value={toLocaleString(displayAnalytics.totalRevenue, currency)}
          icon="💰"
          color="purple"
          isCompact
        />
        <MetricCard
          title="Avg Order"
          value={toLocaleString(displayAnalytics.avgOrderValue, currency)}
          icon="📊"
          color="orange"
          isCompact
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Daily Trends */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm md:text-base">
            📈 Last 7 Days Trend
          </h3>
          <div className="space-y-3">
            {displayAnalytics.dailyTrends.map((day, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs md:text-sm mb-1">
                  <span className="text-gray-600">{day.date}</span>
                  <span className="font-semibold text-gray-900">
                    {day.orders} orders
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.max(
                        5,
                        (day.orders /
                          Math.max(
                            ...displayAnalytics.dailyTrends.map(
                              (d) => d.orders
                            )
                          )) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm md:text-base">
            🏆 Top Selling Products
          </h3>
          <div className="space-y-3">
            {displayAnalytics.topProducts.length > 0 ? (
              displayAnalytics.topProducts.map(([product, data], idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium text-gray-900 truncate">
                      {product}
                    </p>
                    <p className="text-xs text-gray-600">{data.qty} sold</p>
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-green-600 ml-2">
                    {toLocaleString(data.revenue, currency)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No product data yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Customer & Location Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Customer Analysis */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm md:text-base">
            👥 Customer Insights
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-xs md:text-sm text-gray-600">
                Unique Customers
              </span>
              <span className="font-semibold text-gray-900 text-sm md:text-base">
                {displayAnalytics.uniqueCustomers}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-xs md:text-sm text-gray-600">
                Repeat Customers
              </span>
              <span className="font-semibold text-gray-900 text-sm md:text-base">
                {displayAnalytics.repeatCustomers}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs md:text-sm text-gray-600">
                Repeat Rate
              </span>
              <span className="font-semibold text-green-600 text-sm md:text-base">
                {displayAnalytics.uniqueCustomers > 0
                  ? Math.round(
                      (displayAnalytics.repeatCustomers /
                        displayAnalytics.uniqueCustomers) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>

        {/* Location Analysis */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm md:text-base">
            📍 Top Locations
          </h3>
          <div className="space-y-3">
            {displayAnalytics.topLocations.length > 0 ? (
              displayAnalytics.topLocations.map(([location, count], idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400 w-6">
                    #{idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs md:text-sm font-medium text-gray-900 capitalize">
                      {location}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full"
                        style={{
                          width: `${
                            (count / displayAnalytics.topLocations[0][1]) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-gray-900">
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No location data yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildAnalytics(filteredOrders: Order[], allOrders: Order[]) {
  const totalOrders = filteredOrders.length;
  const paidOrders = filteredOrders.filter((o) => o.status === "paid").length;
  // Exclude cancelled orders from revenue calculations
  const revenueOrders = filteredOrders.filter((o) => {
    const status = o.status?.toLowerCase();
    return status !== "cancelled" && status !== "canceled";
  });

  const totalRevenue = revenueOrders.reduce(
    (sum, o) => sum + (o.total_cents || 0),
    0
  );
  const avgOrderValue =
    revenueOrders.length > 0 ? totalRevenue / revenueOrders.length : 0;

  // Customer analysis
  const customerMap = new Map<string, number>();
  filteredOrders.forEach((order) => {
    const count = customerMap.get(order.buyer_phone) || 0;
    customerMap.set(order.buyer_phone, count + 1);
  });
  const repeatCustomers = Array.from(customerMap.values()).filter(
    (count) => count > 1
  ).length;

  // Location analysis (extract city from address)
  const locationMap = new Map<string, number>();
  filteredOrders.forEach((order) => {
    if (order.buyer_address) {
      const words = order.buyer_address.split(/[,\s]+/);
      let location = "Other";
      if (words.length > 2) {
        location = words[words.length - 2] || words[words.length - 3] || "Other";
      }

      const count = locationMap.get(location) || 0;
      locationMap.set(location, count + 1);
    }
  });

  const topLocations = Array.from(locationMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Product analysis
  const productMap = new Map<string, { qty: number; revenue: number }>();
  revenueOrders.forEach((order) => {
    order.items?.forEach((item) => {
      const existing = productMap.get(item.title) || { qty: 0, revenue: 0 };
      productMap.set(item.title, {
        qty: existing.qty + item.qty,
        revenue: existing.revenue + item.priceCents * item.qty,
      });
    });
  });

  const topProducts = Array.from(productMap.entries())
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5);

  // Daily trends (last 7 days)
  const dailyTrends = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const dayOrders = allOrders.filter((order) => {
      const status = order.status?.toLowerCase();
      if (status === "cancelled" || status === "canceled") return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= date && orderDate < nextDate;
    });

    dailyTrends.push({
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, o) => sum + (o.total_cents || 0), 0),
    });
  }

  return {
    totalOrders,
    paidOrders,
    totalRevenue,
    avgOrderValue,
    repeatCustomers,
    topLocations,
    topProducts,
    dailyTrends,
    uniqueCustomers: customerMap.size,
  };
}

function MetricCard({
  title,
  value,
  icon,
  color,
  isCompact = false,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: "blue" | "green" | "purple" | "orange";
  isCompact?: boolean;
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg shadow-md p-3 md:p-4 text-white`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs md:text-sm font-medium opacity-90">{title}</h3>
        <span className="text-lg md:text-2xl">{icon}</span>
      </div>
      <p
        className={`${
          isCompact ? "text-lg md:text-xl" : "text-xl md:text-2xl"
        } font-bold truncate`}
      >
        {value}
      </p>
    </div>
  );
}
