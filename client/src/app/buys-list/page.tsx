"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useListBuysQuery, useDeleteBuyMutation } from "@/state/buysApi";
import { useGetCurrenciesQuery } from "@/state/currenciesApi";
import { useListCustomersQuery } from "@/state/customersApi";
import { Decimal } from "decimal.js";
import { toast, Toaster } from "react-hot-toast";
import { formatNumber, formatBalance } from "@/utils/formatNumber";
import { Search, Filter } from "lucide-react";

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
  // Get all buys without pagination for client-side filtering (like customers)
  const { data: allBuysData, isFetching, refetch } = useListBuysQuery({ page: 1, limit: 1000, search: "" });
  const { data: currencies, isLoading: currenciesLoading } = useGetCurrenciesQuery();
  const { data: customersData, isLoading: customersLoading } = useListCustomersQuery({ page: 1, limit: 1000, search: "" });
  const [deleteBuy, { isLoading: isDeleting }] = useDeleteBuyMutation();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [deletingBuy, setDeletingBuy] = useState<any>(null);

  const allBuys = allBuysData?.data ?? [];
  const allCustomers = customersData?.data ?? [];

  // Filter buys based on search query, currency, and customer (exactly like customers)
  const filteredBuys = useMemo(() => {
    if (!allBuys) return [];
    
    return allBuys.filter((buy) => {
      const matchesSearch = !searchQuery || 
        buy.BillNum?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        buy.Customer?.Customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        buy.Customer?.NationalNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        buy.Customer?.Phone?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCurrency = !selectedCurrency || buy.CarID === selectedCurrency;
      const matchesCustomer = !selectedCustomer || buy.CustID === selectedCustomer;
      
      return matchesSearch && matchesCurrency && matchesCustomer;
    });
  }, [allBuys, searchQuery, selectedCurrency, selectedCustomer]);

  // Paginate filtered results
  const totalPages = Math.ceil(filteredBuys.length / limit);
  const startIndex = (page - 1) * limit;
  const rows = filteredBuys.slice(startIndex, startIndex + limit);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCurrency("");
    setSelectedCustomer("");
    setPage(1);
  };



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

  if (isFetching || currenciesLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">جاري تحميل البيانات...</div>
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

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-700">البحث والفلترة</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                البحث
              </label>
              <input
                type="text"
                placeholder="البحث برقم الفاتورة / اسم العميل / الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Currency Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                العملة
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-sm text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">جميع العملات</option>
                {currencies?.map((currency) => (
                  <option key={currency.CarID} value={currency.CarID}>
                    {currency.Carrency} ({currency.CarrencyCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                العميل
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-sm text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">جميع العملاء</option>
                {allCustomers?.map((customer) => (
                  <option key={customer.CustID} value={customer.CustID}>
                    {customer.Customer}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              مسح الفلاتر
            </button>
            
            <div className="text-sm text-gray-600">
              عدد النتائج: {filteredBuys.length} من أصل {allBuys.length || 0}
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
                {rows.map((buy: any) => (
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

          {/* Empty State */}
          {rows.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {searchQuery || selectedCurrency || selectedCustomer ? "لا توجد نتائج تطابق البحث" : "لا توجد عمليات شراء"}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm text-gray-700">
                  صفحة {page} من {totalPages}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  السابق
                </button>
                <button
                  disabled={page >= totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage((p) => p + 1)}
                >
                  التالي
                </button>
              </div>
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
