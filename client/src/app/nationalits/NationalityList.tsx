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
import { toast, Toaster } from "react-hot-toast";

const Nationalities = () => {
  const { data: nationalities, isLoading, error, refetch } = useGetNationalitiesQuery();
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newName || !selectedCategory) {
      toast.error("يرجى تعبئة جميع الحقول قبل الإضافة.");
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
      toast.success("تمت إضافة الجنسية بنجاح!");
      refetch();
    } catch (e) {
      console.error("Error adding nationality:", e);
      toast.error("حدث خطأ أثناء إضافة الجنسية.");
    }
  };

  const handleEditClick = (nationality: any) => {
    setCurrentEditData(nationality);
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!currentEditData?.Nationality || !currentEditData?.CatID) {
      toast.error("يرجى تعبئة جميع الحقول قبل الحفظ.");
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
      toast.success("تم التعديل بنجاح!");
      refetch();
    } catch (e) {
      console.error("Error updating nationality:", e);
      toast.error("حدث خطأ أثناء التعديل.");
    }
  };

  const handleDelete = async (id: any) => {
    setDeletingId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      await deleteNationality(deletingId).unwrap();
      toast.success("تم حذف الجنسية بنجاح!");
      setDeletingId(null);
      refetch();
    } catch (error) {
      console.error("Error deleting nationality:", error);
      toast.error("حدث خطأ أثناء حذف الجنسية.");
    } finally {
      setDeletingId(null);
    }
  };

  const isBusy = isLoading || categoriesLoading;

  if (isLoading) {
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

  const filteredNationalities = nationalities?.filter((nationality) =>
    nationality.Nationality.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">قائمة الجنسيات</h1>
          <p className="text-gray-600">عرض وإدارة الجنسيات المتاحة</p>
        </div>

        {/* نموذج الإضافة */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
              {isAdding ? "جارِ الإضافة..." : "إضافة الجنسية"}
            </button>
          </div>
          {addError && (
            <div className="text-red-500 mt-3 p-2 bg-red-50 rounded-md">
              {(addError as any)?.data?.error || "حدث خطأ أثناء إضافة الجنسية."}
            </div>
          )}
        </div>

        {/* Search and Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="البحث عن جنسية..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="text-sm text-gray-600">
              إجمالي النتائج: {filteredNationalities?.length || 0}
            </div>
          </div>
        </div>

        {/* Nationalities Table */}
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
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNationalities?.map((nationality) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(nationality)}
                          className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(nationality.NatID)}
                          className="text-red-600 hover:text-red-900 px-3 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredNationalities?.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">لا توجد جنسيات</div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && currentEditData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">تعديل الجنسية</h2>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم الجنسية
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الفئة
                  </label>
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

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleEditSave}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  حفظ التعديلات
                </button>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">تأكيد الحذف</h2>
                <p className="text-gray-600">
                  هل أنت متأكد من حذف هذه الجنسية؟
                </p>
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ هذا الإجراء لا يمكن التراجع عنه
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  نعم، احذف
                </button>
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Nationalities;
