import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 bg-navy-card border-r border-navy-light flex flex-col fixed inset-y-0 left-0">
        <div className="p-5 border-b border-navy-light">
          <p className="text-gold font-bold text-sm tracking-wide uppercase">
            American Stage
          </p>
          <p className="text-gray-400 text-xs tracking-widest uppercase mt-0.5">
            Admin
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLink href="/admin" exact>
            Dashboard
          </NavLink>
          <NavLink href="/admin/show">Show Setup</NavLink>
          <NavLink href="/admin/dates">Manage Dates</NavLink>
          <NavLink href="/admin/bookings">Bookings</NavLink>
        </nav>
        <div className="p-4 border-t border-navy-light">
          <p className="text-gray-500 text-xs mb-2 truncate">{session.user?.email}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button
              type="submit"
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="ml-56 flex-1 min-h-screen">
        {children}
      </div>
    </div>
  );
}

function NavLink({
  href,
  exact,
  children,
}: {
  href: string;
  exact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-navy-light hover:text-white transition-colors"
    >
      {children}
    </Link>
  );
}
