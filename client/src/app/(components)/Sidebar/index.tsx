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
  console.log({ isCollapsed, pathname, href });

  return (
    <Link href={href}>
      <div
        className={`cursor-pointer flex items-center  ${
          isCollapsed ? "justify-center py-4" : "justify-start px-8 py-4"
        } hover:text-blue-500 hover:bg-blue-300 gap-3 transition-colors ${
          isActive ? "bg-blue-200 text-blue-900" : ""
        }`}
      >
        <Icon className="w-6 h-6 text-gray-700" />
        <span
          className={`${
            isCollapsed ? "hidden" : "block"
          } font-tajawal text-gray-700`}
        >
          {label}
        </span>
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

  const sidebarClassNames = `font-tajawal fixed flex flex-col ${
    isSidebarCollapsed ? "w-0 md:w-16" : "w-72 md:w-64"
  } bg-white transition-all duration-300 overflow-hidden h-full shadow-md z-40`;

  return (
    <div className={sidebarClassNames}>
      {/* TOP LOGO */}
      <div
        className={`flex gap-3 justify-between md:justify-normal items-center pt-8 ${
          isSidebarCollapsed ? "px-5" : "px-9"
        }`}
      >
        <div>logo</div>
        <h1
          className={`${
            isSidebarCollapsed ? "hidden" : "block"
          } font-semibold text-xl`}
        >
          {/*name */}
        </h1>
        <button
          className="md:hidden px-3 py-3 bg-gray-100 rounded-full hover:bg-blue-100"
          onClick={toggleSidebar}
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>
      {/* LINKS */}
      <div className="flex-grow mt-8 ">
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
          href="/report"
          icon={RepeatIcon}
          label="التقارير"
          isCollapsed={isSidebarCollapsed}
        />
      </div>
      {/* FOOTER */}
      <div className={`${isSidebarCollapsed ? "hidden" : "block"} mb-10`}>
        <p className="text-center text-xs text-gray-500">
          &copy; 2024 Aidanden Company
        </p>
      </div>
    </div>
  );
};

export default Sidebar;