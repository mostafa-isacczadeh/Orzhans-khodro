"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function HeaderGate({ header, footer, children }: { header: ReactNode; footer: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  return <>{!isHome && header}{children}{!isHome && footer}</>;
}
