import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
export const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-[var(--bg-color)]">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
