import { useState } from "react";
import { Sidebar, type Page } from "./components/layout/Sidebar";
import { MainContent } from "./components/layout/MainContent";
import "./index.css";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <div className="flex h-[100dvh] bg-[#0d0d14] overflow-hidden">
      <Sidebar current={page} onChange={setPage} />
      <MainContent page={page} onChangePage={setPage} />
    </div>
  );
}
