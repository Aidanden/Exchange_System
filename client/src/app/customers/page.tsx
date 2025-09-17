"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useListCustomersQuery, useDeleteCustomerMutation, useAddCustomerMutation, useUpdateCustomerMutation } from "@/state/customersApi";
import { useGetNationalitiesQuery } from "@/state/nationalitsApi";
import { Customers, Nationality } from "@/state/types";
import { Search, Filter } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

export default function CustomersPage() {
  // Get all customers without pagination for client-side filtering (like nationalities)
  const { data: allCustomersData, isFetching, refetch } = useListCustomersQuery({ page: 1, limit: 1000, search: "" });
  const { data: nationalities, isLoading: nationalitiesLoading } = useGetNationalitiesQuery();
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNationality, setSelectedNationality] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const allCustomers = allCustomersData?.data ?? [];

  // Filter customers based on search query, nationality, and customer type (exactly like nationalities)
  const filteredCustomers = useMemo(() => {
    if (!allCustomers) return [];
    
    return allCustomers.filter((customer) => {
      const matchesSearch = !searchQuery || 
        customer.Customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.Phone && customer.Phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (customer.Address && customer.Address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (customer.NationalNumber && customer.NationalNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (customer.passportNumber && customer.passportNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesNationality = !selectedNationality || customer.NatID === selectedNationality;
      
      return matchesSearch && matchesNationality;
    });
  }, [allCustomers, searchQuery, selectedNationality]);

  // Paginate filtered results
  const totalPages = Math.ceil(filteredCustomers.length / limit);
  const startIndex = (page - 1) * limit;
  const rows = filteredCustomers.slice(startIndex, startIndex + limit);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedNationality("");
    setPage(1);
  };

  const handleDelete = async (cust: Customers) => {
    setDeletingCustomer(cust);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCustomer) return;

    try {
      await deleteCustomer(deletingCustomer.CustID).unwrap();
      toast.success("تم حذف الزبون بنجاح!");
      setDeletingCustomer(null);
      refetch();
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الزبون");
      console.error(error);
    } finally {
      setDeletingCustomer(null);
    }
  };

  const [deletingCustomer, setDeletingCustomer] = useState<Customers | null>(null);

  // Listen for refresh events from document operations
  useEffect(() => {
    const handler = () => {
      refetch();
    };
    window.addEventListener("refresh-customers-list", handler);
    return () => window.removeEventListener("refresh-customers-list", handler);
  }, [refetch]);

  if (isFetching || nationalitiesLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">قائمة الزبائن</h1>
          <p className="text-gray-600">عرض وإدارة الزبائن المسجلين</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-700">البحث والفلترة</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                البحث
              </label>
              <input
                type="text"
                placeholder="البحث بالاسم / الهاتف / العنوان / رقم جواز..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Nationality Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الجنسية
              </label>
              <select
                value={selectedNationality}
                onChange={(e) => setSelectedNationality(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-sm text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">جميع الجنسيات</option>
                {nationalities?.map((nationality: Nationality) => (
                  <option key={nationality.NatID} value={nationality.NatID}>
                    {nationality.Nationality}
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
              عدد النتائج: {filteredCustomers.length} من أصل {allCustomers.length || 0}
            </div>
            
            <button
              className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors"
              onClick={() => window.dispatchEvent(new CustomEvent("open-customer-modal", { detail: { mode: "create" } }))}
            >
              إضافة زبون
            </button>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الاسم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الجنسية
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الهاتف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العنوان
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الرقم الوطني
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم جواز السفر
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    وثائق جواز السفر
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((c) => (
                  <tr key={c.CustID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {c.Customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {c.Nationality?.Nationality ?? "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {c.Phone ?? "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {c.Address ?? "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {c.NationalNumber ?? "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {c.passportNumber ?? "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(c as any).PassportDocuments && (c as any).PassportDocuments.length > 0 ? (
                        <button
                          onClick={() => window.dispatchEvent(new CustomEvent("open-passport-viewer", { detail: { customerId: c.CustID, customerName: c.Customer } }))}
                          className="text-green-600 hover:text-green-900 px-3 py-1 rounded bg-green-50 hover:bg-green-100 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          عرض ({(c as any).PassportDocuments.length})
                        </button>
                      ) : (
                        <span className="text-gray-400 px-3 py-1 rounded bg-gray-100 flex items-center gap-1 cursor-not-allowed">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                          غير متوفر
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.dispatchEvent(new CustomEvent("open-customer-modal", { detail: { mode: "edit", customer: c } }))}
                          className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          disabled={isDeleting}
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

          {/* Empty State */}
          {rows.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {searchQuery || selectedNationality ? "لا توجد نتائج تطابق البحث" : "لا توجد زبائن"}
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
        {deletingCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">تأكيد الحذف</h2>
                <p className="text-gray-600">
                  هل أنت متأكد من حذف الزبون <span className="font-medium">{deletingCustomer.Customer}</span>؟
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
                  onClick={() => setDeletingCustomer(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        <CustomerModal />
        <PassportDocumentsViewer />
      </div>
    </>
  );
}

function CustomerModal() {
  const [openState, setOpenState] = useState<{ open: boolean; mode: "create" | "edit"; customer?: Customers }>(
    { open: false, mode: "create" }
  );
  const [form, setForm] = useState<Partial<Customers>>({});
  const [addCustomer, { isLoading: isSaving1 }] = useAddCustomerMutation();
  const [updateCustomer, { isLoading: isSaving2 }] = useUpdateCustomerMutation();
  const { refetch } = useListCustomersQuery({ page: 1, limit: 10, search: "" });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);

  const { data: nationalities, isFetching: isFetchingNationalities } = useGetNationalitiesQuery();

  // listen for open event
  useMemo(() => {
    const handler = (e: any) => {
      const detail = e.detail || {};
      setOpenState({ open: true, mode: detail.mode, customer: detail.customer });
      // Set default CustomerType to true if not provided
      const customerData = detail.customer ?? {};
      if (customerData.CustomerType === undefined) {
        customerData.CustomerType = true;
      }
      setForm(customerData);
    };
    window.addEventListener("open-customer-modal", handler);
    return () => window.removeEventListener("open-customer-modal", handler);
  }, []);

  if (!openState.open) return null;

  const onClose = () => {
    setOpenState({ open: false, mode: "create" });
    setSelectedFiles([]);
    setUploadProgress({});
    setIsUploading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      if (!isValidType) {
        toast.error(`الملف ${file.name} غير مدعوم. يُسمح بالصور و PDF فقط`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`الملف ${file.name} كبير جداً. الحد الأقصى 10 ميجابايت`);
        return false;
      }
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPassportDocuments = async (customerId: string) => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    
    selectedFiles.forEach((file, index) => {
      formData.append('documents', file);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers/${customerId}/passport-documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`تم رفع ${selectedFiles.length} وثيقة بنجاح!`);
        setSelectedFiles([]);
        // Force refresh of customers list to update PassportDocuments
        await refetch();
        // Also trigger global refresh event
        window.dispatchEvent(new CustomEvent("refresh-customers-list"));
      } else {
        const error = await response.json();
        toast.error(error.error || "فشل في رفع الوثائق");
      }
    } catch (error) {
    
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.Customer || !form.NatID) {
      toast.error("الاسم والجنسية مطلوبة");
      return;
    }
    
    try {
      let customerId: string;
      
      if (openState.mode === "create") {
        const result = await addCustomer(form as any).unwrap();
        customerId = result.CustID;
        toast.success("تم إضافة الزبون بنجاح!");
      } else if (openState.mode === "edit" && openState.customer) {
        await updateCustomer({ ...(form as any), CustID: openState.customer.CustID }).unwrap();
        customerId = openState.customer.CustID;
        toast.success("تم تعديل الزبون بنجاح!");
      } else {
        return;
      }

      // Upload passport documents if any
      if (selectedFiles.length > 0) {
        await uploadPassportDocuments(customerId);
      }

      // Force refresh with a small delay to ensure backend has processed the documents
      setTimeout(async () => {
        await refetch();
        window.dispatchEvent(new CustomEvent("refresh-customers-list"));
      }, 500);
      onClose();
    } catch (error) {
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 py-8 px-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mt-8 overflow-y-auto" onKeyDown={handleKeyDown}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {openState.mode === "create" ? "إضافة زبون" : "تعديل زبون"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الاسم
            </label>
            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="الاسم"
              value={form.Customer ?? ""}
              onChange={e => setForm({ ...form, Customer: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الجنسية
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.NatID ?? ""}
              onChange={e => setForm({ ...form, NatID: e.target.value })}
              disabled={isFetchingNationalities}
            >
              <option value="">اختر الجنسية</option>
              {nationalities?.map((nat: Nationality) => (
                <option key={nat.NatID} value={nat.NatID}>{nat.Nationality}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الهاتف
            </label>
            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="الهاتف"
              value={form.Phone ?? ""}
              onChange={e => setForm({ ...form, Phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              العنوان
            </label>
            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="العنوان"
              value={form.Address ?? ""}
              onChange={e => setForm({ ...form, Address: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رقم وطني
            </label>
            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="رقم وطني"
              value={form.NationalNumber ?? ""}
              onChange={e => setForm({ ...form, NationalNumber: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رقم جواز
            </label>
            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="رقم جواز"
              value={form.passportNumber ?? ""}
              onChange={e => setForm({ ...form, passportNumber: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              نوع العميل
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={form.CustomerType === undefined ? "true" : String(form.CustomerType)}
              onChange={e => setForm({ ...form, CustomerType: e.target.value === "true" })}
            >
              <option value="true">السوق</option>
              <option value="false">مصرف ليبيا المركزي</option>
            </select>
          </div>
        </div>

        {/* Passport Documents Upload Section */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">وثائق جواز السفر</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رفع وثائق جواز السفر (صور أو PDF)
            </label>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              يمكنك رفع عدة ملفات (صور أو PDF). الحد الأقصى لحجم الملف: 10 ميجابايت
            </p>
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">الملفات المحددة:</h4>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {file.type.startsWith('image/') ? (
                          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSaving1 || isSaving2}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving1 || isSaving2 ? "جاري الحفظ..." : "حفظ"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

function PassportDocumentsViewer() {
  const [viewerState, setViewerState] = useState<{ open: boolean; customerId?: string; customerName?: string }>({
    open: false
  });
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Listen for open viewer event
  useMemo(() => {
    const handler = (e: any) => {
      const detail = e.detail || {};
      setViewerState({ 
        open: true, 
        customerId: detail.customerId, 
        customerName: detail.customerName 
      });
      if (detail.customerId) {
        fetchDocuments(detail.customerId);
      }
    };
    window.addEventListener("open-passport-viewer", handler);
    return () => window.removeEventListener("open-passport-viewer", handler);
  }, []);

  const fetchDocuments = async (customerId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/customers/${customerId}/passport-documents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const docs = await response.json();
        setDocuments(docs);
      } else {
        toast.error("فشل في تحميل الوثائق");
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/customers/${viewerState.customerId}/passport-documents/${documentId}/download`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("تم تحميل الملف بنجاح");
      } else {
        toast.error("فشل في تحميل الملف");
      }
    } catch (error) {
    
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الوثيقة؟")) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/customers/${viewerState.customerId}/passport-documents/${documentId}`,
        { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        toast.success("تم حذف الوثيقة بنجاح");
        await fetchDocuments(viewerState.customerId!);
        // Also refresh the main customers list
        window.dispatchEvent(new CustomEvent("refresh-customers-list"));
      } else {
        toast.error("فشل في حذف الوثيقة");
      }
    } catch (error) {
    
    }
  };

  const onClose = () => {
    setViewerState({ open: false });
    setDocuments([]);
  };

  if (!viewerState.open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            وثائق جواز السفر - {viewerState.customerName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-lg">جاري تحميل الوثائق...</div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500">لا توجد وثائق جواز سفر لهذا العميل</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div key={doc.DocumentID} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {doc.MimeType.startsWith('image/') ? (
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    <span className="text-xs text-gray-500">
                      {doc.DocumentType === 'PASSPORT_IMAGE' ? 'صورة' : 'PDF'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.DocumentID)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-900 truncate" title={doc.FileName}>
                    {doc.FileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(doc.FileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(doc.UploadDate).toLocaleDateString('ar-SA')}
                  </p>
                </div>

                <button
                  onClick={() => handleDownload(doc.DocumentID, doc.FileName)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  تحميل
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-400 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
