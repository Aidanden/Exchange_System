"use client";

import React, { useState, useMemo } from "react";
import { useGetNationalitiesQuery, useGetCategoriesQuery } from "@/state/nationalitsApi";
import { Search, Filter } from "lucide-react";
import { Toaster } from "react-hot-toast";

const SearchPage = () => {
  const { data: nationalities, isLoading, error } = useGetNationalitiesQuery();
  const { data: categories, isLoading: categoriesLoading } = useGetCategoriesQuery();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Filter nationalities based on search query and category
  const filteredNationalities = useMemo(() => {
    if (!nationalities) return [];
    
    return nationalities.filter((nationality) => {
      const matchesSearch = nationality.Nationality.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || nationality.CatID === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [nationalities, searchQuery, selectedCategory]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
  };

  if (isLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">جاري تحميل البيانات...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">حدث خطأ في تحميل البيانات</div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">البحث في الجنسيات</h1>
          <p className="text-gray-600">ابحث وفلتر الجنسيات حسب الاسم والفئة</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-700">البحث والفلترة</h2>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="ابحث عن جنسية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="w-full md:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-sm text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">جميع الفئات</option>
                {categories?.map((category) => (
                  <option key={category.CatID} value={category.CatID}>
                    {category.Categorie}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              مسح الفلاتر
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            عدد النتائج: {filteredNationalities.length} من أصل {nationalities?.length || 0}
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اسم الجنسية
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الفئة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاريخ الإنشاء
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNationalities.map((nationality) => (
                  <tr key={nationality.NatID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {nationality.Nationality}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {nationality.Categorie?.Categorie && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {nationality.Categorie?.Categorie}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {nationality.createdAt ? new Date(nationality.createdAt).toLocaleDateString('ar-SA') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredNationalities.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">
                {searchQuery || selectedCategory ? "لا توجد نتائج تطابق البحث" : "لا توجد جنسيات"}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchPage;
