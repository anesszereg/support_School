"use client";
import { createContext, useContext } from "react";
const BrandingContext = createContext({ name: "عصام ماث", year: "2027" });
export function BrandingProvider({
  name,
  year,
  children,
}: {
  name: string;
  year: string;
  children: React.ReactNode;
}) {
  return (
    <BrandingContext.Provider value={{ name, year }}>
      {children}
    </BrandingContext.Provider>
  );
}
export function useBranding() {
  return useContext(BrandingContext);
}
