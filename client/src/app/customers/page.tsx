"use client";
import { useMemo, useState } from "react";
import { useListCustomersQuery, useDeleteCustomerMutation, useAddCustomerMutation, useUpdateCustomerMutation } from "@/state/customersApi";
import { useGetNationalitiesQuery } from "@/state/nationalitsApi";
import { Customers, Nationality } from "@/state/types";
import { toast, Toaster } from "react-hot-toast";

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const { data, isFetching, refetch } = useListCustomersQuery({ page, limit, search });
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation();

  const rows = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

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

  if (isFetching && page === 1) {
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

        {/* Search and Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="البحث بالاسم / الهاتف / العنوان..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="text-sm text-gray-600">
              إجمالي النتائج: {data?.total || 0}
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
                    رقم وطني
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم جواز السفر
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
          {!isFetching && rows.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">لا توجد زبائن</div>
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
  const { refetch } = useListCustomersQuery({});

  const { data: nationalities, isFetching: isFetchingNationalities } = useGetNationalitiesQuery();

  // listen for open event
  useMemo(() => {
    const handler = (e: any) => {
      const detail = e.detail || {};
      setOpenState({ open: true, mode: detail.mode, customer: detail.customer });
      setForm(detail.customer ?? {});
    };
    window.addEventListener("open-customer-modal", handler);
    return () => window.removeEventListener("open-customer-modal", handler);
  }, []);

  if (!openState.open) return null;

  const onClose = () => setOpenState({ open: false, mode: "create" });
  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.Customer || !form.NatID) {
      toast.error("الاسم والجنسية مطلوبة");
      return;
    }
    
    try {
      if (openState.mode === "create") {
        await addCustomer(form as any).unwrap();
        toast.success("تم إضافة الزبون بنجاح!");
      } else if (openState.mode === "edit" && openState.customer) {
        await updateCustomer({ ...(form as any), CustID: openState.customer.CustID }).unwrap();
        toast.success("تم تعديل الزبون بنجاح!");
      }
      // إضافة refetch كإضافة أمان لضمان التحديث
      refetch();
      onClose();
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ البيانات");
      console.error(error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onKeyDown={handleKeyDown}>
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


