import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface BreadcrumbContextValue {
  customLabel: string;
  setCustomLabel: (label: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  customLabel: "",
  setCustomLabel: () => {},
});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [customLabel, setCustomLabel] = useState("");
  return (
    <BreadcrumbContext.Provider value={{ customLabel, setCustomLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  return useContext(BreadcrumbContext);
}