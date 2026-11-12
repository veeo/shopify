"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AdminApp } from "@/components/admin-app";
import { ShopifyMark } from "@/components/marks";

/** Case-sensitive. Held only in this module — never written to storage. */
const LOAD_PASSWORD = "sidekick";

/**
 * Full-screen lock on every fresh document load. Admission lives in React state,
 * so a reload shows the gate again and the Sidekick shell does not mount until then.
 */
export function LoadGate({ initialScenario }: { initialScenario: "setup" | "active" }) {
  const [admitted, setAdmitted] = useState(false);
  if (!admitted) return <PasswordGate onAdmit={() => setAdmitted(true)} />;
  return <AdminApp initialScenario={initialScenario} />;
}

function PasswordGate({ onAdmit }: { onAdmit: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  const errorId = useId();

  useEffect(() => {
    field.current?.focus();
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (value === LOAD_PASSWORD) {
      onAdmit();
      return;
    }
    setError(true);
    field.current?.focus();
  }

  return (
    <div data-load-gate className="fixed inset-0 z-[300] grid place-items-center bg-[#0c0d0c] px-6 text-white">
      <form onSubmit={submit} className="w-full max-w-[320px]" noValidate>
        <div className="mb-6 grid place-items-center">
          <ShopifyMark className="h-8 w-[29px]" />
        </div>
        <h1 className="text-center text-[20px] font-semibold tracking-[-0.3px]">Enter password</h1>
        <p className="mt-1.5 text-center text-[13px] leading-5 text-[#8e8f8b]">This preview stays locked until you continue.</p>
        <label htmlFor="load-password" className="mt-6 block text-[12px] font-medium text-[#c9c9c9]">
          Password
        </label>
        <input
          ref={field}
          id="load-password"
          name="load-password"
          type="password"
          value={value}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          aria-invalid={error}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(false);
          }}
          className={`mt-1.5 h-10 w-full rounded-lg bg-[#1a1b1a] px-3 text-[14px] text-white outline-none ring-1 ring-inset transition-shadow placeholder:text-[#737572] focus:ring-2 ${
            error ? "ring-[#ff8a80] focus:ring-[#ff8a80]" : "ring-white/15 focus:ring-white/70"
          }`}
        />
        <div className="mt-2 min-h-5">
          {error ? (
            <p id={errorId} role="alert" className="text-[13px] leading-5 text-[#ff8a80]">
              Incorrect password.
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          className="press mt-3 h-10 w-full rounded-lg bg-white text-[13px] font-semibold text-[#0c0d0c] hover:bg-[#f3f3f3]"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
