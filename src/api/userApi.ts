import { baseApi } from './baseApi';
import { PageResponse } from '../types/pagination';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  isActive: boolean;
  telegramChatId?: string;
  createdAt: string;
}

export interface UserCreateRequest {
  username: string;
  password?: string;
  fullName: string;
  email?: string;
  role: 'ADMIN' | 'STAFF';
}

export interface UserUpdateRequest {
  fullName: string;
  email?: string;
  role: 'ADMIN' | 'STAFF';
  isActive: boolean;
  newPassword?: string;
  telegramChatId?: string;
}

export interface UserProfileUpdateRequest {
  fullName: string;
  email?: string;
  telegramChatId?: string;
  newPassword?: string;
}

export interface ChangePasswordRequest {
  oldPassword?: string;
  newPassword?: string;
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<User, void>({
      query: () => '/users/me',
      providesTags: ['User'],
    }),
    getUsers: builder.query<PageResponse<User>, { page: number; size: number }>({
      query: (params) => ({
        url: '/users',
        params,
      }),
      providesTags: ['User'],
    }),
    createUser: builder.mutation<User, UserCreateRequest>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<User, { id: number; data: UserUpdateRequest }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    updateMe: builder.mutation<User, UserProfileUpdateRequest>({
      query: (data) => ({
        url: '/users/me',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    changePassword: builder.mutation<void, ChangePasswordRequest>({
      query: (data) => ({
        url: '/users/me/password',
        method: 'PUT',
        body: data,
      }),
    }),
    deleteUser: builder.mutation<void, number>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetMeQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateMeMutation,
  useChangePasswordMutation,
  useDeleteUserMutation,
} = userApi;
