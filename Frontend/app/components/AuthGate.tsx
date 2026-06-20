"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "./Header";
import { getStoredCompany } from "@/lib/session";

// Routes accessible without being logged in.
const PUBLIC_ROUTES = ["/login", "/register"];

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "authed" | "guest">(
    "checking"
  );

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    const company = getStoredCompany();
    if (company) {
      setStatus("authed");
      // Logged-in users shouldn't sit on the login/signup page.
      if (isPublic) router.replace("/dashboard");
    } else {
      setStatus("guest");
      // Guests can only stay on public routes.
      if (!isPublic) router.replace("/login");
    }
  }, [pathname, isPublic, router]);

  // Still determining auth state — render nothing to avoid flashing
  // protected content before a redirect can run.
  if (status === "checking") return null;

  // A redirect is in flight; don't render the page being navigated away from.
  if (status === "guest" && !isPublic) return null;
  if (status === "authed" && isPublic) return null;

  return (
    <>
      {!isPublic && <Header />}
      {children}
    </>
  );
}
