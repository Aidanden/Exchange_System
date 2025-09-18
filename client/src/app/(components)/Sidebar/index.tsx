"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsSidebarCollapsed } from "@/state";
import {
  Layout,
  LucideIcon,
  Menu,
  RepeatIcon,
  CircleDollarSign,
  SquareUserRound,
  DollarSign,
  UsersRound,
  ShoppingCart,
  TrendingDown,
  CreditCard,
  FileText,
  Wallet,
} from "lucide-react"; // تأكد من استيراد الأيقونات المطلوبة
import { usePathname } from "next/navigation";
import React from "react";
import Link from "next/link";

interface SidebarLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isCollapsed: boolean;
}

const SidebarLink = ({
  href,
  icon: Icon,
  label,
  isCollapsed,
}: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive =
    pathname === href || (pathname === "/" && href === "/dashboard");

  return (
    <Link href={href}>
      <div
        className={`cursor-pointer flex items-center group relative ${
          isCollapsed ? "justify-center py-4 mx-2" : "justify-start px-6 py-3 mx-3"
        } hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 gap-3 transition-all duration-300 ease-in-out rounded-lg ${
          isActive ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg" : "text-gray-600 hover:shadow-md"
        }`}
      >
        <Icon className={`w-5 h-5 transition-all duration-300 ${
          isActive ? "text-white" : "text-gray-600 group-hover:text-white"
        }`} />
        <span
          className={`${
            isCollapsed ? "hidden" : "block"
          } font-tajawal font-medium transition-all duration-300 ${
            isActive ? "text-white" : "text-gray-600 group-hover:text-white"
          }`}
        >
          {label}
        </span>
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-[10]">
            {label}
          </div>
        )}
      </div>
    </Link>
  );
};

const Sidebar = () => {
  const dispatch = useAppDispatch();

  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );

  const toggleSidebar = () => {
    dispatch(setIsSidebarCollapsed(!isSidebarCollapsed));
  };

  const sidebarClassNames = `font-tajawal fixed right-0 top-0 flex flex-col ${
    isSidebarCollapsed ? "w-0 md:w-16" : "w-72 md:w-64"
  } bg-gradient-to-b from-white to-gray-50 transition-all duration-300 overflow-hidden h-screen shadow-xl border-l border-gray-200 z-[1]`;

  return (
    <div className={sidebarClassNames}>
      {/* TOP LOGO */}
      <div
        className={`flex gap-3 justify-between md:justify-normal items-center pt-6 pb-4 border-b border-gray-200 ${
          isSidebarCollapsed ? "px-4" : "px-6"
        }`}
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">E</span>
        </div>
        <h1
          className={`${
            isSidebarCollapsed ? "hidden" : "block"
          } font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent`}
        >
          نظام الصرافة
        </h1>
        <button
          className="md:hidden px-3 py-3 bg-gray-100 rounded-full hover:bg-blue-100 transition-colors duration-200"
          onClick={toggleSidebar}
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>
      {/* LINKS */}
      <div className="flex-grow mt-6 px-2">
        <SidebarLink
          href="/dashboard"
          icon={Layout}
          label="الرئسية"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/nationalits"
          icon={SquareUserRound}
          label="الجنسيات"
          isCollapsed={isSidebarCollapsed}
        />
         <SidebarLink
          href="/customers"
          icon={UsersRound}
          label="الزبائن"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/currencies"
          icon={DollarSign}
          label="إدارة العملات"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/buys"
          icon={CircleDollarSign}
          label="الشراء"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/buys-list"
          icon={ShoppingCart}
          label="قائمة المشتريات"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/sales"
          icon={TrendingDown}
          label="البيع"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/sales-list"
          icon={ShoppingCart}
          label="قائمة المبيعات"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/debts"
          icon={CreditCard}
          label="إدارة الديون"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/debts-list"
          icon={FileText}
          label="قائمة الديون"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/treasury-movements"
          icon={Wallet}
          label="حركات الخزينة"
          isCollapsed={isSidebarCollapsed}
        />
       
        <SidebarLink
          href="/users"
          icon={UsersRound}
          label="إدارة المستخدمين"
          isCollapsed={isSidebarCollapsed}
        />
        <SidebarLink
          href="/reports"
          icon={RepeatIcon}
          label="التقارير"
          isCollapsed={isSidebarCollapsed}
        />
      </div>
      {/* FOOTER */}
      <div className={`${isSidebarCollapsed ? "hidden" : "block"} mb-6 px-6 pt-4 border-t border-gray-200`}>
        <p className="text-center text-xs text-gray-400 font-medium">
          &copy; 2024 Aidanden Company
        </p>
      </div>
    </div>
  );
};

export default Sidebar;