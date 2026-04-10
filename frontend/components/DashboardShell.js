"use client";

import React from 'react';
import Sidebar from './Sidebar';

const DashboardShell = ({ children, title, description, actions }) => {
  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:pl-0">
        <div className="page-shell max-w-6xl">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
            <div className="animate-in slide-in-from-left duration-700">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
              {description && <p className="text-slate-500 font-medium mt-1">{description}</p>}
            </div>
            {actions && (
              <div className="flex items-center gap-3 animate-in slide-in-from-right duration-700">
                {actions}
              </div>
            )}
          </div>

          <div className="animate-in fade-in duration-1000">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardShell;
