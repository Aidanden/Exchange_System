"use client";

import React, { useState, useEffect } from "react";
import { useGetCurrenciesQuery } from "@/state/currenciesApi";
import { useListCustomersQuery } from "@/state/customersApi";
import { useCreateSaleMutation } from "@/state/salesApi";
import { useAddCustomerMutation } from "@/state/customersApi";
import { useGetNationalitiesQuery } from "@/state/nationalitsApi";
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

  const [customerForm, setCustomerForm] = useState<CustomerFormData>({
    Customer: "",
    NatID: "",
    passportNumber: "",
    NationalNumber: "",
    Address: "",
    Phone: "",
    CustomerType: true,
  });

  // API hooks
  const { data: currencies, refetch: refetchCurrencies } = useGetCurrenciesQuery();
  const { data: nationalities } = useGetNationalitiesQuery();
  const { data: customersData, refetch: refetchCustomers } = useListCustomersQuery({
    customerType: saleSource === "market" ? true : false,
    limit: 100,
  });
  const [createSale] = useCreateSaleMutation();
  const [addCustomer] = useAddCustomerMutation();

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
        const value = new Decimal(saleForm.Value);
        const price = new Decimal(saleForm.SalePrice);
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
        Value: new Decimal(saleForm.Value),
        SalePrice: new Decimal(saleForm.SalePrice),
        TotalPrice: new Decimal(saleForm.TotalPrice),
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
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addCustomer({
        ...customerForm,
        UserID: "9e2895ae-4afe-4ff2-b3b3-be15cf1c82d6", // Default user ID
      }).unwrap();
      
      toast.success("تم إضافة العميل بنجاح");
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
      refetchCustomers();
    } catch (error) {
      toast.error("حدث خطأ أثناء إضافة العميل");
      console.error(error);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 max-w-6xl mx-auto">
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
                      {currency.Carrency} ({currency.CarrencyCode}) - الرصيد: {currency.Balance.toString()}
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
                  step="0.001"
                  value={saleForm.Value}
                  onChange={(e) => setSaleForm(prev => ({ ...prev, Value: e.target.value }))}
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
                  step="0.001"
                  value={saleForm.SalePrice}
                  onChange={(e) => setSaleForm(prev => ({ ...prev, SalePrice: e.target.value }))}
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
                  value={saleForm.TotalPrice}
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
                      {currency.Carrency} ({currency.CarrencyCode}) - الرصيد: {currency.Balance.toString()}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">إضافة عميل جديد</h2>
                <button
                  onClick={() => setShowAddCustomer(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCustomerSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      اسم العميل *
                    </label>
                    <input
                      type="text"
                      value={customerForm.Customer}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, Customer: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الجنسية *
                    </label>
                    <select
                      value={customerForm.NatID}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, NatID: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">اختر الجنسية</option>
                      {nationalities?.map((nat: any) => (
                        <option key={nat.NatID} value={nat.NatID}>
                          {nat.Nationality}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رقم جواز السفر
                    </label>
                    <input
                      type="text"
                      value={customerForm.passportNumber}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, passportNumber: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>





                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الرقم الوطني
                    </label>
                    <input
                      type="text"
                      value={customerForm.NationalNumber}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, NationalNumber: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      العنوان
                    </label>
                    <input
                      type="text"
                      value={customerForm.Address}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, Address: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رقم الهاتف
                    </label>
                    <input
                      type="text"
                      value={customerForm.Phone}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, Phone: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نوع العميل
                    </label>
                    <select
                      value={customerForm.CustomerType.toString()}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, CustomerType: e.target.value === "true" }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="true">سوق</option>
                      <option value="false">مصرف مركزي</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    إضافة العميل
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomer(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
