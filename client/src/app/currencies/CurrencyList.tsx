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

const CurrencyList = () => {
  const { data: currencies, isLoading, error } = useGetCurrenciesQuery();
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
      alert("يجب كتابة اسم العملة.");
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
      alert("تمت إضافة العملة بنجاح!");
    } catch (e: any) {
      alert(e?.data?.error || "حدث خطأ أثناء إضافة العملة.");
    }
  };

  const handleEditClick = (currency: Currency) => {
    setCurrentEditData(currency);
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!currentEditData?.Carrency) {
      alert("يجب كتابة اسم العملة.");
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
      alert("تم التعديل بنجاح!");
    } catch (e: any) {
      console.error("Error updating currency:", e);
      alert(e?.data?.error || "حدث خطأ أثناء التعديل.");
    }
  };

  const handleDelete = async (carID: string, currencyName: string, _balance: any) => {
    const confirmDelete = confirm(`هل أنت متأكد من حذف العملة "${currencyName}"؟`);
    if (confirmDelete) {
      try {
        setDeletingId(carID);
        await deleteCurrency(carID).unwrap();
        alert("تم حذف العملة بنجاح!");
      } catch (e: any) {
        console.error("Error deleting currency:", e);
        const msg = e?.data?.message || e?.data?.error || e?.error || "حدث خطأ أثناء حذف العملة.";
        alert(msg);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const openBalanceModal = (carID: string) => {
    setBalanceCarID(carID);
    setBalanceAmount("");
    setBalanceModalOpen(true);
  };

  const submitAddBalance = async () => {
    if (!balanceCarID) return;
    const amount = Number(balanceAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("يرجى إدخال مبلغ صالح أكبر من صفر.");
      return;
    }
    try {
      await addCurrencyBalance({ carID: balanceCarID, amount }).unwrap();
      setBalanceModalOpen(false);
      alert("تمت إضافة الرصيد وتسجيل الحركة.");
    } catch (e: any) {
      console.error(e);
      alert(e?.data?.error || e?.error || "تعذر إضافة الرصيد.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex items-center gap-2">
          <Coins className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-lg">جارٍ تحميل العملات...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center mt-10 p-4 bg-red-50 rounded-lg">
        <Coins className="w-12 h-12 mx-auto mb-2 text-red-400" />
        <p className="text-lg font-semibold">حدث خطأ أثناء تحميل البيانات</p>
        <p className="text-sm mt-1">يرجى المحاولة مرة أخرى لاحقاً</p>
      </div>
    );
  }

  const filteredCurrencies = currencies?.filter((currency: Currency) =>
    currency.Carrency.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.CarrencyCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Coins className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">إدارة العملات</h1>
        </div>

        {/* نموذج الإضافة */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-700">إضافة عملة جديدة</h2>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <input
              type="text"
              value={newCurrencyName}
              onChange={(e) => setNewCurrencyName(e.target.value)}
              placeholder="اسم العملة (مثل: الدولار الأمريكي)"
              className="flex-1 min-w-64 rounded-lg border border-gray-300 bg-white py-3 px-4 text-base text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <input
              type="text"
              value={newCurrencyCode}
              onChange={(e) => setNewCurrencyCode(e.target.value)}
              placeholder="رمز العملة (مثل: USD)"
              className="w-48 rounded-lg border border-gray-300 bg-white py-3 px-4 text-base text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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

        {/* خانة البحث */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن عملة..."
              className="w-full py-3 pr-10 pl-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* قائمة العملات */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <Coins className="w-5 h-5 text-blue-600" />
              قائمة العملات ({filteredCurrencies?.length || 0})
            </h2>
          </div>
          
          {!filteredCurrencies?.length ? (
            <div className="text-center py-12">
              <Coins className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">لا توجد عملات مطابقة للبحث</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCurrencies.map((currency: Currency) => (
                <div
                  key={currency.CarID}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {currency.Carrency}
                        </h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {currency.CarrencyCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>الرصيد: {getNumericBalance(currency.Balance)}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 transition-colors"
                        onClick={() => openBalanceModal(currency.CarID)}
                      >
                        إضافة رصيد
                      </button>
                      <button
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-sm hover:bg-yellow-600 transition-colors flex items-center gap-1"
                        onClick={() => handleEditClick(currency)}
                      >
                        <Edit className="w-4 h-4" />
                        تعديل
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition-colors flex items-center gap-1"
                        onClick={() => handleDelete(currency.CarID, currency.Carrency, currency.Balance)}
                        aria-busy={deletingId === currency.CarID}
                      >
                        {deletingId === currency.CarID ? (
                          <span className="animate-pulse">جارِ الحذف...</span>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            حذف
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* نافذة التعديل */}
        {isEditModalOpen && currentEditData && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center gap-2 mb-4">
                <Edit className="w-5 h-5 text-yellow-600" />
                <h2 className="text-xl font-bold text-gray-800">تعديل العملة</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم العملة
                  </label>
                  <input
                    type="text"
                    value={currentEditData.Carrency || ""}
                    onChange={(e) =>
                      setCurrentEditData({
                        ...currentEditData,
                        Carrency: e.target.value,
                      })
                    }
                    placeholder="اسم العملة"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رمز العملة
                  </label>
                  <input
                    type="text"
                    value={currentEditData.CarrencyCode || ""}
                    onChange={(e) =>
                      setCurrentEditData({
                        ...currentEditData,
                        CarrencyCode: e.target.value,
                      })
                    }
                    placeholder="رمز العملة"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  onClick={() => setEditModalOpen(false)}
                >
                  إلغاء
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                  onClick={handleEditSave}
                >
                  <Edit className="w-4 h-4" />
                  حفظ التعديلات
                </button>
              </div>
            </div>
          </div>
        )}

        {isBalanceModalOpen && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm mx-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4">إضافة رصيد</h3>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">المبلغ</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  onClick={() => setBalanceModalOpen(false)}
                >
                  إلغاء
                </button>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  onClick={submitAddBalance}
                >
                  إضافة
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrencyList;
