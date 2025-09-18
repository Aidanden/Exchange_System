"use client";

import CardBuys from "./cardBuys";
import CardPopularCustomer from "./cardPopularCustomer";
import CardSales from "./cardSales";
import { BarChart3, Users, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { useGetDashboardMetricsQuery } from "@/state/dashboardApi";
import { formatPrice } from "@/utils/formatNumber";

const Dashboard = () => {
  const { data, isLoading } = useGetDashboardMetricsQuery();
  const statistics = data;

  return (
    <div className="p-6">
      {/* PAGE HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <BarChart3 className="w-8 h-8 ml-3 text-blue-600" />
          لوحة التحكم الرئيسية
        </h1>
        <p className="text-gray-600 mt-2">مرحباً بك في نظام إدارة الصرافة</p>
      </div>

      {/* OVERVIEW STATISTICS */}
      {!isLoading && statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm text-gray-600">إجمالي الزبائن</p>
                <p className="text-2xl font-bold text-gray-800">{statistics.totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm text-gray-600">إجمالي المشتريات</p>
                <p className="text-2xl font-bold text-gray-800">{statistics.totalBuys}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm text-gray-600">إجمالي المبيعات</p>
                <p className="text-2xl font-bold text-gray-800">{statistics.totalSales}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm text-gray-600">مبيعات الشهر</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatPrice(statistics.monthlySalesTotal)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 custom-grid-rows font-tajawal">
        <CardPopularCustomer/>
        <CardBuys/>
        <CardSales/>
      </div>
    </div>
  );
};

export default Dashboard;
