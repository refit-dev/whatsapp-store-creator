import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

interface DashboardNavProps {
  storeHandle?: string;
}

export function DashboardNav({ storeHandle }: DashboardNavProps) {
  return (
    <nav className="w-64 bg-white border-r min-h-screen p-4">
      <div className="space-y-2">
        <NavLink href="/dashboard">Overview</NavLink>
        <NavLink href="/dashboard/store">Store Settings</NavLink>
        <NavLink href="/dashboard/products">Products</NavLink>
        <NavLink href="/dashboard/orders">Orders</NavLink>

        {storeHandle && (
          <div className="border-t border-gray-200 pt-2 mt-4">
            <NavLink href={`/${storeHandle}`} external>
              View My Store
            </NavLink>
          </div>
        )}
      </div>

      {/* Footer section */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <div className="space-y-2">
          <NavLink href="/dashboard/contact-us">Contact Us</NavLink>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const linkProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Link
      href={href}
      {...linkProps}
      className="block px-4 py-2 rounded hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors"
    >
      {children}
      {external && <span className="ml-1 text-xs text-gray-400">↗</span>}
    </Link>
  );
}
