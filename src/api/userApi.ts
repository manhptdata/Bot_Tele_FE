import { baseApi } from './baseApi';
import { PageResponse } from '../types/pagination';

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  telegramChatId?: string;
  phoneNumber?: string;
  zalo?: string;
  telegramUsername?: string;
  isSupportContact?: boolean;
  createdAt: string;
}

export interface DeleteUserRequest {
  adminPassword: string;
}

export interface UserQueryParams {
  status?: 'ALL' | 'ACTIVE' | 'LOCKED' | 'TRASH';
  page?: number;
  size?: number;
}

export interface UserCreateRequest {
  username: string;
  password?: string;
  fullName: string;
  email?: string;
  role: 'ADMIN' | 'STAFF';
  phoneNumber?: string;
  zalo?: string;
  telegramUsername?: string;
  isSupportContact?: boolean;
  adminPassword?: string;
}

export interface UserUpdateRequest {
  fullName: string;
  email?: string;
  role: 'ADMIN' | 'STAFF';
  isActive: boolean;
  newPassword?: string;
  telegramChatId?: string;
  phoneNumber?: string;
  zalo?: string;
  telegramUsername?: string;
  isSupportContact?: boolean;
  adminPassword?: string;
}

export interface UserProfileUpdateRequest {
  fullName: string;
  email?: string;
  telegramChatId?: string;
  phoneNumber?: string;
  zalo?: string;
  telegramUsername?: string;
  isSupportContact?: boolean;
  newPassword?: string;
  currentPassword?: string;
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
    getUsers: builder.query<PageResponse<User>, UserQueryParams | void>({
      query: (params) => {
        if (!params) return '/users';
        const searchParams = new URLSearchParams();
        if (params.status) searchParams.append('status', params.status);
        if (params.page !== undefined) searchParams.append('page', params.page.toString());
        if (params.size !== undefined) searchParams.append('size', params.size.toString());
        return `/users?${searchParams.toString()}`;
      },
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
    deleteUser: builder.mutation<void, { id: number; data: DeleteUserRequest }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'DELETE',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    restoreUser: builder.mutation<User, { id: number; data: DeleteUserRequest }>({
      query: ({ id, data }) => ({
        url: `/users/${id}/restore`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    hardDeleteUser: builder.mutation<void, { id: number; data: DeleteUserRequest }>({
      query: ({ id, data }) => ({
        url: `/users/${id}/hard-delete`,
        method: 'DELETE',
        body: data,
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
  useRestoreUserMutation,
  useHardDeleteUserMutation,
} = userApi;
