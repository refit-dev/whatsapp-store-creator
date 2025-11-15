"use client";

import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import { useState } from "react";

interface DashboardNavProps {
  storeHandle?: string;
}

export function DashboardNav({ storeHandle }: DashboardNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile header bar */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Navigation sidebar */}
      <nav
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r min-h-screen p-4 transform transition-transform duration-300 ease-in-out
        ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }
      `}
      >
        {/* Mobile close button */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-2">
          <NavLink href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
            <span className="mr-3">📊</span>
            Overview
          </NavLink>
          <NavLink
            href="/dashboard/store"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="mr-3">⚙️</span>
            Store Settings
          </NavLink>
          <NavLink
            href="/dashboard/products"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="mr-3">🛍️</span>
            Products
          </NavLink>
          <NavLink
            href="/dashboard/orders"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="mr-3">📦</span>
            Orders
          </NavLink>

          {storeHandle && (
            <div className="border-t border-gray-200 pt-2 mt-4">
              <NavLink
                href={`/${storeHandle}`}
                external
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="mr-3">👀</span>
                View My Store
              </NavLink>
            </div>
          )}
        </div>

        {/* Footer section */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <div className="space-y-2">
            <NavLink
              href="/dashboard/contact-us"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="mr-3">💬</span>
              Contact Us
            </NavLink>
            <div className="px-2 py-2">
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

function NavLink({
  href,
  children,
  external = false,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  onClick?: () => void;
}) {
  const linkProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Link
      href={href}
      {...linkProps}
      onClick={onClick}
      className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors touch-target"
    >
      {children}
      {external && <span className="ml-1 text-xs text-gray-400">↗</span>}
    </Link>
  );
}
