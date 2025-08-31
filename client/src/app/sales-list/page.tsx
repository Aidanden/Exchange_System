"use client";

import React, { useState } from "react";
import { useListSalesQuery, useDeleteSaleMutation, useUpdateSaleMutation } from "@/state/salesApi";
import { useGetCurrenciesQuery } from "@/state/currenciesApi";
import { useListCustomersQuery } from "@/state/customersApi";
import { Decimal } from "decimal.js";
import { toast, Toaster } from "react-hot-toast";

interface SaleFormData {
  CarID: string;
  Value: string;
  SalePrice: string;
  TotalPrice: string;
  CustID: string;
  FirstNum: string;
  LastNum: string;
  PaymentCurrencyID: string;
}

export default function SalesListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSale, setEditingSale] = useState<any>(null);
  const [deletingSale, setDeletingSale] = useState<any>(null);
  const [editForm, setEditForm] = useState<SaleFormData>({
    CarID: "",
    Value: "",
    SalePrice: "",
    TotalPrice: "",
    CustID: "",
    FirstNum: "",
    LastNum: "",
    PaymentCurrencyID: "",
  });

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

  const { data: currencies } = useGetCurrenciesQuery();
  const { data: customersData } = useListCustomersQuery({
    customerType: true,
    limit: 1000,
  });

  const [deleteSale] = useDeleteSaleMutation();
  const [updateSale] = useUpdateSaleMutation();

  // Calculate total price when value or sale price changes
  React.useEffect(() => {
    if (editForm.Value && editForm.SalePrice) {
      try {
        const value = new Decimal(editForm.Value);
        const price = new Decimal(editForm.SalePrice);
        const total = value.mul(price);
        setEditForm(prev => ({ ...prev, TotalPrice: total.toString() }));
      } catch (error) {
        console.error("Error calculating total:", error);
      }
    }
  }, [editForm.Value, editForm.SalePrice]);

  // Handle edit button click
  const handleEditClick = (sale: any) => {
    setEditingSale(sale);
    setEditForm({
      CarID: sale.CarID,
      Value: sale.Value.toString(),
      SalePrice: sale.SalePrice.toString(),
      TotalPrice: sale.TotalPrice.toString(),
      CustID: sale.CustID,
      FirstNum: sale.FirstNum || "",
      LastNum: sale.LastNum || "",
      PaymentCurrencyID: sale.CarID, // Default to same currency
    });
  };

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingSale) return;

    try {
      await updateSale({
        id: editingSale.SaleID,
        data: {
          CarID: editForm.CarID,
          Value: new Decimal(editForm.Value),
          SalePrice: new Decimal(editForm.SalePrice),
          TotalPrice: new Decimal(editForm.TotalPrice),
          CustID: editForm.CustID,
          FirstNum: editForm.FirstNum || null,
          LastNum: editForm.LastNum || null,
        },
      }).unwrap();
      
      toast.success("تم تعديل عملية البيع بنجاح");
      setEditingSale(null);
      refetch();
    } catch (error) {
      toast.error("حدث خطأ أثناء تعديل عملية البيع");
      console.error(error);
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (sale: any) => {
    setDeletingSale(sale);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingSale) return;

    try {
      await deleteSale(deletingSale.SaleID).unwrap();
      toast.success("تم حذف عملية البيع بنجاح");
      setDeletingSale(null);
      refetch();
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف عملية البيع");
      console.error(error);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format number
  const formatNumber = (num: any) => {
    if (!num) return "0";
    return new Decimal(num).toFixed(4);
  };

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
                          onClick={() => handleEditClick(sale)}
                          className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteClick(sale)}
                          className="text-red-600 hover:text-red-900 px-3 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          حذف
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

        {/* Edit Modal */}
        {editingSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">تعديل عملية البيع</h2>
                <button
                  onClick={() => setEditingSale(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      العملة
                    </label>
                    <select
                      value={editForm.CarID}
                      onChange={(e) => setEditForm(prev => ({ ...prev, CarID: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">اختر العملة</option>
                      {currencies?.map((currency) => (
                        <option key={currency.CarID} value={currency.CarID}>
                          {currency.Carrency} ({currency.CarrencyCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      العميل
                    </label>
                    <select
                      value={editForm.CustID}
                      onChange={(e) => setEditForm(prev => ({ ...prev, CustID: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">اختر العميل</option>
                      {customersData?.data?.map((customer) => (
                        <option key={customer.CustID} value={customer.CustID}>
                          {customer.Customer}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الكمية
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editForm.Value}
                      onChange={(e) => setEditForm(prev => ({ ...prev, Value: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      سعر البيع
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editForm.SalePrice}
                      onChange={(e) => setEditForm(prev => ({ ...prev, SalePrice: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      السعر الإجمالي
                    </label>
                    <input
                      type="text"
                      value={editForm.TotalPrice}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      أول رقم
                    </label>
                    <input
                      type="text"
                      value={editForm.FirstNum}
                      onChange={(e) => setEditForm(prev => ({ ...prev, FirstNum: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      آخر رقم
                    </label>
                    <input
                      type="text"
                      value={editForm.LastNum}
                      onChange={(e) => setEditForm(prev => ({ ...prev, LastNum: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    حفظ التعديلات
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSale(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  نعم، احذف
                </button>
                <button
                  onClick={() => setDeletingSale(null)}
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

