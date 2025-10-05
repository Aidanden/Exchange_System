"use client";

import React, { useState, useEffect } from "react";
import { useGetCurrenciesQuery } from "@/state/currenciesApi";
import { useListCustomersQuery } from "@/state/customersApi";
import { useCreateBuyMutation } from "@/state/buysApi";
import { useAddCustomerMutation } from "@/state/customersApi";
import { useGetNationalitiesQuery } from "@/state/nationalitsApi";
import { Decimal } from "decimal.js";
import { toast, Toaster } from "react-hot-toast";
import { formatBalance } from "@/utils/formatNumber";
import PermissionGuard from "@/components/PermissionGuard";

// Helper functions for number formatting
const formatNumberWithCommas = (value: string): string => {
  if (!value) return "";
  const number = parseFloat(value.replace(/,/g, ""));
  if (isNaN(number)) return value;
  return number.toLocaleString('en-US', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 4 
  });
};

const getNumericValue = (value: string): string => {
  return value.replace(/,/g, "");
};

interface BuyFormData {
  CarID: string;
  Value: string;
  BuyPrice: string;
  TotalPrice: string;
  CustID: string;
  FirstNum: string;
  LastNum: string;
  PaymentCurrencyID: string;
}

interface CustomerFormData {
  Customer: string;
  NatID: string;
  passportNumber: string;
  ExpDate: string;
  ReleasePlace: string;
  NationalNumber: string;
  Address: string;
  Phone: string;
  CustomerType: boolean;
}

export default function BuysPage() {
  const [buySource, setBuySource] = useState<"market" | "centralBank">("market");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Display states for formatted inputs
  const [displayValue, setDisplayValue] = useState("");
  const [displayTotalPrice, setDisplayTotalPrice] = useState("");
  
  // Form states
  const [buyForm, setBuyForm] = useState<BuyFormData>({
    CarID: "",
    Value: "",
    BuyPrice: "",
    TotalPrice: "",
    CustID: "",
    FirstNum: "",
    LastNum: "",
    PaymentCurrencyID: "",
  });

  const [customerForm, setCustomerForm] = useState<CustomerFormData>({
    Customer: "",
    NatID: "",
    passportNumber: "",
    ExpDate: "",
    ReleasePlace: "",
    NationalNumber: "",
    Address: "",
    Phone: "",
    CustomerType: true,
  });

  // File upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // API hooks
  const { data: currencies, refetch: refetchCurrencies } = useGetCurrenciesQuery();
  const { data: nationalities } = useGetNationalitiesQuery();
  const { data: customersData, refetch: refetchCustomers } = useListCustomersQuery({
    customerType: buySource === "market" ? true : false,
    limit: 100,
  });
  const [createBuy] = useCreateBuyMutation();
  const [addCustomer] = useAddCustomerMutation();

  // إعادة تحميل أرصدة العملات عند تغيير مصدر الشراء
  useEffect(() => {
    refetchCurrencies();
  }, [buySource, refetchCurrencies]);

  // مسح البحث والعميل المختار عند تغيير مصدر الشراء
  useEffect(() => {
    setSearchTerm("");
    setSelectedCustomer(null);
    setBuyForm(prev => ({ ...prev, CustID: "" }));
  }, [buySource]);

  // Filter customers based on search
  const filteredCustomers = customersData?.data?.filter(customer =>
    customer.Customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.NationalNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.Phone?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Calculate total price when value or buy price changes
  useEffect(() => {
    if (buyForm.Value && buyForm.BuyPrice) {
      try {
        const value = new Decimal(buyForm.Value);
        const price = new Decimal(buyForm.BuyPrice);
        const total = value.mul(price);
        const totalString = total.toString();
        setBuyForm(prev => ({ ...prev, TotalPrice: totalString }));
        setDisplayTotalPrice(formatNumberWithCommas(totalString));
      } catch (error) {
        console.error("Error calculating total:", error);
      }
    } else {
      setBuyForm(prev => ({ ...prev, TotalPrice: "" }));
      setDisplayTotalPrice("");
    }
  }, [buyForm.Value, buyForm.BuyPrice]);

  // Handle value change with formatting
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = getNumericValue(inputValue);
    
    setBuyForm(prev => ({ ...prev, Value: numericValue }));
    setDisplayValue(formatNumberWithCommas(numericValue));
  };

  // Handle customer selection
  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setBuyForm(prev => ({ ...prev, CustID: customer.CustID }));
    setSearchTerm(customer.Customer);
  };

  // Handle file selection for passport documents
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

  // Remove selected file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload passport documents
  const uploadPassportDocuments = async (customerId: string) => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    
    selectedFiles.forEach((file, index) => {
      formData.append('documents', file);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/customers/${customerId}/passport-documents`, {
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
      } else {
        const error = await response.json();
        toast.error(error.error || "فشل في رفع الوثائق");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء رفع الوثائق");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle buy form submission
  const handleBuySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!buyForm.CustID || !buyForm.CarID || !buyForm.PaymentCurrencyID) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      await createBuy({
        ...buyForm,
        Value: new Decimal(buyForm.Value),
        BuyPrice: new Decimal(buyForm.BuyPrice),
        TotalPrice: new Decimal(buyForm.TotalPrice),
        UserID: "9e2895ae-4afe-4ff2-b3b3-be15cf1c82d6", // Default user ID
      }).unwrap();
      
      toast.success("تم إنشاء عملية الشراء بنجاح");
      
      // تحديث أرصدة العملات
      refetchCurrencies();
      
      // Reset form
      setBuyForm({
        CarID: "",
        Value: "",
        BuyPrice: "",
        TotalPrice: "",
        CustID: "",
        FirstNum: "",
        LastNum: "",
        PaymentCurrencyID: "",
      });
      setDisplayValue("");
      setDisplayTotalPrice("");
      setSelectedCustomer(null);
      setSearchTerm("");
    } catch (error) {
      toast.error("حدث خطأ أثناء إنشاء عملية الشراء");
      console.error(error);
    }
  };

  // Handle customer form submission
  const handleCustomerSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!customerForm.Customer || !customerForm.NatID) {
      toast.error("الاسم والجنسية مطلوبة");
      return;
    }
    
    try {
      const result = await addCustomer({
        ...customerForm,
        UserID: "9e2895ae-4afe-4ff2-b3b3-be15cf1c82d6", // Default user ID
      }).unwrap();
      
      const customerId = result.CustID;
      toast.success("تم إضافة الزبون بنجاح!");

      // Upload passport documents if any
      if (selectedFiles.length > 0) {
        await uploadPassportDocuments(customerId);
      }
      
      setShowAddCustomer(false);
      setCustomerForm({
        Customer: "",
        NatID: "",
        passportNumber: "",
        ExpDate: "",
        ReleasePlace: "",
        NationalNumber: "",
        Address: "",
        Phone: "",
        CustomerType: buySource === "market",
      });
      setSelectedFiles([]);
      refetchCustomers();
    } catch (error) {
      toast.error("حدث خطأ أثناء إضافة الزبون");
      console.error(error);
    }
  };

  return (
    <PermissionGuard requiredPermission="buys:create">
      <Toaster position="top-right" />
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">شاشة الشراء</h1>
          <p className="text-gray-600">إدارة عمليات شراء العملات</p>
        </div>

        {/* Source Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">مصدر الشراء</h2>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="buySource"
                value="market"
                checked={buySource === "market"}
                onChange={(e) => setBuySource(e.target.value as "market" | "centralBank")}
                className="mr-2"
              />
              <span>من السوق</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="buySource"
                value="centralBank"
                checked={buySource === "centralBank"}
                onChange={(e) => setBuySource(e.target.value as "market" | "centralBank")}
                className="mr-2"
              />
              <span>من مصرف ليبيا المركزي</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">اختيار العميل</h2>
              <button
                onClick={() => setShowAddCustomer(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                إضافة عميل جديد
              </button>
            </div>

            {/* Customer Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="البحث عن العميل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Customer List */}
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <div
                    key={customer.CustID}
                    onClick={() => handleCustomerSelect(customer)}
                    className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedCustomer?.CustID === customer.CustID ? "bg-blue-50 border-blue-200" : ""
                    }`}
                  >
                    <div className="font-medium">{customer.Customer}</div>
                    <div className="text-sm text-gray-600">
                      {customer.NationalNumber && `رقم وطني: ${customer.NationalNumber}`}
                      {customer.Phone && ` | هاتف: ${customer.Phone}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {customer.Nationality?.Nationality}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {customersData?.data?.length === 0 ? "لا يوجد عملاء" : "اكتب للبحث عن العملاء"}
                </div>
              )}
            </div>

            {/* Selected Customer Info */}
            {selectedCustomer && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">بيانات العميل المختار:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">الاسم:</span> {selectedCustomer.Customer}</div>
                  <div><span className="font-medium">رقم وطني:</span> {selectedCustomer.NationalNumber || "غير محدد"}</div>
                  <div><span className="font-medium">هاتف:</span> {selectedCustomer.Phone || "غير محدد"}</div>
                  <div><span className="font-medium">عنوان:</span> {selectedCustomer.Address || "غير محدد"}</div>
                  <div><span className="font-medium">جنسية:</span> {selectedCustomer.Nationality?.Nationality}</div>
                  <div><span className="font-medium">نوع العميل:</span> {selectedCustomer.CustomerType ? "سوق" : "مصرف مركزي"}</div>
                </div>
              </div>
            )}
          </div>

          {/* Buy Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">تفاصيل الشراء</h2>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>ملاحظة:</strong> سيتم توليد رقم الفاتورة تلقائياً عند إنشاء عملية الشراء
              </p>
            </div>
            
            <form onSubmit={handleBuySubmit} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  العملة المراد شراؤها
                </label>
                <select
                  value={buyForm.CarID}
                  onChange={(e) => setBuyForm(prev => ({ ...prev, CarID: e.target.value }))}
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
                  الكمية
                </label>
                <input
                  type="text"
                  value={displayValue}
                  onChange={handleValueChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: 1,000,000"
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  سعر الشراء
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={buyForm.BuyPrice}
                  onChange={(e) => setBuyForm(prev => ({ ...prev, BuyPrice: e.target.value }))}
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
                  value={displayTotalPrice}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  عملة الدفع
                </label>
                <select
                  value={buyForm.PaymentCurrencyID}
                  onChange={(e) => setBuyForm(prev => ({ ...prev, PaymentCurrencyID: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">اختر عملة الدفع</option>
                  {currencies?.map((currency) => (
                    <option key={currency.CarID} value={currency.CarID}>
                      {currency.Carrency} ({currency.CarrencyCode}) - الرصيد: {formatBalance(currency.Balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    أول رقم
                  </label>
                  <input
                    type="text"
                    value={buyForm.FirstNum}
                    onChange={(e) => setBuyForm(prev => ({ ...prev, FirstNum: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    آخر رقم
                  </label>
                  <input
                    type="text"
                    value={buyForm.LastNum}
                    onChange={(e) => setBuyForm(prev => ({ ...prev, LastNum: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!buyForm.CustID || !buyForm.CarID || !buyForm.PaymentCurrencyID}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                إنشاء عملية الشراء
              </button>
            </form>
          </div>
        </div>

        {/* Add Customer Modal */}
        {showAddCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 py-8 px-4">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mt-8 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">إضافة زبون</h2>
                <button
                  onClick={() => setShowAddCustomer(false)}
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
                    value={customerForm.Customer ?? ""}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, Customer: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الجنسية
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={customerForm.NatID ?? ""}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, NatID: e.target.value }))}
                  >
                    <option value="">اختر الجنسية</option>
                    {nationalities?.map((nat: any) => (
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
                    value={customerForm.Phone ?? ""}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, Phone: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    العنوان
                  </label>
                  <input
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="العنوان"
                    value={customerForm.Address ?? ""}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, Address: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم وطني
                  </label>
                  <input
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="رقم وطني"
                    value={customerForm.NationalNumber ?? ""}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, NationalNumber: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم جواز
                  </label>
                  <input
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="رقم جواز"
                    value={customerForm.passportNumber ?? ""}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, passportNumber: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    نوع العميل
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={customerForm.CustomerType === undefined ? "true" : String(customerForm.CustomerType)}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, CustomerType: e.target.value === "true" }))}
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
                  onClick={handleCustomerSubmit}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
