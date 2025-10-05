import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Category, Nationality } from "./types";

export const nationalitsApi = createApi({
  baseQuery: fetchBaseQuery({ 
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://102.213.183.227:5000/api",
    prepareHeaders: (headers) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  reducerPath: "nationalitsApi",
  tagTypes: ["Nationalities", "Categories"],
  endpoints: (build) => ({
    getNationalities: build.query<Nationality[], void>({
      query: () => "/nationalities/nationalits",
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
      query: (id) => `/nationalities/nationalits/${id}`,
    }),
    // النقاط الأخرى كما كانت

    getCategories: build.query<Category[], void>({
      query: () => "/categories/categories", // نقطة النهاية لجلب التصنيفات
      providesTags: ["Categories"],
    }),
    
    addNationality: build.mutation<Nationality, Partial<Nationality>>({
      query: (newNationality) => ({
        url: "/nationalities/nationalits",
        method: "POST",
        body: newNationality,
      }),
      async onQueryStarted(newNationality, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          console.log("Add successful, forcing refetch");
          // Force immediate refetch by resetting the query
          dispatch(nationalitsApi.util.resetApiState());
          dispatch(nationalitsApi.endpoints.getNationalities.initiate(undefined, { forceRefetch: true }));
        } catch (error) {
          console.error("Add failed:", error);
        }
      },
    }),

    updateNationality: build.mutation<Nationality, Nationality>({
      query: (updatedNationality) => ({
        url: `/nationalities/nationalits/${updatedNationality.NatID}`,
        method: "PUT",
        body: updatedNationality,
      }),
      async onQueryStarted(updatedNationality, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          console.log("Update successful, forcing refetch");
          // Force immediate refetch by resetting the query
          dispatch(nationalitsApi.util.resetApiState());
          dispatch(nationalitsApi.endpoints.getNationalities.initiate(undefined, { forceRefetch: true }));
        } catch (error) {
          console.error("Update failed:", error);
        }
      },
    }),

    deleteNationality: build.mutation<void, string>({
      query: (NatID) => ({
        url: `/nationalities/nationalits/${NatID}`,
        method: "DELETE",
      }),
      async onQueryStarted(NatID, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          console.log("Delete successful, forcing refetch");
          // Force immediate refetch by resetting the query
          dispatch(nationalitsApi.util.resetApiState());
          dispatch(nationalitsApi.endpoints.getNationalities.initiate(undefined, { forceRefetch: true }));
        } catch (error) {
          console.error("Delete failed:", error);
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