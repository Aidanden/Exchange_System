import React, { useState } from 'react';
import { useListBuysQuery } from '@/state/buysApi';
import { X, Search, Filter, Calendar, Download } from 'lucide-react';
import { formatNumber, formatPrice } from '@/utils/formatNumber';
import { Decimal } from "decimal.js";

// Helper function to format numbers with commas
const formatNumberWithCommas = (value: any): string => {
  if (!value || value === null || value === undefined) return "0.00";
  const numericValue = new Decimal(value).toNumber();
  return numericValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  });
};

// Format date with Arabic numerals (not Hindi)
const formatDateArabic = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

interface BuysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BuysModal: React.FC<BuysModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const { data: buysData, isLoading } = useListBuysQuery({
    limit: 100,
    page: 1,
  });

  const buys = buysData?.data || [];

  // فلترة المشتريات
  const filteredBuys = buys.filter(buy => {
    const matchesSearch = 
      buy.BillNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buy.Customer?.Customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buy.Carrence?.Carrency.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCurrency = !filterCurrency || buy.Carrence?.Carrency === filterCurrency;
    const buyDateString = new Date(buy.BuyDate).toISOString().split('T')[0];
    const matchesDate = !filterDate || buyDateString === filterDate;

    return matchesSearch && matchesCurrency && matchesDate;
  });

  // الحصول على العملات الفريدة للفلترة
  const uniqueCurrencies = [...new Set(buys.map(buy => buy.Carrence?.Carrency).filter(Boolean))];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">جميع المشتريات</h2>
            <p className="text-gray-600 mt-1">عرض وتصفية جميع عمليات الشراء</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في المشتريات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Currency Filter */}
            <select
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع العملات</option>
              {uniqueCurrencies.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>

            {/* Date Filter */}
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Export Button */}
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              تصدير
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-lg">جاري التحميل...</div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الفاتورة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تم الشراء من
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العملة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    القيمة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    سعر الشراء
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجمالي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBuys.map((buy) => (
                  <tr key={buy.BuyID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {buy.BillNum}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {buy.Customer?.Customer || 'غير محدد'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {buy.Carrence?.Carrency || 'غير محدد'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumberWithCommas(buy.Value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumberWithCommas(buy.BuyPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {formatNumberWithCommas(buy.TotalPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateArabic(buy.BuyDate.toString())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              إجمالي النتائج: {filteredBuys.length} عملية شراء
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuysModal;
