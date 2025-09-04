import { useGetDashboardMetricsQuery } from "@/state/dashboardApi";
import { Users, UserPlus, Phone, Calendar, TrendingUp, FileText } from "lucide-react";
import React from "react";

const cardPopularCustomer = () => {
  const { data: dashboardMetrics, isLoading } = useGetDashboardMetricsQuery();
  const allCustomers = dashboardMetrics?.popularCustomer || [];
  
  // فلترة الزبائن - استبعاد الزبائن الذين نوع الزبون لديهم false
  const customers = allCustomers.filter(customer => customer.CustomerType !== false);

  // حساب الإحصائيات
  const totalCustomers = customers.length;
  const customersWithPhone = customers.filter(c => c.Phone).length;
  const customersWithNationalNumber = customers.filter(c => c.NationalNumber).length;
  const customersWithPassport = customers.filter(c => c.passportNumber).length;

  return (
    <div className="row-span-3 xl:row-span-6 bg-white shadow-md rounded-2xl">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-lg">جاري التحميل ...</div>
        </div>
      ) : (
        <>
          {/* HEADER */}
          <div>
            <h3 className="text-lg font-bold px-7 pb-2 pt-5 flex items-center">
              <Users className="w-5 h-5 ml-2 text-green-600" />
              الزبائن
            </h3>
            <hr />
          </div>

          {/* STATISTICS */}
          <div className="px-7 mt-5">
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <UserPlus className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">إجمالي الزبائن</p>
                <p className="text-lg font-bold text-green-600">{totalCustomers}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <Phone className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">مع هواتف</p>
                <p className="text-lg font-bold text-blue-600">{customersWithPhone}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">مع رقم وطني</p>
                <p className="text-lg font-bold text-purple-600">{customersWithNationalNumber}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <FileText className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">مع جواز سفر</p>
                <p className="text-lg font-bold text-orange-600">{customersWithPassport}</p>
              </div>
            </div>
          </div>

          {/* CUSTOMERS LIST */}
          <div className="px-7 flex-1">
            <h4 className="text-md font-semibold mb-3 flex items-center">
              <Calendar className="w-4 h-4 ml-2 text-gray-600" />
              آخر الزبائن المسجلين
            </h4>
            <div className="overflow-auto max-h-64">
              {customers.map((customer) => (
                <div
                  key={customer.CustID}
                  className="flex items-center justify-between gap-3 px-4 py-3 border-b hover:bg-gray-50 rounded-lg mb-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {customer.Customer?.charAt(0) || '?'}
                    </div>
                    <div className="flex flex-col">
                      <div className="text-gray-800 font-medium">
                        {customer.Customer}
                      </div>
                      <div className="flex text-sm items-center text-gray-600 gap-2">
                        {customer.Phone && (
                          <>
                            <Phone className="w-3 h-3" />
                            <span className="font-medium text-blue-500">
                              {customer.Phone}
                            </span>
                          </>
                        )}
                        {customer.passportNumber && (
                          <>
                            <FileText className="w-3 h-3 text-orange-500" />
                            <span className="text-xs text-orange-600">
                              جواز: {customer.passportNumber}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-left">
                    {customer.NationalNumber && (
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        رقم وطني: {customer.NationalNumber}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(customer.OperDate).toLocaleDateString('en-US')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FILTER */}
          <div className="px-7 pb-5">
            <select className="w-full shadow-sm border border-gray-300 bg-white p-2 rounded-lg text-sm">
              <option value="all">جميع الزبائن</option>
              <option value="recent">المسجلين حديثاً</option>
              <option value="active">النشطين</option>
              <option value="passport">مع جواز سفر</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
};

export default cardPopularCustomer;
