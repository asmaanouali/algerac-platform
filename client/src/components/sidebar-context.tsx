import { createContext, useContext, useState, ReactNode } from "react";

interface SidebarContextType {
  isMobileOpen: boolean;
  toggleMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isMobileOpen: false,
  toggleMobile: () => {},
  closeMobile: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  return (
    <SidebarContext.Provider
      value={{
        isMobileOpen,
        toggleMobile: () => setIsMobileOpen((v) => !v),
        closeMobile: () => setIsMobileOpen(false),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
