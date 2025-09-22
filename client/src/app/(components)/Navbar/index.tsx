"use client";
import React from "react";
import { Bell, Menu, Settings, Sun, Moon, Users, LogOut } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsDarkMode, setIsSidebarCollapsed } from "@/state";
import { logout } from "@/state/authSlice";
import { useLogoutMutation } from "@/state/authApi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";


const Navbar = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [logoutMutation] = useLogoutMutation();

  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const { user } = useAppSelector((state) => state.auth);


  const toggleSidebar = () => {
    dispatch(setIsSidebarCollapsed(!isSidebarCollapsed));
  };

  const toggleDarkMode = () => {
    dispatch(setIsDarkMode(!isDarkMode));
  };

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch (error) {
      // حتى لو فشل طلب تسجيل الخروج من الخادم، سنقوم بتسجيل الخروج محلياً
      console.error('Logout error:', error);
    } finally {
      dispatch(logout());
      router.push('/login');
    }
  };

  return (
    <div className="flex justify-between items-center w-full mb-6 font-tajawal bg-white shadow-sm rounded-xl p-4 border border-gray-100 relative z-[5]">
      {/*LEFT SIDE*/}
      <div className="flex justify-between items-center gap-4">
        <button
          className="px-3 py-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 shadow-sm hover:shadow-md group" 
          onClick={toggleSidebar}
        >
          <Menu className="w-4 h-4 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" />
        </button>
      
        <div className="flex items-center gap-3">
          <Image
            src="/company-logo.svg"
            alt="Al Monjez Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <div className="text-lg font-semibold text-gray-700">
            مرحباً بك في نظام الصرافة
          </div>
        </div>
      </div>
      {/** RIGHT SIDE */}
      <div className="flex justify-between items-center gap-4">
        <div className="hidden md:flex justify-between items-center gap-4">
          <Link href="/users">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-300 group" title="إدارة المستخدمين">
              <Users className="cursor-pointer text-gray-500 group-hover:text-blue-500 transition-colors duration-300" size={20} />
            </button>
          </Link>
          
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-300 group"
          >
            {isDarkMode ? 
              <Sun className="cursor-pointer text-gray-500 group-hover:text-yellow-500 transition-colors duration-300" size={20} /> :
              <Moon className="cursor-pointer text-gray-500 group-hover:text-blue-500 transition-colors duration-300" size={20} />
            }
          </button>
          
          <div className="relative group">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-300">
              <Bell className="cursor-pointer text-gray-500 group-hover:text-blue-500 transition-colors duration-300" size={20} />
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg">
                4
              </span>
            </button>
          </div>
          
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-all duration-300">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">
                  {user?.fullName?.charAt(0) || 'م'}
                </span>
              </div>
              <span className="font-semibold text-gray-700">
                {user?.fullName || 'المستخدم'}
              </span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 transition-all duration-300 group"
              title="تسجيل الخروج"
            >
              <LogOut className="cursor-pointer text-gray-500 group-hover:text-red-500 transition-colors duration-300" size={20} />
            </button>
          </div>
        </div>
        
        <Link href="/settings">
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-300 group">
            <Settings className="cursor-pointer text-gray-500 group-hover:text-blue-500 transition-colors duration-300" size={20}/>
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
