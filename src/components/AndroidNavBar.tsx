import React from 'react';
import {
  MessageSquare,
  Smartphone,
  Users,
  Tag,
  Lock,
  Settings,
  ShoppingBag,
  Bed
} from 'lucide-react';

export type NavTab = 'inbox' | 'simulator' | 'orders' | 'products' | 'crm' | 'campaigns' | 'security' | 'settings';

interface AndroidNavBarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unreadCount?: number;
  ordersCount?: number;
  hotLeadsCount?: number;
}

export const AndroidNavBar: React.FC<AndroidNavBarProps> = ({
  currentTab,
  onTabChange,
  unreadCount = 1,
  ordersCount = 3,
  hotLeadsCount = 2,
}) => {
  const tabs = [
    {
      id: 'simulator' as NavTab,
      label: 'Messenger',
      icon: Smartphone,
    },
    {
      id: 'inbox' as NavTab,
      label: 'Inbox',
      icon: MessageSquare,
      badge: unreadCount > 0 ? unreadCount : undefined,
      badgeColor: 'bg-blue-600',
    },
    {
      id: 'orders' as NavTab,
      label: 'Orders',
      icon: ShoppingBag,
      badge: ordersCount > 0 ? ordersCount : undefined,
      badgeColor: 'bg-emerald-600',
    },
    {
      id: 'products' as NavTab,
      label: 'Beds Catalog',
      icon: Bed,
    },
    {
      id: 'crm' as NavTab,
      label: 'Leads CRM',
      icon: Users,
      badge: hotLeadsCount > 0 ? `${hotLeadsCount}🔥` : undefined,
      badgeColor: 'bg-rose-600',
    },
    {
      id: 'campaigns' as NavTab,
      label: 'Discounts',
      icon: Tag,
    },
    {
      id: 'security' as NavTab,
      label: 'E2EE Vault',
      icon: Lock,
    },
    {
      id: 'settings' as NavTab,
      label: 'Meta Settings',
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 safe-bottom shadow-2xl">
      <div className="max-w-4xl mx-auto flex items-center justify-between sm:justify-around overflow-x-auto no-scrollbar gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 group focus:outline-none flex-shrink-0"
            >
              {/* Material 3 active pill background */}
              <div
                className={`relative flex items-center justify-center w-11 h-7 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-600/30 text-blue-400 ring-1 ring-blue-500/40'
                    : 'text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-900/50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-blue-400' : 'text-slate-400'
                  }`}
                />

                {/* Badge indicator */}
                {tab.badge && (
                  <span
                    className={`absolute -top-1 -right-1 text-[9px] font-bold text-white px-1.5 py-0.2 rounded-full min-w-3.5 text-center border border-slate-950 ${tab.badgeColor}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Tab label */}
              <span
                className={`text-[9px] font-medium tracking-tight mt-1 whitespace-nowrap transition-colors duration-150 ${
                  isActive ? 'text-blue-400 font-bold' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
