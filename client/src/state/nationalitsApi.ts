import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Category, Nationality } from "./types";

export const nationalitsApi = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL }),
  reducerPath: "nationalitsApi",
  tagTypes: ["Nationalities", "Categories"],
  endpoints: (build) => ({
    getNationalities: build.query<Nationality[], void>({
      query: () => "/api/nationalities/nationalits",
      providesTags: ["Nationalities"],
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
      invalidatesTags: ["Nationalities"],
    }),

    updateNationality: build.mutation<Nationality, Nationality>({
      query: (updatedNationality) => ({
        url: `/api/nationalities/nationalits/${updatedNationality.NatID}`,
        method: "PUT",
        body: updatedNationality,
      }),
      invalidatesTags: ["Nationalities"],
    }),

    deleteNationality: build.mutation<void, string>({
      query: (NatID) => ({
        url: `/api/nationalities/nationalits/${NatID}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Nationalities"],
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