"use client";
import Link from "next/link";
import { useBranding } from "./branding";
export function Brand() {
  const brand = useBranding();
  return (
    <Link href="/" className="brand">
      <div className="brand-mark">∑</div>
      <div>
        <strong>{brand.name}</strong>
        <small className="latin">ISSAM MATH · BAC {brand.year}</small>
      </div>
    </Link>
  );
}
