export type SystemCode = 'IOT' | 'MAS' | 'DORS' | 'DTS';
export type InviteStatus = '已发送' | '已接受' | '已完成' | '已拒绝' | '部分开通';
export interface SystemInfo {
  code: SystemCode;
  name: string;
  description: string;
  available: boolean;
  spaces: string[];
  roles: string[];
}
export interface SystemBinding {
  code: SystemCode;
  org: string;
  role: string;
  enabled: boolean;
  bound: boolean;
}
export interface CustomerSystem {
  code: SystemCode;
  org: string;
  enabled: boolean;
}
export interface Customer {
  key: string;
  name: string;
  createdAt: string;
  systems: CustomerSystem[];
}
export interface PortalUser {
  id: string;
  cid: string;
  account: string;
  name: string;
  phone: string;
  email: string;
  customerKey: string;
  admin: boolean;
  status: '正常' | '已注销';
  systems: SystemBinding[];
}
export interface InviteSystem {
  code: SystemCode;
  org: string;
  role: string;
  mode: 'bind' | 'create';
  result?: string;
}
export interface Invitation {
  id: string;
  phone: string;
  email: string;
  inviterId: string;
  inviter: string;
  createdAt: string;
  status: InviteStatus;
  customerKey: string;
  customerName: string;
  cid?: string;
  newCustomer: boolean;
  systems: InviteSystem[];
}
export interface Session {
  kind: 'admin' | 'customer';
  userId?: string;
  token: string;
}
export interface Snapshot {
  session: Session;
  currentUser?: PortalUser;
  customers: Customer[];
  users: PortalUser[];
  invites: Invitation[];
  catalog: SystemInfo[];
}
export interface LoginValues {
  kind: 'admin' | 'customer';
  method?: 'password' | 'sms';
  account?: string;
  password?: string;
  phone?: string;
  code?: string;
}
export interface LocalAccount {
  code: SystemCode;
  phone: string;
  email: string;
  org: string;
  role: string;
  status: '正常' | '停用';
  boundCid?: string;
}
export interface AccountQuery {
  code: SystemCode;
  account?: LocalAccount;
}
export interface CreateInvitation {
  phone: string;
  email: string;
  customerKey?: string;
  customerName?: string;
  systems: InviteSystem[];
}
export interface PublicInvitation {
  invite: Invitation;
  catalog: SystemInfo[];
}
export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}
