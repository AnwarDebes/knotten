"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { signUp, type MemberState } from "@/lib/server/members";

/**
 * The sign-up form's state in both designs: the server action, the Turnstile answer (when Turnstile is set up),
 * and the focus moved to the answer once the form is replaced by "check your email", so the keyboard and screen
 * readers arrive there.
 */
export function useSignUp() {
  const [state, action, pending] = useActionState<MemberState, FormData>(signUp, undefined);
  const [token, setToken] = useState("");
  const done = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state?.done) done.current?.focus();
  }, [state]);
  return { state, action, pending, token, setToken, done };
}
