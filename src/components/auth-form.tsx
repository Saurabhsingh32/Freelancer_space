"use client";

import { loginAction, registerAction } from "@/app/actions";
import { useActionState } from "react";

export function AuthForm({
  mode,
  callbackUrl,
}: {
  mode: "login" | "register";
  callbackUrl?: string;
}) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      return (await action(formData)) ?? null;
    },
    null as { error: string } | null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {mode === "register" ? (
        <label className="label">
          Name
          <input name="name" required className="field" />
        </label>
      ) : null}
      <label className="label">
        Email
        <input name="email" type="email" required className="field" />
      </label>
      <label className="label">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : undefined}
          className="field"
        />
      </label>
      {callbackUrl ? (
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
      ) : null}
      {state?.error ? (
        <p className="text-sm" style={{ color: "var(--warn)" }}>
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending
          ? "Please wait..."
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </button>
    </form>
  );
}
