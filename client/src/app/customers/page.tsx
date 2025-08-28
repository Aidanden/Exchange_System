"use client";
import { useMemo, useState } from "react";
import { useListCustomersQuery, useDeleteCustomerMutation } from "@/state/customersApi";
import { useGetNationalitiesQuery } from "@/state/nationalitsApi";
import { Customers, Nationality } from "@/state/types";

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const { data, isFetching } = useListCustomersQuery({ page, limit, search });
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation();

  const rows = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleDelete = async (cust: Customers) => {
    if (!confirm(`حذف الزبون ${cust.Customer}?`)) return;
    await deleteCustomer(cust.CustID);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <input
          className="border px-3 py-2 rounded w-64"
          placeholder="بحث بالاسم / الهاتف / العنوان"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <button
          className="px-3 py-2 bg-blue-600 text-white rounded"
          onClick={() => setPage(1)}
        >
          بحث
        </button>
        <button
          className="ml-auto px-3 py-2 bg-green-600 text-white rounded"
          onClick={() => window.dispatchEvent(new CustomEvent("open-customer-modal", { detail: { mode: "create" } }))}
        >
          إضافة زبون
        </button>
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-right">الاسم</th>
              <th className="p-2 text-right">الجنسية</th>
              <th className="p-2 text-right">الهاتف</th>
              <th className="p-2 text-right">العنوان</th>
              <th className="p-2 text-right">رقم وطني</th>
              <th className="p-2 text-right">عمليات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.CustID} className="border-t">
                <td className="p-2">{c.Customer}</td>
                <td className="p-2">{c.Nationality?.Nationality ?? "-"}</td>
                <td className="p-2">{c.Phone ?? "-"}</td>
                <td className="p-2">{c.Address ?? "-"}</td>
                <td className="p-2">{c.NationalNumber ?? "-"}</td>
                <td className="p-2 space-x-4">
                  <button
                    className="px-2 py-1 bg-amber-500 text-white rounded mr-4"
                    onClick={() => window.dispatchEvent(new CustomEvent("open-customer-modal", { detail: { mode: "edit", customer: c } }))}
                  >
                    تعديل
                  </button>
                  <button
                    className="px-2 py-1 bg-red-600 text-white rounded"
                    disabled={isDeleting}
                    onClick={() => handleDelete(c)}
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
            {!isFetching && rows.length === 0 && (
              <tr>
                <td className="p-4 text-center" colSpan={6}>لا توجد نتائج</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <button disabled={page <= 1}
          className="px-3 py-2 border rounded disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}>السابق</button>
        <div>صفحة {page} من {totalPages}</div>
        <button disabled={page >= totalPages}
          className="px-3 py-2 border rounded disabled:opacity-50"
          onClick={() => setPage((p) => p + 1)}>التالي</button>
      </div>

      <CustomerModal />
    </div>
  );
}

function CustomerModal() {
  const [openState, setOpenState] = useState<{ open: boolean; mode: "create" | "edit"; customer?: Customers }>(
    { open: false, mode: "create" }
  );
  const [form, setForm] = useState<Partial<Customers>>({});
  const [addCustomer, { isLoading: isSaving1 }] = (require("@/state/customersApi") as typeof import("@/state/customersApi")).useAddCustomerMutation();
  const [updateCustomer, { isLoading: isSaving2 }] = (require("@/state/customersApi") as typeof import("@/state/customersApi")).useUpdateCustomerMutation();

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
  const onSubmit = async () => {
    if (!form.Customer || !form.NatID) return alert("الاسم والجنسية مطلوبة");
    if (openState.mode === "create") {
      await addCustomer(form as any).unwrap();
    } else if (openState.mode === "edit" && openState.customer) {
      await updateCustomer({ ...(form as any), CustID: openState.customer.CustID }).unwrap();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-white w-full max-w-xl rounded p-4 space-y-3">
        <div className="text-lg font-semibold">{openState.mode === "create" ? "إضافة زبون" : "تعديل زبون"}</div>
        <div className="grid grid-cols-2 gap-3">
          <input className="border px-3 py-2 rounded" placeholder="الاسم" value={form.Customer ?? ""} onChange={e => setForm({ ...form, Customer: e.target.value })} />
          <select className="border px-3 py-2 rounded" value={form.NatID ?? ""} onChange={e => setForm({ ...form, NatID: e.target.value })} disabled={isFetchingNationalities}>
            <option value="">اختر الجنسية</option>
            {nationalities?.map((nat: Nationality) => (
              <option key={nat.NatID} value={nat.NatID}>{nat.Nationality}</option>
            ))}
          </select>
          <input className="border px-3 py-2 rounded" placeholder="الهاتف" value={form.Phone ?? ""} onChange={e => setForm({ ...form, Phone: e.target.value })} />
          <input className="border px-3 py-2 rounded" placeholder="العنوان" value={form.Address ?? ""} onChange={e => setForm({ ...form, Address: e.target.value })} />
          <input className="border px-3 py-2 rounded" placeholder="رقم وطني" value={form.NationalNumber ?? ""} onChange={e => setForm({ ...form, NationalNumber: e.target.value })} />
          <input className="border px-3 py-2 rounded" placeholder="رقم جواز" value={form.passportNumber ?? ""} onChange={e => setForm({ ...form, passportNumber: e.target.value })} />
        </div>
        <div className="flex gap-2 justify-end">
          <button className="px-3 py-2 border rounded" onClick={onClose}>إلغاء</button>
          <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={onSubmit} disabled={isSaving1 || isSaving2}>حفظ</button>
        </div>
      </div>
    </div>
  );
}


