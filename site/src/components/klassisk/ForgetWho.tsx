"use client";
import { useEffect } from "react";
import { WHO_COOKIE } from "@/lib/auth-shared";

/**
 * On the Klassisk login page without a valid session: forget the greeting cookie, as components/auth/ClearWho does,
 * and tell the header and the footer to read it again. They stay on screen through a logout that lands on the same
 * page, and lib/session-client.ts reads the cookie again when the window gets focus.
 */
export default function ForgetWho() {
  useEffect(() => {
    if (document.cookie.includes(`${WHO_COOKIE}=`)) document.cookie = `${WHO_COOKIE}=; Max-Age=0; path=/; samesite=lax`;
    window.dispatchEvent(new Event("focus"));
  }, []);
  return null;
}
