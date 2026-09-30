import { AuthForm } from "@/components/auth-form";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="card p-8">
        <h1 className="display text-3xl">Welcome back</h1>
        <p className="mt-2 mb-6 text-sm text-[var(--muted)]">
          Sign in to your deal rooms.
        </p>
        <AuthForm mode="login" callbackUrl={callbackUrl} />
        <p className="mt-5 text-center text-sm text-[var(--muted)]">
          No account?{" "}
          <Link href="/register" className="text-[var(--foreground)] underline">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
