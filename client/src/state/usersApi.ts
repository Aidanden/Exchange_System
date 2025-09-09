import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "@/app/redux";

export interface CreateUserRequest {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  roleId: string;
  isActive: boolean;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface UsersResponse {
  success: boolean;
  data: {
    users: User[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message?: string;
}

export interface CreateUserResponse {
  success: boolean;
  data?: User;
  message: string;
}

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token || 
                   (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Cache-Control', 'max-age=30');
      return headers;
    },
  }),
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    getUsers: builder.query<UsersResponse, void>({
      query: () => "/api/users",
      providesTags: ["Users"],
    }),
    createUser: builder.mutation<CreateUserResponse, CreateUserRequest>({
      query: (userData) => ({
        url: "/api/users",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Users"],
    }),
    updateUser: builder.mutation<CreateUserResponse, { id: string; userData: Partial<CreateUserRequest> }>({
      query: ({ id, userData }) => ({
        url: `/${id}`,
        method: "PUT",
        body: userData,
      }),
      invalidatesTags: ["Users"],
    }),
    deleteUser: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;
