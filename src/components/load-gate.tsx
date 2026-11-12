"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AdminApp } from "@/components/admin-app";
import { Orb, ShopifyMark } from "@/components/marks";

/** Case-sensitive. Held only in this module — never written to storage. */
const LOAD_PASSWORD = "sidekick";
/** Bar is under the orb and the status has settled; start revealing the app. */
const REVEAL_MS = 2300;
/** Overlay fade finishes. The same bar never hands off to a second boot progress. */
const DONE_MS = 2680;

/**
 * Full-screen lock on every fresh document load. Admission lives in React state,
 * so a reload shows the gate again and the Sidekick shell does not mount until then.
 */
export function LoadGate({ initialScenario }: { initialScenario: "setup" | "active" }) {
  const [phase, setPhase] = useState<"gate" | "reveal" | "app">("gate");
  return (
    <>
      {phase !== "gate" ? <AdminApp initialScenario={initialScenario} skipBoot /> : null}
      {phase !== "app" ? (
        <PasswordGate
          exiting={phase === "reveal"}
          onReveal={() => setPhase((current) => (current === "gate" ? "reveal" : current))}
          onDone={() => setPhase("app")}
        />
      ) : null}
    </>
  );
}

function PasswordGate({
  exiting,
  onReveal,
  onDone,
}: {
  exiting: boolean;
  onReveal: () => void;
  onDone: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [opening, setOpening] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const reveal = useRef(onReveal);
  const done = useRef(onDone);
  const lock = useRef(false);

  useEffect(() => {
    reveal.current = onReveal;
    done.current = onDone;
  });

  useEffect(() => {
    field.current?.focus();
  }, []);

  useEffect(() => {
    if (!opening) return;
    field.current?.blur();
    const revealTimer = window.setTimeout(() => reveal.current(), REVEAL_MS);
    const doneTimer = window.setTimeout(() => done.current(), DONE_MS);
    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(doneTimer);
    };
  }, [opening]);

  function unlock() {
    if (lock.current || opening) return;
    if (value !== LOAD_PASSWORD) {
      setError(true);
      field.current?.focus();
      return;
    }
    lock.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDone();
      return;
    }
    setOpening(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    unlock();
  }

  return (
    <div
      data-load-gate
      data-opening={opening ? "true" : "false"}
      className={`gate-shell p-partial-theme-admin-next-dark fixed inset-0 z-[300] grid place-items-center bg-[#0c0d0c] px-6 text-white ${
        exiting ? "is-exit" : ""
      }`}
    >
      <form
        onSubmit={submit}
        action="javascript:void(0)"
        className="gate-column relative w-full max-w-[320px]"
        noValidate
        aria-busy={opening}
        data-opening={opening ? "true" : "false"}
      >
        <div className="gate-mark relative mx-auto grid h-14 w-14 place-items-center">
          <div className={`gate-crossfade ${opening ? "opacity-0" : "opacity-100"}`}>
            <ShopifyMark className="h-8 w-[29px]" />
          </div>
          <div className={`gate-crossfade pointer-events-none ${opening ? "opacity-100" : "opacity-0"}`} aria-hidden="true">
            <Orb id="chief" size={56} />
          </div>
        </div>

        <div className={`gate-fade mt-6 ${opening ? "pointer-events-none opacity-0" : "opacity-100"}`}>
          <h1 className="text-center text-[20px] font-semibold leading-6 tracking-[-0.3px]">Enter password</h1>
          <p className="mt-1.5 text-center text-[13px] leading-5 text-[#8e8f8b]">This preview stays locked until you continue.</p>
          <label htmlFor="load-password" className="mt-6 block text-[12px] font-medium leading-4 text-[#c9c9c9]">
            Password
          </label>
        </div>

        <div className={`gate-travel relative mt-1.5 h-10 ${opening ? "is-rising" : ""}`}>
          <div
            data-opening={opening ? "" : undefined}
            className={`gate-field gate-morph absolute inset-x-0 top-1/2 -translate-y-1/2 overflow-hidden ${
              opening
                ? "h-1 rounded-full bg-white/15 shadow-none"
                : error
                  ? "h-10 rounded-lg bg-[#1a1b1a] shadow-[inset_0_0_0_1px_rgba(255,138,128,0.95)]"
                  : "h-10 rounded-lg bg-[#1a1b1a] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)] focus-within:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.7)]"
            }`}
          >
            <input
              ref={field}
              id="load-password"
              type="password"
              value={value}
              readOnly={opening}
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
              className={`gate-fade h-10 w-full bg-transparent px-3 text-[14px] text-white outline-none ${opening ? "opacity-0" : "opacity-100"}`}
            />
            <span aria-hidden="true" className="gate-field-bar pointer-events-none absolute inset-0 bg-white" />
          </div>
        </div>

        <p className="gate-status pointer-events-none absolute inset-x-0 top-[86px] text-center text-[13px] leading-5 text-[#c9c9c9]" aria-live="polite">
          {opening ? "Loading your experience" : ""}
        </p>

        {error && !opening ? (
          <p id={errorId} role="alert" className="mt-2 text-[13px] leading-5 text-[#ff8a80]">
            Incorrect password.
          </p>
        ) : null}

        <div className={`gate-continue gate-fade mt-3.5 ${opening ? "pointer-events-none opacity-0" : "opacity-100"}`}>
          <s-button
            variant="primary"
            type="submit"
            inlineSize="fill"
            onClick={(event) => {
              event.preventDefault();
              unlock();
            }}
          >
            Continue
          </s-button>
        </div>
      </form>
    </div>
  );
}
