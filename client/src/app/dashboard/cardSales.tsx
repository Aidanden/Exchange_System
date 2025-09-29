import { useGetDashboardMetricsQuery } from '@/state/dashboardApi';
import React from 'react';
import { TrendingUp, DollarSign, ShoppingBag, Calendar } from 'lucide-react';
import { formatPrice } from '@/utils/formatNumber';

const CardSales = () => {
  const { data, isLoading } = useGetDashboardMetricsQuery();
  const salesData = data?.lastSales || [];
  // حساب الإحصائيات
  const totalSales = salesData.length;
  const totalValue = salesData.reduce((sum, sale) => sum + Number(sale.TotalPrice), 0);
  const averageValue = totalSales > 0 ? totalValue / totalSales : 0;

  return (
    <div className="row-span-2 xl:row-span-3 col-span-1 md:col-span-2 xl:col-span-1 bg-white shadow-md rounded-2xl flex flex-col h-full">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-lg">جاري التحميل ...</div>
        </div>
      ) : (
        <>
          {/* HEADER */}
          <div className="flex-shrink-0">
            <h2 className="text-lg font-bold mb-2 px-7 pt-5 flex items-center">
              <ShoppingBag className="w-5 h-5 ml-2 text-orange-600" />
              المبيعات
            </h2>
            <hr />
          </div>

          {/* STATISTICS */}
          <div className="px-7 mt-5 flex-shrink-0">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-orange-600 ml-2" />
                  <div>
                    <p className="text-xs text-gray-600">إجمالي المبيعات</p>
                    <p className="text-lg font-bold text-orange-600">{formatPrice(totalValue)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 text-green-600 ml-2" />
                  <div>
                    <p className="text-xs text-gray-600">متوسط القيمة</p>
                    <p className="text-lg font-bold text-green-600">{formatPrice(averageValue)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RECENT SALES */}
          <div className="px-7 flex-1 flex flex-col min-h-0">
            <h3 className="text-md font-semibold mb-3 flex items-center flex-shrink-0">
              <Calendar className="w-4 h-4 ml-2 text-gray-600" />
              آخر المبيعات
            </h3>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {salesData.map((sale) => (
                <div key={sale.SaleID} className="bg-gray-50 p-2 rounded-lg border-r-3 border-orange-500">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">فاتورة: {sale.BillNum}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(sale.SaleDate).toLocaleDateString('en-US')}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-orange-600 text-sm">
                        {formatPrice(sale.TotalPrice)} دينار
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FILTER */}
          <div className="px-7 pb-4 flex-shrink-0">
            <select className="w-full shadow-sm border border-gray-300 bg-white p-2 rounded-lg text-sm">
              <option value="daily">اليوم</option>
              <option value="weekly">الأسبوع</option>
              <option value="monthly">الشهر</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
};

export default CardSales;