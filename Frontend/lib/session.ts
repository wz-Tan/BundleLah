// Minimal client-side session: remembers the logged-in company id.
// (The backend uses simple username/password login with no tokens.)

import type { Company } from "@/type";

const STORAGE_KEY = "bundlelah_company";

export function saveCompany(company: Company) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(company));
}

export function getStoredCompany(): Company | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Company;
  } catch {
    return null;
  }
}

export function getCurrentCompanyId(): number | null {
  return getStoredCompany()?.id ?? null;
}

export function clearCompanySession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
