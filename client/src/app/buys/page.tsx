"use client";

import React, { useState, useEffect } from "react";
import { useGetCurrenciesQuery } from "@/state/currenciesApi";
import { useListCustomersQuery } from "@/state/customersApi";
import { useCreateBuyMutation } from "@/state/buysApi";
import { useAddCustomerMutation } from "@/state/customersApi";
import { useGetNationalitiesQuery } from "@/state/nationalitsApi";
import { Decimal } from "decimal.js";
import { toast, Toaster } from "react-hot-toast";

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

  // API hooks
  const { data: currencies, refetch: refetchCurrencies } = useGetCurrenciesQuery();
  const { data: nationalities } = useGetNationalitiesQuery();
  const { data: customersData, refetch: refetchCustomers } = useListCustomersQuery({
    customerType: buySource === "market" ? true : false,
    limit: 100,
  });
  const [createBuy] = useCreateBuyMutation();
  const [addCustomer] = useAddCustomerMutation();

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
        setBuyForm(prev => ({ ...prev, TotalPrice: total.toString() }));
      } catch (error) {
        console.error("Error calculating total:", error);
      }
    }
  }, [buyForm.Value, buyForm.BuyPrice]);

  // Handle customer selection
  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setBuyForm(prev => ({ ...prev, CustID: customer.CustID }));
    setSearchTerm(customer.Customer);
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
      setSelectedCustomer(null);
      setSearchTerm("");
    } catch (error) {
      toast.error("حدث خطأ أثناء إنشاء عملية الشراء");
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
        ExpDate: "",
        ReleasePlace: "",
        NationalNumber: "",
        Address: "",
        Phone: "",
        CustomerType: buySource === "market",
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
                  type="number"
                  step="0.001"
                  value={buyForm.Value}
                  onChange={(e) => setBuyForm(prev => ({ ...prev, Value: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  value={buyForm.TotalPrice}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
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
                      تاريخ انتهاء الصلاحية
                    </label>
                    <input
                      type="text"
                      value={customerForm.ExpDate}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, ExpDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="YYYY-MM-DD"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      مكان الإصدار
                    </label>
                    <input
                      type="text"
                      value={customerForm.ReleasePlace}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, ReleasePlace: e.target.value }))}
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
