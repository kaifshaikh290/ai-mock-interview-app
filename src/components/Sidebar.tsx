'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Home, PlusCircle, History, LogOut } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/new-interview', label: 'New Interview', icon: PlusCircle },
    { href: '/dashboard/history', label: 'History', icon: History },
  ];

  return (
    <aside className="w-64 bg-white border-r-2 border-gray-200 min-h-screen flex flex-col shadow-sm">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">AI Interview</h1>
        <p className="text-sm text-gray-600 mt-1">Mock Interview Platform</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon size={20} strokeWidth={2.5} />
              <span className="text-base">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 px-4 py-3 w-full text-red-600 font-medium hover:bg-red-50 rounded-lg transition-all duration-200"
        >
          <LogOut size={20} strokeWidth={2.5} />
          <span className="text-base">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
