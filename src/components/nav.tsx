import { logoutAction } from "@/app/actions";
import { auth } from "@/auth";
import Link from "next/link";

export async function Nav() {
  const session = await auth();
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--background)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href={session ? "/deals" : "/"} className="flex items-center gap-2">
          <span
            className="grid h-8 w-8 place-items-center rounded-full text-xs font-semibold text-[#f7f3ea]"
            style={{ background: "var(--accent)" }}
          >
            H
          </span>
          <span className="display text-lg">Holdroom</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm sm:gap-3">
          <Link href="/how-to-test" className="hidden px-2 py-1 text-[var(--muted)] sm:inline">
            How to test
          </Link>
          {session?.user ? (
            <>
              <Link href="/deals" className="px-2 py-1">
                Deals
              </Link>
              <span className="hidden max-w-[180px] truncate text-[var(--muted)] sm:inline">
                {session.user.email}
              </span>
              <form action={logoutAction}>
                <button type="submit" className="btn btn-secondary">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="px-2 py-1">
                Sign in
              </Link>
              <Link href="/register" className="btn btn-primary">
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
