import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "@/app/redux";

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      username: string;
      fullName: string;
      email: string;
      role: string;
      permissions: string[];
    };
  };
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  permissions: string[];
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://102.213.183.227:5000/api",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token || 
                   (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      headers.set('Cache-Control', 'max-age=30');
      return headers;
    },
  }),
  tagTypes: ["Auth"],
  keepUnusedDataFor: 600, // 10 دقائق للمصادقة
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    logout: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),
    getCurrentUser: builder.query<{ success: boolean; data: User }, void>({
      query: () => "/auth/me",
      providesTags: ["Auth"],
    }),
    changePassword: builder.mutation<
      { success: boolean; message: string },
      { currentPassword: string; newPassword: string }
    >({
      query: (passwords) => ({
        url: "/auth/change-password",
        method: "PUT",
        body: passwords,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useChangePasswordMutation,
} = authApi;
