import { useState } from "react";
import type { ReactNode } from "react";
import { BreadcrumbContext } from "./breadcrumbStore";

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [customLabel, setCustomLabel] = useState("");
  return (
    <BreadcrumbContext.Provider value={{ customLabel, setCustomLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}
