import Link from "next/link";

export function DashboardNav() {
  return (
    <nav className="w-64 bg-white border-r min-h-screen p-4">
      <div className="space-y-2">
        <NavLink href="/dashboard">Overview</NavLink>
        <NavLink href="/dashboard/store">Store Settings</NavLink>
        <NavLink href="/dashboard/products">Products</NavLink>
        <NavLink href="/dashboard/orders">Orders</NavLink>
      </div>

      {/* Footer section */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <div className="space-y-2">
          <NavLink href="/dashboard/contact-us">Contact Us</NavLink>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="block px-4 py-2 rounded hover:bg-gray-50">
      {children}
    </Link>
  );
}
