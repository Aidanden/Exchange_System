"use client";

import React, { useState } from "react";
import { useCreateDebtMutation } from "@/state/debtsApi";
import { useGetCurrenciesQuery } from "@/state/currenciesApi";
import { toast, Toaster } from "react-hot-toast";
import { formatNumber } from "@/utils/formatNumber";
import { Decimal } from "decimal.js";

interface DebtFormData {
  DebtType: "TAKEN" | "GIVEN";
  DebtorName: string;
  DebtorPhone: string;
  DebtorAddress: string;
  CarID: string;
  Amount: string;
  Description: string;
}

export default function DebtsPage() {
  const [debtForm, setDebtForm] = useState<DebtFormData>({
    DebtType: "TAKEN",
    DebtorName: "",
    DebtorPhone: "",
    DebtorAddress: "",
    CarID: "",
    Amount: "",
    Description: "",
  });

  // API hooks
  const { data: currencies } = useGetCurrenciesQuery();
  const [createDebt, { isLoading }] = useCreateDebtMutation();

  // Helper function to parse formatted number input
  const parseFormattedNumber = (value: string): string => {
    return value.replace(/,/g, '');
  };

  // Helper function to format number for display in input
  const formatNumberForInput = (value: string): string => {
    if (!value) return '';
    try {
      const cleanValue = parseFormattedNumber(value);
      if (cleanValue === '') return '';
      
      if (cleanValue.endsWith('.')) {
        const baseNum = parseFloat(cleanValue.slice(0, -1));
        if (isNaN(baseNum)) return value;
        return baseNum.toLocaleString('en-US') + '.';
      }
      
      const num = parseFloat(cleanValue);
      if (isNaN(num)) return value;
      
      const decimalPart = cleanValue.split('.')[1];
      const decimalPlaces = decimalPart ? decimalPart.length : 0;
      
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: Math.max(decimalPlaces, 4)
      });
    } catch {
      return value;
    }
  };

  // Helper function to validate numeric input with decimals
  const isValidNumericInput = (value: string): boolean => {
    const cleanValue = value.replace(/,/g, '');
    return /^\d*\.?\d*$/.test(cleanValue);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!debtForm.DebtorName || !debtForm.CarID || !debtForm.Amount) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      const cleanAmount = parseFormattedNumber(debtForm.Amount);
      const debtData = {
        ...debtForm,
        Amount: cleanAmount,
        UserID: "9e2895ae-4afe-4ff2-b3b3-be15cf1c82d6", // Default user ID
      };
      
      // Debug: Log the data being sent
      console.log("Sending debt data:", JSON.stringify(debtData, null, 2));
      
      await createDebt(debtData).unwrap();
      
      toast.success(`تم تسجيل ${debtForm.DebtType === "TAKEN" ? "الاستذانة" : "الإقراض"} بنجاح`);
      
      // Reset form
      setDebtForm({
        DebtType: "TAKEN",
        DebtorName: "",
        DebtorPhone: "",
        DebtorAddress: "",
        CarID: "",
        Amount: "",
        Description: "",
      });
    } catch (error: any) {
      // Extract meaningful error message
      let errorMessage = "حدث خطأ أثناء تسجيل العملية";
      
      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.status === 404) {
        errorMessage = "خطأ: لم يتم العثور على الخدمة. تأكد من تشغيل الخادم";
      } else if (error?.status) {
        errorMessage = `خطأ في الخادم (${error.status})`;
      }
      
      toast.error(errorMessage);
      
      // Comprehensive error logging
      console.group("🚨 Debt Creation Error");
      console.error("Error object:", error);
      console.error("Error type:", typeof error);
      console.error("Error constructor:", error?.constructor?.name);
      
      // Try different ways to extract error information
      try {
        console.error("JSON.stringify:", JSON.stringify(error, null, 2));
      } catch (e) {
        console.error("Cannot stringify error:", e);
      }
      
      // Log all enumerable properties
      console.error("Object.keys:", Object.keys(error));
      console.error("Object.getOwnPropertyNames:", Object.getOwnPropertyNames(error));
      
      // RTK Query specific error properties
      console.error("RTK Query Error Details:", {
        status: error?.status,
        data: error?.data,
        error: error?.error,
        message: error?.message,
        originalStatus: error?.originalStatus,
        endpointName: error?.endpointName,
        isUnhandledError: error?.isUnhandledError
      });
      
      console.groupEnd();
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الديون</h1>
          <p className="text-gray-600">تسجيل عمليات الاستذانة والإقراض</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Debt Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                نوع العملية
              </label>
              <div className="flex gap-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="debtType"
                    value="TAKEN"
                    checked={debtForm.DebtType === "TAKEN"}
                    onChange={(e) => setDebtForm(prev => ({ ...prev, DebtType: e.target.value as "TAKEN" | "GIVEN" }))}
                    className="mr-2"
                  />
                  <span className="text-blue-600 font-medium">استذانة (أخذ دين)</span>
                  <span className="text-sm text-gray-500 mr-2">- استلام مبلغ من شخص أو شركة</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="debtType"
                    value="GIVEN"
                    checked={debtForm.DebtType === "GIVEN"}
                    onChange={(e) => setDebtForm(prev => ({ ...prev, DebtType: e.target.value as "TAKEN" | "GIVEN" }))}
                    className="mr-2"
                  />
                  <span className="text-green-600 font-medium">إقراض (إعطاء دين)</span>
                  <span className="text-sm text-gray-500 mr-2">- إعطاء مبلغ لشخص أو شركة</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Debtor Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  بيانات {debtForm.DebtType === "TAKEN" ? "المقرض" : "المقترض"}
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الاسم *
                  </label>
                  <input
                    type="text"
                    value={debtForm.DebtorName}
                    onChange={(e) => setDebtForm(prev => ({ ...prev, DebtorName: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    value={debtForm.DebtorPhone}
                    onChange={(e) => setDebtForm(prev => ({ ...prev, DebtorPhone: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    العنوان
                  </label>
                  <textarea
                    value={debtForm.DebtorAddress}
                    onChange={(e) => setDebtForm(prev => ({ ...prev, DebtorAddress: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>

              {/* Debt Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">تفاصيل الدين</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    العملة *
                  </label>
                  <select
                    value={debtForm.CarID}
                    onChange={(e) => setDebtForm(prev => ({ ...prev, CarID: e.target.value }))}
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
                    المبلغ *
                  </label>
                  <input
                    type="text"
                    value={debtForm.Amount ? formatNumberForInput(debtForm.Amount) : ""}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (isValidNumericInput(inputValue)) {
                        const cleanValue = parseFormattedNumber(inputValue);
                        setDebtForm(prev => ({ ...prev, Amount: cleanValue }));
                      }
                    }}
                    placeholder="مثال: 10,000.50"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الوصف
                  </label>
                  <textarea
                    value={debtForm.Description}
                    onChange={(e) => setDebtForm(prev => ({ ...prev, Description: e.target.value }))}
                    placeholder="تفاصيل إضافية حول الدين..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Information Box */}
            <div className={`p-4 rounded-lg border ${
              debtForm.DebtType === "TAKEN" 
                ? "bg-blue-50 border-blue-200" 
                : "bg-green-50 border-green-200"
            }`}>
              <div className="flex items-start">
                <div className={`rounded-full p-1 mr-3 ${
                  debtForm.DebtType === "TAKEN" ? "bg-blue-100" : "bg-green-100"
                }`}>
                  <span className="text-xl">
                    {debtForm.DebtType === "TAKEN" ? "📥" : "📤"}
                  </span>
                </div>
                <div>
                  <h4 className={`font-medium ${
                    debtForm.DebtType === "TAKEN" ? "text-blue-800" : "text-green-800"
                  }`}>
                    {debtForm.DebtType === "TAKEN" ? "استذانة (أخذ دين)" : "إقراض (إعطاء دين)"}
                  </h4>
                  <p className={`text-sm ${
                    debtForm.DebtType === "TAKEN" ? "text-blue-600" : "text-green-600"
                  }`}>
                    {debtForm.DebtType === "TAKEN" 
                      ? "سيتم إضافة المبلغ إلى رصيد العملة المختارة وتسجيله في حركات الخزينة"
                      : "سيتم خصم المبلغ من رصيد العملة المختارة وتسجيله في حركات الخزينة"
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !debtForm.DebtorName || !debtForm.CarID || !debtForm.Amount}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                debtForm.DebtType === "TAKEN"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              } disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              {isLoading 
                ? "جاري التسجيل..." 
                : `تسجيل ${debtForm.DebtType === "TAKEN" ? "الاستذانة" : "الإقراض"}`
              }
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

