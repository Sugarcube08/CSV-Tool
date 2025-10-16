import React from "react";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B2145] via-[#0C102E] to-[#060A1A] text-gray-100 flex flex-col items-center justify-between px-6 py-8">
      {/* Main content area */}
      <main className="flex-grow w-full flex items-center justify-center transition-all duration-300 ease-in-out">
        <Outlet />
      </main>

      {/* Footer / Heading */}
      <footer className="mt-10 text-center">
        <h1 className="text-2xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-lg">
          CSV Viewer
        </h1>
        <p className="text-sm mt-1 text-gray-400 italic select-none">
          Built with <span className="text-pink-500">❤️</span> for structured data
        </p>
      </footer>
    </div>
  );
};

export default Layout;
