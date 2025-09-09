"use client";

import React, { useState, useEffect } from "react";
import { useListBuysQuery, useDeleteBuyMutation } from "@/state/buysApi";

import { Decimal } from "decimal.js";
import { toast, Toaster } from "react-hot-toast";
import { formatNumber, formatBalance } from "@/utils/formatNumber";

// Helper function to format numbers with commas
const formatNumberWithCommas = (value: any): string => {
  if (!value || value === null || value === undefined) return "0.00";
  const numericValue = new Decimal(value).toNumber();
  return numericValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  });
};



export default function BuysListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingBuy, setDeletingBuy] = useState<any>(null);

  // API hooks
  const { 
    data: buysData, 
    isLoading, 
    error, 
    refetch 
  } = useListBuysQuery({
    page: currentPage,
    limit: 20,
    search: searchTerm,
  });

  const [deleteBuy] = useDeleteBuyMutation();

  // إعادة تعيين الصفحة إلى 1 عند تغيير البحث
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // إعادة تحميل البيانات عند تغيير الصفحة
  useEffect(() => {
    refetch();
  }, [currentPage, refetch]);

  // إعادة تحميل البيانات عند تغيير البحث
  useEffect(() => {
    refetch();
  }, [searchTerm, refetch]);



  // Handle delete confirmation
  const handleDeleteClick = (buy: any) => {
    setDeletingBuy(buy);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingBuy) return;

    try {
      await deleteBuy(deletingBuy.BuyID).unwrap();
      toast.success("تم حذف عملية الشراء بنجاح");
      setDeletingBuy(null);
      refetch();
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف عملية الشراء");
      console.error(error);
    }
  };

  // Format date with Arabic numerals (not Hindi)
  const formatDate = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // استخدام دالة التنسيق المشتركة من utils

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">جاري تحميل البيانات...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">حدث خطأ في تحميل البيانات</div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">قائمة المشتريات</h1>
          <p className="text-gray-600">عرض وإدارة عمليات الشراء</p>
        </div>

        {/* Search and Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="البحث برقم الفاتورة أو اسم العميل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="text-sm text-gray-600">
              إجمالي النتائج: {buysData?.total || 0}
            </div>
          </div>
        </div>

        {/* Buys Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الفاتورة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العميل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العملة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الكمية
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    سعر الشراء
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ الإجمالي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ الشراء
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {buysData?.data?.map((buy) => (
                  <tr key={buy.BuyID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {buy.BillNum}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{buy.Customer?.Customer}</div>
                        <div className="text-gray-500 text-xs">
                          {buy.Customer?.NationalNumber && `رقم وطني: ${buy.Customer.NationalNumber}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {buy.Carrence?.Carrency} ({buy.Carrence?.CarrencyCode})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumberWithCommas(buy.Value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumberWithCommas(buy.BuyPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumberWithCommas(buy.TotalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(buy.BuyDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteClick(buy)}
                        className="text-red-600 hover:text-red-900 px-3 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {buysData && buysData.totalPages > 1 && (
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm text-gray-700">
                  صفحة {currentPage} من {buysData.totalPages}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  السابق
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, buysData.totalPages))}
                  disabled={currentPage === buysData.totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  التالي
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {buysData?.data?.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">لا توجد عمليات شراء</div>
            </div>
          )}
        </div>



        {/* Delete Confirmation Modal */}
        {deletingBuy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[3]">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">تأكيد الحذف</h2>
                <p className="text-gray-600">
                  هل أنت متأكد من حذف عملية الشراء رقم <span className="font-medium">{deletingBuy.BillNum}</span>؟
                </p>
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ هذا الإجراء لا يمكن التراجع عنه
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  نعم، احذف
                </button>
                <button
                  onClick={() => setDeletingBuy(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
