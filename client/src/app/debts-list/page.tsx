"use client";

import React, { useState, useEffect } from "react";
import { useListDebtsQuery, useAddDebtPaymentMutation, useDeleteDebtMutation } from "@/state/debtsApi";
import { useGetCurrenciesQuery } from "@/state/currenciesApi";
import { toast, Toaster } from "react-hot-toast";
import { formatNumber } from "@/utils/formatNumber";

export default function DebtsListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [typeFilter, setTypeFilter] = useState("");
  const [repayingDebt, setRepayingDebt] = useState<any>(null);
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [deletingDebt, setDeletingDebt] = useState<any>(null);

  // API hooks
  const { 
    data: debtsData, 
    isLoading, 
    error, 
    refetch 
  } = useListDebtsQuery({
    page: currentPage,
    limit: 20,
    search: searchTerm,
    status: statusFilter as any,
    debtType: typeFilter as any,
  });

  const { refetch: refetchCurrencies } = useGetCurrenciesQuery();
  const [addDebtPayment, { isLoading: isUpdating }] = useAddDebtPaymentMutation();
  const [deleteDebt, { isLoading: isDeleting }] = useDeleteDebtMutation();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  // Format date
  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle repayment
  const handleRepaymentClick = (debt: any) => {
    setRepayingDebt(debt);
    setRepaymentAmount(debt.RemainingAmount || debt.Amount);
  };

  const handleRepaymentConfirm = async () => {
    if (!repayingDebt || !repaymentAmount) return;

    try {
      await addDebtPayment({
        debtId: repayingDebt.DebtID,
        data: {
          Amount: repaymentAmount.replace(/,/g, ''),
          Description: `${repayingDebt.DebtType === "TAKEN" ? "سداد" : "استلام"} دين`,
          UserID: "9e2895ae-4afe-4ff2-b3b3-be15cf1c82d6",
        },
      }).unwrap();

      toast.success(`تم ${repayingDebt.DebtType === "TAKEN" ? "سداد الدين" : "استلام الدين"} بنجاح`);
      setRepayingDebt(null);
      
      // Force immediate currency refetch to update balances
      await refetchCurrencies();
      
      setTimeout(async () => {
        await refetch();
      }, 500);
    } catch (error: any) {
      // Extract meaningful error message from RTK Query error object
      const errorMessage = error?.data?.message || error?.message || "حدث خطأ أثناء معالجة العملية";
      toast.error(errorMessage);
      
      // Log detailed error information for debugging
      console.error("Debt payment error:", {
        status: error?.status,
        data: error?.data,
        message: error?.message,
        originalError: error?.originalError,
        fullError: error
      });
    }
  };

  // Handle delete
  const handleDeleteClick = (debt: any) => {
    setDeletingDebt(debt);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDebt) return;

    try {
      await deleteDebt(deletingDebt.DebtID).unwrap();
      toast.success("تم حذف الدين بنجاح");
      setDeletingDebt(null);
      refetch();
    } catch (error: any) {
      // Extract meaningful error message from RTK Query error object
      const errorMessage = error?.data?.message || error?.message || "حدث خطأ أثناء حذف الدين";
      toast.error(errorMessage);
      
      // Log detailed error information for debugging
      console.error("Debt deletion error:", {
        status: error?.status,
        data: error?.data,
        message: error?.message,
        originalError: error?.originalError,
        fullError: error
      });
    }
  };

  // Helper function to format number for input
  const formatNumberForInput = (value: string): string => {
    if (!value) return '';
    const num = parseFloat(value.replace(/,/g, ''));
    if (isNaN(num)) return value;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    });
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
    console.error("Debts list error:", {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">قائمة الديون</h1>
          <p className="text-gray-600">عرض وإدارة جميع عمليات الديون</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <input
                type="text"
                placeholder="البحث بالاسم أو الوصف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ACTIVE">نشط</option>
                <option value="PAID">مسدد</option>
                <option value="RECEIVED">مستلم</option>
                <option value="">جميع الحالات</option>
              </select>
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">جميع الأنواع</option>
                <option value="TAKEN">استذانة (أخذ دين)</option>
                <option value="GIVEN">إقراض (إعطاء دين)</option>
              </select>
            </div>

            <div className="text-sm text-gray-600 flex items-center">
              إجمالي النتائج: {debtsData?.pagination.totalItems || 0}
            </div>
          </div>
        </div>

        {/* Debts Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    النوع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الاسم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ الأصلي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ المدفوع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ المتبقي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العملة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الهاتف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {debtsData?.data?.map((debt) => (
                  <tr key={debt.DebtID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        debt.DebtType === "TAKEN" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {debt.DebtType === "TAKEN" ? "استذانة" : "إقراض"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{debt.DebtorName}</div>
                        {debt.Description && (
                          <div className="text-gray-500 text-xs">{debt.Description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatNumber(debt.Amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(debt.PaidAmount || "0")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      <span className={debt.RemainingAmount && parseFloat(debt.RemainingAmount) > 0 ? "text-red-600" : "text-green-600"}>
                        {formatNumber(debt.RemainingAmount || debt.Amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {debt.Currency?.Carrency} ({debt.Currency?.CarrencyCode})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        debt.Status === "ACTIVE" 
                          ? "bg-yellow-100 text-yellow-800"
                          : debt.Status === "PARTIAL"
                          ? "bg-orange-100 text-orange-800"
                          : debt.Status === "PAID"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {debt.Status === "ACTIVE" ? "نشط" : debt.Status === "PARTIAL" ? "جزئي" : debt.Status === "PAID" ? "مسدد" : "مستلم"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{formatDate(debt.DebtDate)}</div>
                        {debt.RepaymentDate && (
                          <div className="text-xs text-gray-500">
                            تم السداد: {formatDate(debt.RepaymentDate)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {debt.DebtorPhone || "غير محدد"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {(debt.Status === "ACTIVE" || debt.Status === "PARTIAL") ? (
                          <button
                            onClick={() => handleRepaymentClick(debt)}
                            className={`px-3 py-1 rounded text-white transition-colors ${
                              debt.DebtType === "TAKEN"
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >
                            {debt.DebtType === "TAKEN" ? "سداد" : "استلام"}
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-1 rounded text-white bg-gray-400 cursor-not-allowed"
                          >
                            {debt.Status === "PAID" ? "تم السداد" : "تم الاستلام"}
                          </button>
                        )}
                        {debt.Status === "ACTIVE" && (
                          <button
                            onClick={() => handleDeleteClick(debt)}
                            className="px-3 py-1 rounded bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                          >
                            حذف
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {debtsData && debtsData.pagination.totalPages > 1 && (
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm text-gray-700">
                  صفحة {currentPage} من {debtsData.pagination.totalPages}
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, debtsData.pagination.totalPages))}
                  disabled={currentPage === debtsData.pagination.totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  التالي
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {debtsData?.data?.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <div className="text-xl text-gray-600 mb-2">لا توجد ديون</div>
              <div className="text-gray-500">لم يتم العثور على أي عمليات ديون مطابقة للفلاتر المحددة</div>
            </div>
          )}
        </div>

        {/* Repayment Modal */}
        {repayingDebt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[3]">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {repayingDebt.DebtType === "TAKEN" ? "سداد الدين" : "استلام الدين"}
                </h2>
                <p className="text-gray-600">
                  {repayingDebt.DebtType === "TAKEN" ? "سداد دين إلى" : "استلام دين من"}: {repayingDebt.DebtorName}
                </p>
                <div className="mt-2 p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">المبلغ الأصلي: {formatNumber(repayingDebt.Amount)} {repayingDebt.Currency?.CarrencyCode}</div>
                  {repayingDebt.PaidAmount && parseFloat(repayingDebt.PaidAmount) > 0 && (
                    <div className="text-sm text-green-600">المبلغ المدفوع: {formatNumber(repayingDebt.PaidAmount)} {repayingDebt.Currency?.CarrencyCode}</div>
                  )}
                  <div className="text-sm text-red-600 font-medium">المبلغ المتبقي: {formatNumber(repayingDebt.RemainingAmount || repayingDebt.Amount)} {repayingDebt.Currency?.CarrencyCode}</div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  مبلغ {repayingDebt.DebtType === "TAKEN" ? "السداد" : "الاستلام"}
                </label>
                <input
                  type="text"
                  value={formatNumberForInput(repaymentAmount)}
                  onChange={(e) => setRepaymentAmount(e.target.value.replace(/,/g, ''))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleRepaymentConfirm}
                  disabled={isUpdating || !repaymentAmount}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                    repayingDebt.DebtType === "TAKEN"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                >
                  {isUpdating ? "جاري المعالجة..." : "تأكيد"}
                </button>
                <button
                  onClick={() => {
                    setRepayingDebt(null);
                    setRepaymentAmount("");
                    setTimeout(async () => {
                      await refetch();
                    }, 500);
                  }}
                  disabled={isUpdating}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingDebt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[3]">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">تأكيد الحذف</h2>
                <p className="text-gray-600">
                  هل أنت متأكد من حذف دين <span className="font-medium">{deletingDebt.DebtorName}</span>؟
                </p>
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ هذا الإجراء لا يمكن التراجع عنه
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "جاري الحذف..." : "نعم، احذف"}
                </button>
                <button
                  onClick={() => setDeletingDebt(null)}
                  disabled={isDeleting}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
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

