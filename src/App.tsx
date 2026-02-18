import { useState } from "react";
import { Sidebar, type Page } from "./components/layout/Sidebar";
import { MainContent } from "./components/layout/MainContent";
import "./index.css";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0d0d14] overflow-hidden">
      <Sidebar
        current={page}
        onChange={setPage}
        isMobileOpen={sidebarOpen}
        onMobileToggle={() => setSidebarOpen((v) => !v)}
      />
      <MainContent page={page} />
    </div>
  );
}
