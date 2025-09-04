import { useGetDashboardMetricsQuery } from '@/state/dashboardApi';
import React, { useState } from 'react'
import { TrendingUp, DollarSign, ShoppingCart, Calendar, List } from 'lucide-react';
import BuysModal from './BuysModal';
import { formatNumber, formatPrice } from '@/utils/formatNumber';

const cardBuys = () => {
  const { data, isLoading } = useGetDashboardMetricsQuery();
  const buyData = data?.lastBuy || [];
  const [isModalOpen, setIsModalOpen] = useState(false);

  // حساب الإحصائيات - استخدام قيمة العملة المشتراة بدلاً من سعر الشراء
  const totalBuys = buyData.length;
  const totalValue = buyData.reduce((sum, buy) => sum + Number(buy.Value), 0);
  const averageValue = totalBuys > 0 ? totalValue / totalBuys : 0;

  return (
    <>
      <div className="flex flex-col justify-between row-span-3 xl:row-span-6 bg-white xl:col-span-1 shadow-md rounded-2xl col-span-1 md:col-span-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-lg">جاري التحميل ...</div>
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div>
              <h2 className="text-lg font-bold mb-2 px-7 pt-5 flex items-center">
                <ShoppingCart className="w-5 h-5 ml-2 text-blue-600" />
                المشتريات
              </h2>
              <hr />
            </div>

            {/* STATISTICS */}
            <div className="px-7 mt-5">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <DollarSign className="w-6 h-6 text-blue-600 ml-2" />
                    <div>
                      <p className="text-xs text-gray-600">إجمالي قيمة العملات</p>
                      <p className="text-lg font-bold text-blue-600">{formatNumber(totalValue)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="w-6 h-6 text-green-600 ml-2" />
                    <div>
                      <p className="text-xs text-gray-600">متوسط قيمة العملة</p>
                      <p className="text-lg font-bold text-green-600">{formatNumber(averageValue)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RECENT BUYS */}
            <div className="px-7 flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-semibold flex items-center">
                  <Calendar className="w-4 h-4 ml-2 text-gray-600" />
                  آخر المشتريات
                </h3>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <List className="w-4 h-4" />
                  عرض جميع المشتريات
                </button>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {buyData.map((buy) => (
                  <div key={buy.BuyID} className="bg-gray-50 p-3 rounded-lg border-r-4 border-blue-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">فاتورة رقم: {buy.BillNum}</p>
                        <p className="text-sm text-gray-600">
                          تم الشراء من: {buy.Customer?.Customer || 'غير محدد'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(buy.BuyDate).toLocaleDateString('en-US')}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-blue-600">
                          {formatNumber(buy.Value)} {buy.Carrence?.Carrency || ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          سعر الشراء: {formatPrice(buy.TotalPrice)} دينار
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FILTER */}
            <div className="px-7 pb-5">
              <select className="w-full shadow-sm border border-gray-300 bg-white p-2 rounded-lg text-sm">
                <option value="daily">اليوم</option>
                <option value="weekly">الأسبوع</option>
                <option value="monthly">الشهر</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <BuysModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
}

export default cardBuys