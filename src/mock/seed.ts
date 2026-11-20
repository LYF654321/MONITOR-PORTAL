import type { Customer, Invitation, LocalAccount, PortalUser, SystemInfo } from '@/types';
export interface CenterAccount {
  cid: string;
  account: string;
  phone: string;
  password: string;
}
export interface Database {
  customers: Customer[];
  users: PortalUser[];
  invites: Invitation[];
  localAccounts: LocalAccount[];
  center: CenterAccount[];
  tokens: Record<string, { kind: 'admin' | 'customer'; userId?: string }>;
  codes: Record<string, number>;
}
export const catalog: SystemInfo[] = [
  {
    code: 'IOT',
    name: '物联网平台',
    description: '连接监测设备，管理项目与实时数据',
    available: true,
    spaces: ['华东监测租户', '华南监测租户', '西部监测租户', '华北监测租户'],
    roles: ['租户管理员', '普通用户'],
  },
  {
    code: 'MAS',
    name: '监测预警平台',
    description: '多源监测分析与智能预警',
    available: false,
    spaces: [],
    roles: [],
  },
  {
    code: 'DORS',
    name: '数据运营服务平台',
    description: '一体化数据运营与服务',
    available: false,
    spaces: [],
    roles: [],
  },
  {
    code: 'DTS',
    name: '数据传输服务平台',
    description: '稳定、高效的数据接入与传输',
    available: false,
    spaces: [],
    roles: [],
  },
];
export function seed(): Database {
  const customers: Customer[] = [
    {
      key: 'HC-EAST-001',
      name: '华东监测客户',
      createdAt: '2026-11-16 09:00:00',
      systems: [{ code: 'IOT', org: '华东监测租户', enabled: true }],
    },
    {
      key: 'HC-SOUTH-002',
      name: '华南监测客户',
      createdAt: '2026-11-17 10:30:00',
      systems: [{ code: 'IOT', org: '华南监测租户', enabled: true }],
    },
    { key: 'HC-WEST-003', name: '西部监测客户', createdAt: '2026-11-18 14:00:00', systems: [] },
  ];
  const profiles = [
    [
      'u1',
      'CID1001',
      'zhangchen',
      '张晨',
      '13800138000',
      'HC-EAST-001',
      '华东监测租户',
      '租户管理员',
    ],
    ['u2', 'CID1002', 'liyan', '李岩', '13900139000', 'HC-EAST-001', '华东监测租户', '普通用户'],
    [
      'u3',
      'CID1003',
      'wangwei',
      '王伟',
      '13700137000',
      'HC-SOUTH-002',
      '华南监测租户',
      '租户管理员',
    ],
    ['u4', 'CID1004', 'chentao', '陈涛', '13600136000', 'HC-EAST-001', '华东监测租户', '普通用户'],
    ['u5', 'CID1006', 'zhaomin', '赵敏', '13300133000', 'HC-EAST-001', '华东监测租户', '普通用户'],
    ['u6', 'CID1007', 'liuxin', '刘欣', '13200132000', 'HC-SOUTH-002', '华南监测租户', '普通用户'],
    ['u7', 'CID1008', 'sunyue', '孙悦', '13100131000', 'HC-SOUTH-002', '华南监测租户', '普通用户'],
  ];
  const users: PortalUser[] = profiles.map(
    ([id, cid, account, name, phone, customerKey, org, role]) => ({
      id,
      cid,
      account,
      name,
      phone,
      email: `${account}@example.com`,
      customerKey,
      admin: role === '租户管理员',
      status: id === 'u4' ? '已注销' : '正常',
      systems: [{ code: 'IOT', org, role, enabled: true, bound: true }],
    }),
  );
  const invites: Invitation[] = [
    {
      id: 'inv-existing',
      phone: '13500135000',
      email: 'zhoulin@example.com',
      inviterId: 'portal',
      inviter: '门户管理员',
      createdAt: '2026-11-19 09:40:00',
      status: '已发送',
      customerKey: 'HC-EAST-001',
      customerName: '华东监测客户',
      cid: 'CID1005',
      newCustomer: false,
      systems: [{ code: 'IOT', org: '华东监测租户', role: '普通用户', mode: 'create' }],
    },
    {
      id: 'inv-register',
      phone: '13400134000',
      email: 'sunyi@example.com',
      inviterId: 'u1',
      inviter: '张晨',
      createdAt: '2026-11-19 09:20:00',
      status: '已发送',
      customerKey: 'HC-EAST-001',
      customerName: '华东监测客户',
      newCustomer: false,
      systems: [{ code: 'IOT', org: '华东监测租户', role: '普通用户', mode: 'create' }],
    },
    {
      id: 'inv-done-1',
      phone: '13300133000',
      email: 'zhaomin@example.com',
      inviterId: 'portal',
      inviter: '门户管理员',
      createdAt: '2026-11-18 16:30:00',
      status: '已完成',
      customerKey: 'HC-EAST-001',
      customerName: '华东监测客户',
      cid: 'CID1006',
      newCustomer: false,
      systems: [
        { code: 'IOT', org: '华东监测租户', role: '普通用户', mode: 'create', result: '已开通' },
      ],
    },
    {
      id: 'inv-done-2',
      phone: '13200132000',
      email: 'liuxin@example.com',
      inviterId: 'u3',
      inviter: '王伟',
      createdAt: '2026-11-18 14:15:00',
      status: '已完成',
      customerKey: 'HC-SOUTH-002',
      customerName: '华南监测客户',
      cid: 'CID1007',
      newCustomer: false,
      systems: [
        { code: 'IOT', org: '华南监测租户', role: '普通用户', mode: 'create', result: '已开通' },
      ],
    },
    {
      id: 'inv-refused',
      phone: '13000130000',
      email: 'chenxi@example.com',
      inviterId: 'portal',
      inviter: '门户管理员',
      createdAt: '2026-11-17 11:00:00',
      status: '已拒绝',
      customerKey: 'HC-SOUTH-002',
      customerName: '华南监测客户',
      newCustomer: false,
      systems: [{ code: 'IOT', org: '华南监测租户', role: '普通用户', mode: 'create' }],
    },
    {
      id: 'inv-done-3',
      phone: '13100131000',
      email: 'sunyue@example.com',
      inviterId: 'u3',
      inviter: '王伟',
      createdAt: '2026-11-17 10:00:00',
      status: '已完成',
      customerKey: 'HC-SOUTH-002',
      customerName: '华南监测客户',
      cid: 'CID1008',
      newCustomer: false,
      systems: [
        { code: 'IOT', org: '华南监测租户', role: '普通用户', mode: 'create', result: '已开通' },
      ],
    },
  ];
  return {
    customers,
    users,
    invites,
    localAccounts: users.map((u) => ({
      code: 'IOT',
      phone: u.phone,
      email: u.email,
      org: u.systems[0].org,
      role: u.systems[0].role,
      status: '正常',
      boundCid: u.cid,
    })),
    center: [
      ...users.map((u) => ({
        cid: u.cid,
        account: u.account,
        phone: u.phone,
        password: 'demo1234',
      })),
      { cid: 'CID1005', account: 'zhoulin', phone: '13500135000', password: 'demo1234' },
    ],
    tokens: {},
    codes: {},
  };
}
