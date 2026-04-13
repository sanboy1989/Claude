import Link from "next/link";
import { getSession } from "@/lib/session";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";

export async function Navbar() {
  const session = await getSession();

  return (
    <nav className="border-b border-neutral-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <CalendarDays className="h-6 w-6" />
            BookIt
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/merchants" className="text-sm text-neutral-600 hover:text-neutral-900">
              Browse
            </Link>

            {session ? (
              <>
                {session.role === "CUSTOMER" && (
                  <Link href="/dashboard" className="text-sm text-neutral-600 hover:text-neutral-900">
                    My Bookings
                  </Link>
                )}
                {session.role === "MERCHANT" && (
                  <Link href="/merchant/dashboard" className="text-sm text-neutral-600 hover:text-neutral-900">
                    Dashboard
                  </Link>
                )}
                {session.role === "PLATFORM_ADMIN" && (
                  <Link href="/admin" className="text-sm text-neutral-600 hover:text-neutral-900">
                    Admin
                  </Link>
                )}
                <span className="text-sm text-neutral-500">{session.name ?? session.email}</span>
                <form action={signOut}>
                  <Button type="submit" variant="ghost" size="sm">Sign out</Button>
                </form>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
