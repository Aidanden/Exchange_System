"use client";

import React, { useState, useEffect } from "react";
import { useGetCurrenciesQuery } from "@/state/currenciesApi";
import { useListCustomersQuery } from "@/state/customersApi";
import { useCreateSaleMutation } from "@/state/salesApi";
import { useAddCustomerMutation } from "@/state/customersApi";
import { useGetNationalitiesQuery } from "@/state/nationalitsApi";
import { Decimal } from "decimal.js";
import { toast, Toaster } from "react-hot-toast";
import { formatBalance, formatNumber } from "@/utils/formatNumber";
import PermissionGuard from "@/components/PermissionGuard";

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

interface CustomerFormData {
  Customer: string;
  NatID: string;
  passportNumber: string;
  NationalNumber: string;
  Address: string;
  Phone: string;
  CustomerType: boolean;
}

export default function SalesPage() {
  const [saleSource, setSaleSource] = useState<"market" | "centralBank">("market");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form states
  const [saleForm, setSaleForm] = useState<SaleFormData>({
    CarID: "",
    Value: "",
    SalePrice: "",
    TotalPrice: "",
    CustID: "",
    FirstNum: "",
    LastNum: "",
    PaymentCurrencyID: "",
  });

  // Helper function to parse formatted number input
  const parseFormattedNumber = (value: string): string => {
    // Remove commas and return the clean number string
    return value.replace(/,/g, '');
  };

  // Helper function to format number for display in input
  const formatNumberForInput = (value: string): string => {
    if (!value) return '';
    try {
      const cleanValue = parseFormattedNumber(value);
      if (cleanValue === '') return '';
      
      // If the value ends with a decimal point, preserve it
      if (cleanValue.endsWith('.')) {
        const baseNum = parseFloat(cleanValue.slice(0, -1));
        if (isNaN(baseNum)) return value;
        return baseNum.toLocaleString('en-US') + '.';
      }
      
      const num = parseFloat(cleanValue);
      if (isNaN(num)) return value;
      
      // Count decimal places in original input
      const decimalPart = cleanValue.split('.')[1];
      const decimalPlaces = decimalPart ? decimalPart.length : 0;
      
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: Math.max(decimalPlaces, 3)
      });
    } catch {
      return value;
    }
  };

  // Helper function to validate numeric input with decimals
  const isValidNumericInput = (value: string): boolean => {
    // Allow empty string, numbers, commas, and single decimal point
    const cleanValue = value.replace(/,/g, '');
    return /^\d*\.?\d*$/.test(cleanValue);
  };

  const [customerForm, setCustomerForm] = useState<CustomerFormData>({
    Customer: "",
    NatID: "",
    passportNumber: "",
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
    customerType: saleSource === "market" ? true : false,
    limit: 100,
  });
  const [createSale] = useCreateSaleMutation();
  const [addCustomer] = useAddCustomerMutation();

  // إعادة تحميل أرصدة العملات عند تغيير مصدر البيع
  useEffect(() => {
    refetchCurrencies();
  }, [saleSource, refetchCurrencies]);

  // Filter customers based on search
  const filteredCustomers = customersData?.data?.filter(customer =>
    customer.Customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.NationalNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.Phone?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Calculate total price when value or sale price changes
  useEffect(() => {
    if (saleForm.Value && saleForm.SalePrice) {
      try {
        const cleanValue = parseFormattedNumber(saleForm.Value);
        const cleanPrice = parseFormattedNumber(saleForm.SalePrice);
        const value = new Decimal(cleanValue);
        const price = new Decimal(cleanPrice);
        const total = value.mul(price);
        setSaleForm(prev => ({ ...prev, TotalPrice: total.toString() }));
      } catch (error) {
        console.error("Error calculating total:", error);
      }
    }
  }, [saleForm.Value, saleForm.SalePrice]);

  // Handle customer selection
  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setSaleForm(prev => ({ ...prev, CustID: customer.CustID }));
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

  // Handle sale form submission
  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!saleForm.CustID || !saleForm.CarID || !saleForm.PaymentCurrencyID) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      await createSale({
        ...saleForm,
        Value: new Decimal(parseFormattedNumber(saleForm.Value)),
        SalePrice: new Decimal(parseFormattedNumber(saleForm.SalePrice)),
        TotalPrice: new Decimal(parseFormattedNumber(saleForm.TotalPrice)),
        UserID: "9e2895ae-4afe-4ff2-b3b3-be15cf1c82d6", // Default user ID
      }).unwrap();
      
      toast.success("تم إنشاء عملية البيع بنجاح");
      
      // تحديث أرصدة العملات
      refetchCurrencies();
      
      // Reset form
      setSaleForm({
        CarID: "",
        Value: "",
        SalePrice: "",
        TotalPrice: "",
        CustID: "",
        FirstNum: "",
        LastNum: "",
        PaymentCurrencyID: "",
      });
      setSelectedCustomer(null);
      setSearchTerm("");
    } catch (error) {
      toast.error("حدث خطأ أثناء إنشاء عملية البيع");
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
        NationalNumber: "",
        Address: "",
        Phone: "",
        CustomerType: saleSource === "market",
      });
      setSelectedFiles([]);
      refetchCustomers();
    } catch (error) {
      toast.error("حدث خطأ أثناء إضافة الزبون");
      console.error(error);
    }
  };

  return (
    <PermissionGuard requiredPermission="sales:create">
      <Toaster position="top-right" />
      <div className="p-6 bg-gray-50 min-h-screen font-tajawal">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">شاشة البيع</h1>
          <p className="text-gray-600">إدارة عمليات بيع العملات</p>
        </div>

        {/* Source Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">وجهة البيع</h2>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="saleSource"
                value="market"
                checked={saleSource === "market"}
                onChange={(e) => setSaleSource(e.target.value as "market" | "centralBank")}
                className="mr-2"
              />
              <span>إلى السوق</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="saleSource"
                value="centralBank"
                checked={saleSource === "centralBank"}
                onChange={(e) => setSaleSource(e.target.value as "market" | "centralBank")}
                className="mr-2"
              />
              <span>إلى مصرف ليبيا المركزي</span>
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

          {/* Sale Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">تفاصيل البيع</h2>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>ملاحظة:</strong> سيتم توليد رقم الفاتورة تلقائياً عند إنشاء عملية البيع
              </p>
            </div>
            
            <form onSubmit={handleSaleSubmit} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  العملة المراد بيعها
                </label>
                <select
                  value={saleForm.CarID}
                  onChange={(e) => setSaleForm(prev => ({ ...prev, CarID: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">اختر العملة</option>
                  {currencies?.map((currency) => (
                    <option key={currency.CarID} value={currency.CarID}>
                      {currency.Carrency} ({currency.CarrencyCode}) - الرصيد: {formatBalance(currency.Balance)}
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
                  value={saleForm.Value ? formatNumberForInput(saleForm.Value) : ""}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (isValidNumericInput(inputValue)) {
                      const cleanValue = parseFormattedNumber(inputValue);
                      setSaleForm(prev => ({ ...prev, Value: cleanValue }));
                    }
                  }}
                  placeholder="مثال: 1,000.500"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  سعر البيع
                </label>
                <input
                  type="text"
                  value={saleForm.SalePrice ? formatNumberForInput(saleForm.SalePrice) : ""}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (isValidNumericInput(inputValue)) {
                      const cleanValue = parseFormattedNumber(inputValue);
                      setSaleForm(prev => ({ ...prev, SalePrice: cleanValue }));
                    }
                  }}
                  placeholder="مثال: 4.750"
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
                  value={saleForm.TotalPrice ? formatNumber(saleForm.TotalPrice) : ""}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  عملة الدفع
                </label>
                <select
                  value={saleForm.PaymentCurrencyID}
                  onChange={(e) => setSaleForm(prev => ({ ...prev, PaymentCurrencyID: e.target.value }))}
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
                    value={saleForm.FirstNum}
                    onChange={(e) => setSaleForm(prev => ({ ...prev, FirstNum: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    آخر رقم
                  </label>
                  <input
                    type="text"
                    value={saleForm.LastNum}
                    onChange={(e) => setSaleForm(prev => ({ ...prev, LastNum: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!saleForm.CustID || !saleForm.CarID || !saleForm.PaymentCurrencyID}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                إنشاء عملية البيع
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
