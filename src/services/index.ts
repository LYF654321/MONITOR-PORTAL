import { request } from './request';
import type {
  AccountQuery,
  CreateInvitation,
  CustomerSystem,
  Invitation,
  LoginValues,
  PortalUser,
  PublicInvitation,
  Session,
  Snapshot,
  SystemCode,
  SystemInfo,
} from '@/types';
export const api = {
  login: (data: LoginValues) => request<Session>({ url: '/auth/login', method: 'post', data }),
  logout: () => request<void>({ url: '/auth/logout', method: 'post' }),
  code: (phone: string) =>
    request<{ retryAfter: number; demoCode?: string }>({
      url: '/auth/code',
      method: 'post',
      data: { phone },
    }),
  snapshot: () => request<Snapshot>({ url: '/snapshot' }),
  queryAccounts: (phone: string, codes: SystemCode[]) =>
    request<AccountQuery[]>({ url: '/accounts/query', method: 'post', data: { phone, codes } }),
  createInvite: (data: CreateInvitation) =>
    request<Invitation>({ url: '/invitations', method: 'post', data }),
  invitation: (id: string) => request<PublicInvitation>({ url: `/public/invitations/${id}` }),
  acceptInvite: (id: string) =>
    request<Invitation>({ url: `/public/invitations/${id}/accept`, method: 'post' }),
  rejectInvite: (id: string) =>
    request<Invitation>({ url: `/public/invitations/${id}/reject`, method: 'post' }),
  completeInvite: (id: string, data: { code: string; account?: string; password?: string }) =>
    request<{ session: Session; invite: Invitation }>({
      url: `/public/invitations/${id}/complete`,
      method: 'post',
      data,
    }),
  saveCustomerSystems: (key: string, systems: CustomerSystem[], adminRole?: string) =>
    request<void>({
      url: `/customers/${key}/systems`,
      method: 'put',
      data: { systems, adminRole },
    }),
  saveAdmins: (key: string, ids: string[]) =>
    request<void>({ url: `/customers/${key}/admins`, method: 'put', data: { ids } }),
  saveUserSystem: (id: string, code: SystemCode, enabled: boolean, role?: string) =>
    request<void>({ url: `/users/${id}/systems`, method: 'put', data: { code, enabled, role } }),
  revokeUser: (id: string) => request<void>({ url: `/users/${id}/revoke`, method: 'post' }),
  ticket: (code: SystemCode) =>
    request<{ url: string }>({ url: '/tickets', method: 'post', data: { code } }),
  consumeTicket: (ticket: string) =>
    request<{ user: PortalUser; system: SystemInfo }>({
      url: '/tickets/consume',
      method: 'post',
      data: { ticket },
    }),
};
