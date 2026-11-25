import { createContext, useContext } from "react";

export const BreadcrumbContext = createContext<{ customLabel: string; setCustomLabel: (label: string) => void }>({ customLabel: "", setCustomLabel: () => {} });
export function useBreadcrumb() { return useContext(BreadcrumbContext); }
