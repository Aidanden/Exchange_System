"use client";

import React, { useState, useEffect } from "react";
import { useListSalesQuery, useDeleteSaleMutation } from "@/state/salesApi";
import { toast, Toaster } from "react-hot-toast";
import { formatNumber } from "@/utils/formatNumber";

export default function SalesListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingSale, setDeletingSale] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // API hooks
  const { 
    data: salesData, 
    isLoading, 
    error, 
    refetch 
  } = useListSalesQuery({
    page: currentPage,
    limit: 20,
    search: searchTerm,
  });

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

  const [deleteSale] = useDeleteSaleMutation();

  // editing removed per request; only delete remains

  // Handle delete confirmation
  const handleDeleteClick = (sale: any) => {
    setDeletingSale(sale);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingSale) return;

    try {
      setIsDeleting(true);
      const saleId = deletingSale?.SaleID || deletingSale?.id || deletingSale;
      if (!saleId) throw new Error("Sale id not found");
      
      await deleteSale(saleId).unwrap();
      toast.success("تم حذف عملية البيع بنجاح");
      setDeletingSale(null);
      
      // التحديث التلقائي للجدول - RTK Query سيقوم بالتحديث تلقائياً
      // لكن يمكننا إضافة refetch للتأكد من التحديث الفوري
      refetch();
    } catch (error) {
      const msg = (error as any)?.data?.message || (error as any)?.message || "حدث خطأ أثناء حذف عملية البيع";
      toast.error(msg);
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date with Arabic numerals
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">قائمة المبيعات</h1>
          <p className="text-gray-600">عرض وإدارة عمليات البيع</p>
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
              إجمالي النتائج: {salesData?.total || 0}
            </div>
          </div>
        </div>

        {/* Sales Table */}
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
                    سعر البيع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبلغ الإجمالي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ البيع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesData?.data?.map((sale) => (
                  <tr key={sale.SaleID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.BillNum}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{sale.Customer?.Customer}</div>
                        <div className="text-gray-500 text-xs">
                          {sale.Customer?.NationalNumber && `رقم وطني: ${sale.Customer.NationalNumber}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.Carrence?.Carrency} ({sale.Carrence?.CarrencyCode})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(sale.Value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(sale.SalePrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(sale.TotalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(sale.SaleDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteClick(sale)}
                          disabled={isDeleting}
                          className={`text-red-600 hover:text-red-900 px-3 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors ${
                            isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {isDeleting ? 'جاري الحذف...' : 'حذف'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {salesData && salesData.totalPages > 1 && (
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm text-gray-700">
                  صفحة {currentPage} من {salesData.totalPages}
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, salesData.totalPages))}
                  disabled={currentPage === salesData.totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  التالي
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {salesData?.data?.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">لا توجد عمليات بيع</div>
            </div>
          )}
        </div>

  {/* Editing disabled per request - removed UI */}

        {/* Delete Confirmation Modal */}
        {deletingSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[3]">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">تأكيد الحذف</h2>
                <p className="text-gray-600">
                  هل أنت متأكد من حذف عملية البيع رقم <span className="font-medium">{deletingSale.BillNum}</span>؟
                </p>
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ هذا الإجراء لا يمكن التراجع عنه
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className={`flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors ${
                    isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isDeleting ? 'جاري الحذف...' : 'نعم، احذف'}
                </button>
                <button
                  onClick={() => setDeletingSale(null)}
                  disabled={isDeleting}
                  className={`flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors ${
                    isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
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

