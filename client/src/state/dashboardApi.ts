import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { DashboardMetrics } from "./types";

export const dashboardApi = createApi({
  baseQuery: fetchBaseQuery({ 
    baseUrl: "http://102.213.183.227:5000/api",
    prepareHeaders: (headers) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Cache-Control', 'max-age=30');
      return headers;
    },
  }),
  reducerPath: "dashboardApi",
  tagTypes: ["DashboardMetrics"],
  keepUnusedDataFor: 300, // 5 دقائق
  refetchOnMountOrArgChange: 300, // 5 دقائق
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: (build) => ({
    getDashboardMetrics: build.query<DashboardMetrics, void>({
      query: () => "/dashboard/dashboard",
      providesTags: ["DashboardMetrics"],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const { useGetDashboardMetricsQuery } = dashboardApi;
