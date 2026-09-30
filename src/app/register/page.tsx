import { AuthForm } from "@/components/auth-form";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="card p-8">
        <h1 className="display text-3xl">Create your seat</h1>
        <p className="mt-2 mb-6 text-sm text-[var(--muted)]">
          Password at least 8 characters. You can be a client or a freelancer.
        </p>
        <AuthForm mode="register" />
        <p className="mt-5 text-center text-sm text-[var(--muted)]">
          Already registered?{" "}
          <Link href="/login" className="text-[var(--foreground)] underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
