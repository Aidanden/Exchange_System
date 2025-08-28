"use client";

import React, { useMemo, useState } from "react";
import {
  useGetNationalitiesQuery,
  useAddNationalityMutation,
  useGetCategoriesQuery,
  useUpdateNationalityMutation,
  useDeleteNationalityMutation,
} from "@/state/nationalitsApi";
import { Nationality } from "@/state/types";
import { Users, Plus, Search, Edit2, Trash2, X } from "lucide-react";

const Nationalities = () => {
  const { data: nationalities, isLoading, error } = useGetNationalitiesQuery();
  const { data: categories, isLoading: categoriesLoading } =
    useGetCategoriesQuery();
  const [addNationality, { isLoading: isAdding, error: addError }] =
    useAddNationalityMutation();
  const [updateNationality] = useUpdateNationalityMutation();
  const [deleteNationality] = useDeleteNationalityMutation();

  const [newName, setNewName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [currentEditData, setCurrentEditData] = useState<Nationality | null>(
    null
  );

  const handleAdd = async () => {
    if (!newName || !selectedCategory) {
      alert("يرجى تعبئة جميع الحقول قبل الإضافة.");
      return;
    }
    try {
      const newNationality = {
        Nationality: newName,
        CatID: selectedCategory,
      };
      await addNationality(newNationality).unwrap();
      setNewName("");
      setSelectedCategory("");
    } catch (e) {
      console.error("Error adding nationality:", e);
    }
  };

  const handleEditClick = (nationality: any) => {
    setCurrentEditData(nationality);
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!currentEditData?.Nationality || !currentEditData?.CatID) {
      alert("يرجى تعبئة جميع الحقول قبل الحفظ.");
      return;
    }

    try {
      await updateNationality({
        NatID: currentEditData.NatID,
        Nationality: currentEditData.Nationality,
        CatID: currentEditData.CatID,
        createdAt: undefined,
        updatedAt: undefined,
        Categorie: null,
      }).unwrap();
      setEditModalOpen(false);
      alert("تم التعديل بنجاح!");
    } catch (e) {
      console.error("Error updating nationality:", e);
      alert("حدث خطأ أثناء التعديل.");
    }
  };

  const handleDelete = async (id: any) => {
    try {
      await deleteNationality(id).unwrap();
    } catch (error) {
      console.error("Error deleting nationality:", error);
    }
  };

  const isBusy = isLoading || categoriesLoading;

  if (error) {
    return (
      <div className="text-red-500 text-center mt-10">
        حدث خطأ أثناء تحميل البيانات
      </div>
    );
  }

  const filteredNationalities = nationalities?.filter((nationality) =>
    nationality.Nationality.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">إدارة الجنسيات</h1>
        </div>

        {/* نموذج الإضافة */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-700">إضافة جنسية جديدة</h2>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="اسم الجنسية"
              className="flex-1 min-w-64 rounded-lg border border-gray-300 bg-white py-3 px-4 text-base text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-64 rounded-lg border border-gray-300 bg-white py-3 px-4 text-base text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">اختر الفئة</option>
              {categories?.map((category) => (
                <option key={category.CatID} value={category.CatID}>
                  {category.Categorie}
                </option>
              ))}
            </select>
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center gap-2"
              onClick={handleAdd}
              disabled={isBusy || isAdding}
            >
              <Plus className="w-4 h-4" />
              {isAdding ? "جارِ الإضافة..." : "إضافة"}
            </button>
          </div>
          {addError && (
            <div className="text-red-500 mt-3 p-2 bg-red-50 rounded-md">
              {(addError as any)?.data?.error || "حدث خطأ أثناء إضافة الجنسية."}
            </div>
          )}
        </div>

        {/* خانة البحث */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن جنسية..."
              className="w-full py-3 pr-10 pl-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* قائمة الجنسيات */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              قائمة الجنسيات ({filteredNationalities?.length || 0})
            </h2>
          </div>
          {isBusy ? (
            <div className="p-8 text-center text-gray-500">جارٍ التحميل...</div>
          ) : !filteredNationalities?.length ? (
            <div className="p-12 text-center text-gray-500">لا توجد جنسيات مطابقة للبحث</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNationalities.map((nationality) => (
                <div
                  key={nationality.NatID}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {nationality.Nationality}
                        </h3>
                        {nationality.Categorie?.Categorie && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {nationality.Categorie?.Categorie}
                          </span>
                        )}
                      </div>
                      
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-2 bg-yellow-500 text-white rounded-lg shadow-sm hover:bg-yellow-600 transition-colors flex items-center gap-1"
                        onClick={() => handleEditClick(nationality)}
                      >
                        <Edit2 className="w-4 h-4" />
                        تعديل
                      </button>
                      <button
                        type="button"
                        className="px-3 py-2 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 transition-colors flex items-center gap-1"
                        onClick={async () => {
                          const confirmDelete = confirm(`هل أنت متأكد من حذف "${nationality.Nationality}"؟`);
                          if (confirmDelete) {
                            handleDelete(nationality.NatID);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* نافذة التعديل */}
        {isEditModalOpen && currentEditData && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-yellow-600" />
                  <h2 className="text-xl font-bold text-gray-800">تعديل الجنسية</h2>
                </div>
                <button
                  className="p-2 rounded-full hover:bg-gray-100"
                  onClick={() => setEditModalOpen(false)}
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم الجنسية</label>
                  <input
                    type="text"
                    value={currentEditData.Nationality || ""}
                    onChange={(e) =>
                      setCurrentEditData({
                        ...currentEditData,
                        Nationality: e.target.value,
                      })
                    }
                    placeholder="اسم الجنسية"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
                  <select
                    value={currentEditData.CatID || ""}
                    onChange={(e) =>
                      setCurrentEditData({
                        ...currentEditData,
                        CatID: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">اختر الفئة</option>
                    {categories?.map((category) => (
                      <option key={category.CatID} value={category.CatID}>
                        {category.Categorie}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  onClick={() => setEditModalOpen(false)}
                >
                  إلغاء
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                  onClick={handleEditSave}
                >
                  <Edit2 className="w-4 h-4" />
                  حفظ التعديلات
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Nationalities;
