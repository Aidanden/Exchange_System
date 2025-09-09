import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Category, Nationality } from "./types";

export const nationalitsApi = createApi({
  baseQuery: fetchBaseQuery({ 
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Cache-Control', 'max-age=30');
      return headers;
    },
  }),
  reducerPath: "nationalitsApi",
  tagTypes: ["Nationalities", "Categories"],
  endpoints: (build) => ({
    getNationalities: build.query<Nationality[], void>({
      query: () => "/api/nationalities/nationalits",
      providesTags: (result) =>
        result
          ? [
              ...result.map((nationality) => ({ type: "Nationalities" as const, id: nationality.NatID })),
              { type: "Nationalities", id: "LIST" },
            ]
          : [{ type: "Nationalities", id: "LIST" }],
    }),
    // نقطة نهاية جديدة
    getNationalityById: build.query({
      query: (id) => `/api/nationalities/nationalits/${id}`,
    }),
    // النقاط الأخرى كما كانت

    getCategories: build.query<Category[], void>({
      query: () => "/api/categories/categories", // نقطة النهاية لجلب التصنيفات
      providesTags: ["Categories"],
    }),
    
    addNationality: build.mutation<Nationality, Partial<Nationality>>({
      query: (newNationality) => ({
        url: "/api/nationalities/nationalits",
        method: "POST",
        body: newNationality,
      }),
      invalidatesTags: [{ type: "Nationalities", id: "LIST" }],
      // تحديث فوري للبيانات المحلية
      async onQueryStarted(newNationality, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // إضافة العنصر الجديد إلى البيانات المحلية
          dispatch(
            nationalitsApi.util.updateQueryData('getNationalities', undefined, (draft) => {
              draft.push(data);
            })
          );
        } catch {
          // في حالة فشل العملية، لا نحتاج لعمل شيء لأننا لم نقم بتحديث متفائل
        }
      },
    }),

    updateNationality: build.mutation<Nationality, Nationality>({
      query: (updatedNationality) => ({
        url: `/api/nationalities/nationalits/${updatedNationality.NatID}`,
        method: "PUT",
        body: updatedNationality,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Nationalities", id: "LIST" },
        { type: "Nationalities", id: arg.NatID }
      ],
      // تحديث فوري للبيانات المحلية
      async onQueryStarted(updatedNationality, { dispatch, queryFulfilled }) {
        // تحديث متفائل - تحديث العنصر في البيانات المحلية فوراً
        const patchResult = dispatch(
          nationalitsApi.util.updateQueryData('getNationalities', undefined, (draft) => {
            const index = draft.findIndex(nationality => nationality.NatID === updatedNationality.NatID);
            if (index !== -1) {
              // تحديث البيانات مع الحفاظ على البنية الأصلية
              Object.assign(draft[index], updatedNationality);
            }
          })
        );
        try {
          const { data } = await queryFulfilled;
          // تحديث البيانات بالاستجابة الفعلية من الخادم
          dispatch(
            nationalitsApi.util.updateQueryData('getNationalities', undefined, (draft) => {
              const index = draft.findIndex(nationality => nationality.NatID === updatedNationality.NatID);
              if (index !== -1) {
                Object.assign(draft[index], data);
              }
            })
          );
        } catch {
          // في حالة فشل العملية، استرجع البيانات الأصلية
          patchResult.undo();
        }
      },
    }),

    deleteNationality: build.mutation<void, string>({
      query: (NatID) => ({
        url: `/api/nationalities/nationalits/${NatID}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, NatID) => [
        { type: "Nationalities", id: "LIST" },
        { type: "Nationalities", id: NatID }
      ],
      // تحديث فوري للبيانات المحلية
      async onQueryStarted(NatID, { dispatch, queryFulfilled }) {
        // تحديث متفائل - إزالة العنصر من البيانات المحلية فوراً
        const patchResult = dispatch(
          nationalitsApi.util.updateQueryData('getNationalities', undefined, (draft) => {
            const index = draft.findIndex(nationality => nationality.NatID === NatID);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          // في حالة فشل العملية، استرجع البيانات الأصلية
          patchResult.undo();
        }
      },
    }),
  }),
});

export const {
  useGetNationalitiesQuery,
  useGetCategoriesQuery,
  useAddNationalityMutation,
  useUpdateNationalityMutation,
  useDeleteNationalityMutation,
} = nationalitsApi