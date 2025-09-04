"use client";

import React, { useState } from "react";
import {
  useGetCurrenciesQuery,
  useAddCurrencyMutation,
  useUpdateCurrencyMutation,
  useDeleteCurrencyMutation,
} from "../../state/currenciesApi";
import { Currency } from "../../state/types";
import { Coins, Search, Plus, Edit, Trash2 } from "lucide-react";
import { useAddCurrencyBalanceMutation } from "../../state/currenciesApi";
import { toast, Toaster } from "react-hot-toast";
import Modal from "../../components/Modal";

const CurrencyList = () => {
  const { data: currencies, isLoading, error, refetch } = useGetCurrenciesQuery(undefined, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 30000, // إعادة تحميل كل 30 ثانية
  });
  const [addCurrency, { isLoading: isAdding, error: addError }] = useAddCurrencyMutation();
  const [updateCurrency] = useUpdateCurrencyMutation();
  const [deleteCurrency] = useDeleteCurrencyMutation();
  const [addCurrencyBalance] = useAddCurrencyBalanceMutation();

  const [newCurrencyName, setNewCurrencyName] = useState("");
  const [newCurrencyCode, setNewCurrencyCode] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [currentEditData, setCurrentEditData] = useState<Currency | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBalanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceCarID, setBalanceCarID] = useState<string | null>(null);
  const [balanceAmount, setBalanceAmount] = useState<string>("");
  const [displayBalanceAmount, setDisplayBalanceAmount] = useState<string>("");

  // دالة لتنسيق الأرقام مع الفواصل
  const formatNumberWithCommas = (value: string): string => {
    // إزالة جميع الفواصل الموجودة
    const cleanValue = value.replace(/,/g, '');
    
    // التحقق من أن القيمة رقم صالح
    if (!/^\d*\.?\d*$/.test(cleanValue)) {
      return value;
    }
    
    // تقسيم الرقم إلى جزء صحيح وجزء عشري
    const parts = cleanValue.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    // إضافة الفواصل للجزء الصحيح
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // إعادة تجميع الرقم
    return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  };

  // دالة لإزالة الفواصل والحصول على القيمة الرقمية
  const getNumericValue = (formattedValue: string): string => {
    return formattedValue.replace(/,/g, '');
  };

  // التعامل مع تغيير قيمة الرصيد
  const handleBalanceAmountChange = (value: string) => {
    const formattedValue = formatNumberWithCommas(value);
    setDisplayBalanceAmount(formattedValue);
    setBalanceAmount(getNumericValue(formattedValue));
  };

  const getNumericBalance = (balance: any): number => {
    if (balance == null) return 0;
    try {
      if (typeof balance === "object" && typeof (balance as any).toString === "function") {
        const n = Number((balance as any).toString());
        return isNaN(n) ? 0 : n;
      }
      const n = Number(balance as any);
      return isNaN(n) ? 0 : n;
    } catch {
      return 0;
    }
  };

  const handleAdd = async () => {
    if (!newCurrencyName) {
      toast.error("يجب كتابة اسم العملة.");
      return;
    }
    try {
      const newCurrency: any = {
        Carrency: newCurrencyName,
      };
      if (newCurrencyCode.trim().length > 0) {
        newCurrency.CarrencyCode = newCurrencyCode;
      }
      await addCurrency(newCurrency).unwrap();
      setNewCurrencyName("");
      setNewCurrencyCode("");
      toast.success("تمت إضافة العملة بنجاح!");
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.error || "حدث خطأ أثناء إضافة العملة.");
    }
  };

  const handleEditClick = (currency: Currency) => {
    setCurrentEditData(currency);
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!currentEditData?.Carrency) {
      toast.error("يجب كتابة اسم العملة.");
      return;
    }

    try {
      await updateCurrency({
        carID: currentEditData.CarID,
        data: {
          Carrency: currentEditData.Carrency,
          CarrencyCode: currentEditData.CarrencyCode || "",
        }
      }).unwrap();
      setEditModalOpen(false);
      toast.success("تم التعديل بنجاح!");
      refetch();
    } catch (e: any) {
      console.error("Error updating currency:", e);
      toast.error(e?.data?.error || "حدث خطأ أثناء التعديل.");
    }
  };

  const handleDelete = async (carID: string, currencyName: string, _balance: any) => {
    setDeletingId(carID);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      await deleteCurrency(deletingId).unwrap();
      toast.success("تم حذف العملة بنجاح!");
      setDeletingId(null);
      refetch();
    } catch (e: any) {
      console.error("Error deleting currency:", e);
      const msg = e?.data?.message || e?.data?.error || e?.error || "حدث خطأ أثناء حذف العملة.";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const openBalanceModal = (carID: string) => {
    console.log("Opening balance modal for carID:", carID);
    setBalanceCarID(carID);
    setBalanceAmount("");
    setDisplayBalanceAmount("");
    setBalanceModalOpen(true);
    console.log("Balance modal state set to true");
  };

  const submitAddBalance = async () => {
    if (!balanceCarID) return;
    const amount = Number(balanceAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("يرجى إدخال مبلغ صالح أكبر من صفر.");
      return;
    }
    try {
      await addCurrencyBalance({ carID: balanceCarID, amount }).unwrap();
      setBalanceModalOpen(false);
      toast.success("تمت إضافة الرصيد وتسجيل الحركة.");
      refetch();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.data?.error || e?.error || "تعذر إضافة الرصيد.");
    }
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

  const filteredCurrencies = currencies?.filter((currency: Currency) =>
    currency.Carrency.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (currency.CarrencyCode && currency.CarrencyCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">قائمة العملات</h1>
          <p className="text-gray-600">عرض وإدارة العملات المتاحة</p>
        </div>

        {/* نموذج الإضافة */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-700">إضافة عملة جديدة</h2>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <input
              type="text"
              value={newCurrencyName}
              onChange={(e) => setNewCurrencyName(e.target.value)}
              placeholder="اسم العملة (مثل: الدولار الامركي)"
              className="flex-1 min-w-0 p-3 border border-gray-300 rounded-lg bg-white text-sm text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <input
              type="text"
              value={newCurrencyCode}
              onChange={(e) => setNewCurrencyCode(e.target.value)}
              placeholder="رمز العملة (مثل: USD)"
              className="w-full md:w-48 p-3 rounded-lg border border-gray-300 bg-white text-sm text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center gap-2"
              onClick={handleAdd}
              disabled={isAdding}
            >
              <Plus className="w-4 h-4" />
              {isAdding ? "جارِ الإضافة..." : "إضافة العملة"}
            </button>
          </div>
          {addError && (
            <div className="text-red-500 mt-3 p-2 bg-red-50 rounded-md">
              {(addError as any)?.data?.error || "حدث خطأ أثناء إضافة العملة."}
            </div>
          )}
        </div>

        {/* Search and Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="البحث عن عملة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="text-sm text-gray-600">
              إجمالي النتائج: {filteredCurrencies?.length || 0}
            </div>
          </div>
        </div>

        {/* Currencies Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اسم العملة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رمز العملة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الرصيد الحالي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCurrencies?.map((currency) => (
                  <tr key={currency.CarID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {currency.Carrency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {currency.CarrencyCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getNumericBalance(currency.Balance).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openBalanceModal(currency.CarID)}
                          className="text-green-600 hover:text-green-900 px-3 py-1 rounded bg-green-50 hover:bg-green-100 transition-colors"
                        >
                          إضافة رصيد
                        </button>
                        <button
                          onClick={() => handleEditClick(currency)}
                          className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(currency.CarID, currency.Carrency, currency.Balance)}
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
          {filteredCurrencies?.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">لا توجد عملات</div>
            </div>
          )}
        </div>

                 {/* Edit Modal */}
         <Modal
           isOpen={isEditModalOpen}
           onClose={() => setEditModalOpen(false)}
           title="تعديل العملة"
           subtitle="تعديل بيانات العملة المحددة"
           size="md"
         >
           <div className="p-6">
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   اسم العملة
                 </label>
                 <input
                   type="text"
                   value={currentEditData?.Carrency || ""}
                   onChange={(e) =>
                     setCurrentEditData({
                       ...currentEditData!,
                       Carrency: e.target.value,
                     })
                   }
                   placeholder="اسم العملة"
                   className="modal-input"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   رمز العملة
                 </label>
                 <input
                   type="text"
                   value={currentEditData?.CarrencyCode || ""}
                   onChange={(e) =>
                     setCurrentEditData({
                       ...currentEditData!,
                       CarrencyCode: e.target.value,
                     })
                   }
                   placeholder="رمز العملة"
                   className="modal-input"
                 />
               </div>
             </div>
             
             <div className="flex justify-end gap-3 mt-6">
               <button
                 className="modal-button"
                 onClick={() => setEditModalOpen(false)}
               >
                 إلغاء
               </button>
               <button
                 className="modal-button-primary flex items-center gap-1"
                 onClick={handleEditSave}
               >
                 <Edit className="w-4 h-4" />
                 حفظ التعديلات
               </button>
             </div>
           </div>
         </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deletingId}
          onClose={() => setDeletingId(null)}
          title="تأكيد الحذف"
          subtitle="هل أنت متأكد من حذف هذه العملة؟"
          size="sm"
        >
          <div className="p-6">
            <div className="mb-4">
              <p className="text-gray-600">
                هذا الإجراء لا يمكن التراجع عنه.
              </p>
              <p className="text-sm text-red-600 mt-2">
                ⚠️ سيتم حذف جميع البيانات المتعلقة بهذه العملة
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="modal-button"
                onClick={() => setDeletingId(null)}
              >
                إلغاء
              </button>
              <button
                className="modal-button px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                onClick={handleDeleteConfirm}
              >
                نعم، احذف
              </button>
            </div>
          </div>
        </Modal>

                           {/* Balance Modal */}
          <Modal
           isOpen={isBalanceModalOpen}
           onClose={() => setBalanceModalOpen(false)}
           title="إضافة رصيد"
           subtitle="إضافة رصيد جديد للعملة المحددة"
           size="sm"
         >
           <div className="p-6">
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   المبلغ
                 </label>
                 <input
                   type="text"
                   inputMode="decimal"
                   value={displayBalanceAmount}
                   onChange={(e) => handleBalanceAmountChange(e.target.value)}
                   className="modal-input text-left"
                   placeholder="0"
                   dir="ltr"
                   style={{ textAlign: 'left' }}
                 />
                 <p className="text-xs text-gray-500 mt-1">
                   مثال: 1,000,000.50
                 </p>
               </div>
             </div>
             
             <div className="flex justify-end gap-3 mt-6">
               <button
                 className="modal-button"
                 onClick={() => setBalanceModalOpen(false)}
               >
                 إلغاء
               </button>
               <button
                 className="modal-button-primary"
                 onClick={submitAddBalance}
               >
                 إضافة الرصيد
               </button>
             </div>
           </div>
         </Modal>
      </div>
    </>
  );
};

export default CurrencyList;
