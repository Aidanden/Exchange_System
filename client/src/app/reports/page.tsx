"use client";

import React from "react";
import { 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Download,
  BarChart3
} from "lucide-react";

const ReportsPage = () => {
  const reportTypes = [
    {
      id: 1,
      title: "تقرير المبيعات",
      description: "تقرير شامل عن جميع عمليات البيع",
      icon: TrendingUp,
      color: "bg-green-100 text-green-600"
    },
    {
      id: 2,
      title: "تقرير المشتريات",
      description: "تقرير شامل عن جميع عمليات الشراء",
      icon: DollarSign,
      color: "bg-blue-100 text-blue-600"
    },
    {
      id: 3,
      title: "تقرير الزبائن",
      description: "تقرير عن نشاط الزبائن والمعاملات",
      icon: Users,
      color: "bg-purple-100 text-purple-600"
    },
    {
      id: 4,
      title: "تقرير الديون",
      description: "تقرير عن الديون المستحقة والمسددة",
      icon: FileText,
      color: "bg-red-100 text-red-600"
    },
    {
      id: 5,
      title: "تقرير حركات الخزينة",
      description: "تقرير عن جميع حركات الخزينة",
      icon: BarChart3,
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      id: 6,
      title: "التقرير الشهري",
      description: "تقرير شامل عن الأداء الشهري",
      icon: Calendar,
      color: "bg-indigo-100 text-indigo-600"
    }
  ];

  return (
    <div className="p-6 font-tajawal">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">التقارير</h1>
        <p className="text-gray-600">اختر نوع التقرير الذي تريد إنشاؤه</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => {
          const IconComponent = report.icon;
          return (
            <div
              key={report.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-200"
            >
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-full ${report.color} mr-3`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {report.title}
                </h3>
              </div>
              
              <p className="text-gray-600 mb-4 text-sm">
                {report.description}
              </p>
              
              <div className="flex gap-2">
                <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  عرض التقرير
                </button>
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm transition-colors duration-200 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">فلاتر التقارير</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              من تاريخ
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              إلى تاريخ
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              العملة
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">جميع العملات</option>
              <option value="USD">دولار أمريكي</option>
              <option value="EUR">يورو</option>
              <option value="TRY">ليرة تركية</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200">
            تطبيق الفلاتر
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
