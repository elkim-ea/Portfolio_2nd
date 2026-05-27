import { Outlet } from "react-router";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 p-8">
            <Outlet />
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}