"use client";

import React, { useState, useEffect } from "react";
import { useListTreasuryMovementsQuery, useGetTreasurySummaryQuery } from "@/state/treasuryApi";
import { useGetCurrenciesQuery } from "@/state/currenciesApi";
import { toast, Toaster } from "react-hot-toast";
import { formatNumber } from "@/utils/formatNumber";

export default function TreasuryMovementsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // API hooks
  const { 
    data: movementsData, 
    isLoading, 
    error, 
    refetch 
  } = useListTreasuryMovementsQuery({
    page: currentPage,
    limit: 20,
    search: searchTerm,
    carID: selectedCurrency,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { data: summaryData } = useGetTreasurySummaryQuery();
  const { data: currencies } = useGetCurrenciesQuery();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCurrency, startDate, endDate]);

  // Format date with Arabic numerals
  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">جاري تحميل البيانات...</div>
      </div>
    );
  }

  if (error) {
    // Extract meaningful error message from RTK Query error object
    const errorMessage = (error as any)?.data?.message || (error as any)?.message || "حدث خطأ في تحميل البيانات";
    
    // Log detailed error information for debugging
    console.error("Treasury movements error:", {
      status: (error as any)?.status,
      data: (error as any)?.data,
      message: (error as any)?.message,
      originalError: (error as any)?.originalError,
      fullError: error
    });
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-2">{errorMessage}</div>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">حركات الخزينة</h1>
          <p className="text-gray-600">عرض جميع حركات الخزينة والمعاملات المالية</p>
        </div>

        {/* Summary Cards */}
        {summaryData?.data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {summaryData.data.map((summary) => (
              <div key={summary.currencyCode} className="bg-white rounded-lg shadow-md p-4">
                <div className="text-sm text-gray-600 mb-1">{summary.currency}</div>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {formatNumber(summary.currentBalance)} {summary.currencyCode}
                </div>
                <div className="text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>دائن: {formatNumber(summary.totalCredit.toString())}</span>
                    <span>مدين: {formatNumber(summary.totalDebit.toString())}</span>
                  </div>
                  <div className="mt-1">المعاملات: {summary.transactionCount}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <input
                type="text"
                placeholder="البحث في البيان..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">جميع العملات</option>
                {currencies?.map((currency) => (
                  <option key={currency.CarID} value={currency.CarID}>
                    {currency.Carrency} ({currency.CarrencyCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="text-sm text-gray-600 flex items-center">
              إجمالي النتائج: {movementsData?.pagination.totalItems || 0}
            </div>
          </div>
        </div>

        {/* Treasury Movements Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    البيان
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العملة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الرصيد الافتتاحي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    دائن
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    مدين
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الرصيد النهائي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستخدم
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movementsData?.data?.map((movement) => (
                  <tr key={movement.TreaMoveID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(movement.OperDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={movement.Statment}>
                        {movement.Statment}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.Carrence?.Carrency} ({movement.Carrence?.CarrencyCode})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatNumber(movement.OpenBalance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {parseFloat(movement.Cridit) > 0 ? (
                        <span className="text-red-600">
                          {formatNumber(movement.Cridit)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {parseFloat(movement.Debit) > 0 ? (
                        <span className="text-green-600">
                          {formatNumber(movement.Debit)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      {formatNumber(movement.FinalBalance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.User?.UserName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {movementsData && movementsData.pagination.totalPages > 1 && (
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm text-gray-700">
                  صفحة {currentPage} من {movementsData.pagination.totalPages}
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, movementsData.pagination.totalPages))}
                  disabled={currentPage === movementsData.pagination.totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  التالي
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {movementsData?.data?.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">💰</div>
              <div className="text-xl text-gray-600 mb-2">لا توجد حركات خزينة</div>
              <div className="text-gray-500">لم يتم العثور على أي حركات مطابقة للفلاتر المحددة</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
