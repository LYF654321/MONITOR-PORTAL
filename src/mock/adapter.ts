import type { AxiosAdapter } from "axios";
import dayjs from "dayjs";
import { catalog, seed, type Database } from "./seed";
import type {
  CreateInvitation,
  Customer,
  CustomerSystem,
  Invitation,
  InviteSystem,
  LoginValues,
  PortalUser,
  Session,
  Snapshot,
  SystemCode,
} from "@/types";

const STORE = "monitor-portal:mock:v1";
const TICKETS = "monitor-portal:mock:tickets";
const phonePattern = /^1\d{10}$/;
const now = () => dayjs().format("YYYY-MM-DD HH:mm:ss");
const uid = () => crypto.randomUUID();
function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function load(): Database {
  const value = localStorage.getItem(STORE);
  return value ? JSON.parse(value) : seed();
}
function save(db: Database) {
  localStorage.setItem(STORE, JSON.stringify(db));
}
function current(db: Database, session: Session) {
  return db.users.find((user) => user.id === session.userId);
}
function customer(db: Database, key: string) {
  const item = db.customers.find((c) => c.key === key);
  ensure(item, "客户不存在");
  return item;
}
function active(db: Database, user: PortalUser, code: SystemCode) {
  const config = customer(db, user.customerKey).systems.find(
    (item) => item.code === code,
  );
  const binding = user.systems.find((item) => item.code === code);
  const local = db.localAccounts.find(
    (item) => item.code === code && item.phone === user.phone,
  );
  return Boolean(
    user.status === "正常" &&
    config?.enabled &&
    binding?.enabled &&
    binding.bound &&
    local?.status === "正常" &&
    local.boundCid === user.cid &&
    local.org === config.org &&
    binding.org === config.org &&
    local.role === binding.role,
  );
}
function canManage(db: Database, session: Session, key: string) {
  const actor = current(db, session);
  ensure(
    session.kind === "admin" || (actor?.admin && actor.customerKey === key),
    "无权管理该客户",
  );
}
function validateSystem(code: SystemCode) {
  ensure(
    catalog.some((s) => s.code === code && s.available),
    "该业务系统尚未接入",
  );
}
function allowedRole(
  db: Database,
  session: Session,
  code: SystemCode,
  role: string,
) {
  const system = catalog.find((s) => s.code === code);
  ensure(system?.roles.includes(role), "请选择有效角色");
  if (session.kind === "customer") {
    const actor = current(db, session)!;
    const own = actor.systems.find((s) => s.code === code);
    ensure(
      active(db, actor, code) &&
        own &&
        (own.role === "租户管理员" || own.role === role),
      "邀请配置超出当前用户的业务权限",
    );
  }
}
function validLocal(
  db: Database,
  phone: string,
  code: SystemCode,
  org: string,
  role: string,
  cid?: string,
) {
  const local = db.localAccounts.find(
    (a) => a.phone === phone && a.code === code,
  );
  if (local) {
    ensure(local.status === "正常", "业务系统账号已停用，请先在业务系统处理");
    ensure(
      local.org === org && local.role === role,
      "已有账号的空间或角色不一致，请先在业务系统处理",
    );
    ensure(
      !local.boundCid || local.boundCid === cid,
      "业务系统账号已绑定其他身份",
    );
  }
  return local;
}
function bind(
  db: Database,
  user: PortalUser,
  code: SystemCode,
  org: string,
  role: string,
) {
  const local = validLocal(db, user.phone, code, org, role, user.cid);
  if (local) local.boundCid = user.cid;
  else
    db.localAccounts.push({
      code,
      phone: user.phone,
      email: user.email,
      org,
      role,
      status: "正常",
      boundCid: user.cid,
    });
  const binding = user.systems.find((s) => s.code === code);
  const values = { code, org, role, enabled: true, bound: true };
  if (binding) Object.assign(binding, values);
  else user.systems.push(values);
}
function sms(db: Database, phone: string, code: string) {
  ensure(
    code === "123456" &&
      db.codes[phone] &&
      Date.now() - db.codes[phone] < 300000,
    "验证码错误或已过期，请重新获取",
  );
}
function newSession(
  db: Database,
  kind: Session["kind"],
  userId?: string,
): Session {
  const token = uid();
  db.tokens[token] = { kind, userId };
  return { kind, userId, token };
}
function snapshot(db: Database, session: Session): Snapshot {
  const user = current(db, session);
  const users =
    session.kind === "admin"
      ? db.users
      : user?.admin
        ? db.users.filter((u) => u.customerKey === user.customerKey)
        : user
          ? [user]
          : [];
  const sanitized = (u: PortalUser) => ({
    ...u,
    systems: u.systems.map((s) => ({
      ...s,
      bound:
        s.bound &&
        Boolean(
          db.localAccounts.find(
            (a) =>
              a.code === s.code &&
              a.phone === u.phone &&
              a.status === "正常" &&
              a.boundCid === u.cid &&
              a.org === s.org &&
              a.role === s.role,
          ),
        ),
    })),
  });
  return {
    session,
    currentUser: user ? sanitized(user) : undefined,
    customers:
      session.kind === "admin"
        ? db.customers
        : db.customers.filter((c) => c.key === user?.customerKey),
    users: users.map(sanitized),
    invites:
      session.kind === "admin"
        ? db.invites
        : db.invites.filter((i) => i.inviterId === user?.id),
    catalog,
  };
}
function route(
  db: Database,
  method: string,
  url: string,
  body: Record<string, any>,
  token?: string,
): unknown {
  if (url === "/auth/code" && method === "post") {
    ensure(phonePattern.test(body.phone), "请输入有效的手机号码");
    ensure(
      !db.codes[body.phone] || Date.now() - db.codes[body.phone] >= 60000,
      "验证码已发送，请稍后重试",
    );
    db.codes[body.phone] = Date.now();
    return { retryAfter: 60, demoCode: "123456" };
  }
  if (url === "/auth/login" && method === "post") {
    const values = body as unknown as LoginValues;
    if (values.kind === "admin") {
      ensure(
        values.account === "admin" && values.password === "admin123",
        "管理员账号或密码不正确",
      );
      return newSession(db, "admin");
    }
    let identity;
    if (values.method === "sms") {
      sms(db, values.phone!, values.code!);
      identity = db.center.find((a) => a.phone === values.phone);
    } else
      identity = db.center.find(
        (a) =>
          (a.account === values.account || a.phone === values.account) &&
          a.password === values.password,
      );
    ensure(identity, "客户中心账号或认证信息不正确");
    const user = db.users.find((u) => u.cid === identity.cid);
    ensure(user, "该账号未通过门户邀请注册认证，请联系门户管理员处理");
    ensure(user.status === "正常", "该用户已注销，请重新接受邀请");
    return newSession(db, "customer", user.id);
  }
  const publicMatch = url.match(
    /^\/public\/invitations\/([^/]+)(?:\/(accept|reject|complete))?$/,
  );
  if (publicMatch) {
    const invitation = db.invites.find((i) => i.id === publicMatch[1]);
    ensure(invitation, "邀请链接不存在，请联系邀请人");
    if (method === "get") return { invite: invitation, catalog };
    ensure(
      !["已完成", "已拒绝"].includes(invitation.status),
      "该邀请已结束，请联系邀请人",
    );
    if (publicMatch[2] === "reject") {
      invitation.status = "已拒绝";
      return invitation;
    }
    if (publicMatch[2] === "accept") {
      invitation.status = "已接受";
      return invitation;
    }
    if (publicMatch[2] === "complete") {
      ensure(
        ["已接受", "部分开通"].includes(invitation.status),
        "请先接受邀请",
      );
      sms(db, invitation.phone, body.code);
      let identity = db.center.find((a) => a.phone === invitation.phone);
      if (!identity) {
        ensure(
          /^[a-zA-Z][a-zA-Z0-9_]{2,29}$/.test(body.account || ""),
          "用户名为3至30位字母、数字或下划线，需以字母开头",
        );
        ensure(
          !db.center.some((a) => a.account === body.account),
          "用户名已存在",
        );
        ensure(
          typeof body.password === "string" &&
            body.password.length >= 8 &&
            /[a-zA-Z]/.test(body.password) &&
            /\d/.test(body.password),
          "密码至少8位，且包含字母和数字",
        );
        identity = {
          cid: `CID-${uid()}`,
          account: body.account,
          phone: invitation.phone,
          password: body.password,
        };
        db.center.push(identity);
      }
      let user = db.users.find((u) => u.cid === identity.cid);
      ensure(
        !user ||
          user.customerKey === invitation.customerKey ||
          user.status === "已注销",
        "账号已归属其他客户，请联系邀请人处理",
      );
      if (!user) {
        user = {
          id: uid(),
          cid: identity.cid,
          account: identity.account,
          name: identity.account,
          phone: invitation.phone,
          email: invitation.email,
          customerKey: invitation.customerKey,
          admin: invitation.newCustomer,
          status: "正常",
          systems: [],
        };
        db.users.push(user);
      }
      if (user.status === "已注销") {
        user.systems = [];
        user.customerKey = invitation.customerKey;
        user.admin = invitation.newCustomer;
      }
      user.status = "正常";
      user.email = invitation.email;
      for (const item of invitation.systems) {
        try {
          const config = customer(db, user.customerKey).systems.find(
            (s) => s.code === item.code,
          );
          ensure(
            config?.enabled && config.org === item.org,
            "客户尚未开启该系统",
          );
          bind(db, user, item.code, item.org, item.role);
          item.result = "已开通";
        } catch (error) {
          item.result = error instanceof Error ? error.message : "开通失败";
        }
      }
      invitation.cid = identity.cid;
      invitation.status = invitation.systems.every((s) => s.result === "已开通")
        ? "已完成"
        : "部分开通";
      delete db.codes[invitation.phone];
      return {
        session: newSession(db, "customer", user.id),
        invite: invitation,
      };
    }
  }
  const credentials = token ? db.tokens[token] : undefined;
  ensure(credentials, "UNAUTHORIZED");
  const session: Session = { ...credentials, token: token! };
  if (session.kind === "customer")
    ensure(current(db, session)?.status === "正常", "UNAUTHORIZED");
  if (url === "/snapshot") return snapshot(db, session);
  if (url === "/auth/logout") {
    delete db.tokens[session.token];
    return null;
  }
  if (url === "/accounts/query") {
    ensure(phonePattern.test(body.phone), "请输入有效的手机号码");
    return (body.codes as SystemCode[]).map((code) => {
      validateSystem(code);
      return {
        code,
        account: db.localAccounts.find(
          (a) => a.phone === body.phone && a.code === code,
        ),
      };
    });
  }
  if (url === "/invitations" && method === "post") {
    const values = body as unknown as CreateInvitation;
    ensure(phonePattern.test(values.phone), "请输入有效的手机号码");
    ensure(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email), "请输入有效邮箱");
    ensure(values.systems?.length > 0, "请配置至少一个业务系统");
    ensure(
      new Set(values.systems.map((s) => s.code)).size === values.systems.length,
      "业务系统不能重复",
    );
    let target: Customer;
    if (session.kind === "customer") {
      target = customer(db, current(db, session)!.customerKey);
      ensure(
        !values.customerKey || values.customerKey === target.key,
        "不能邀请其他客户的用户",
      );
      ensure(!values.customerName, "无权新建客户");
    } else if (values.customerKey) target = customer(db, values.customerKey);
    else {
      ensure(
        values.customerName?.trim() && values.customerName.trim().length <= 50,
        "客户名称不能为空且不超过50字",
      );
      ensure(
        !db.customers.some((c) => c.name === values.customerName!.trim()),
        "客户名称已存在",
      );
      target = {
        key: `HC-${uid().slice(0, 8).toUpperCase()}`,
        name: values.customerName.trim(),
        createdAt: now(),
        systems: [],
      };
    }
    const identity = db.center.find((a) => a.phone === values.phone);
    const existing = db.users.find(
      (u) => u.phone === values.phone && u.status === "正常",
    );
    ensure(
      !existing || existing.customerKey === target.key,
      "该手机号已归属其他客户",
    );
    ensure(
      !db.invites.some(
        (i) =>
          i.phone === values.phone &&
          ["已发送", "已接受", "部分开通"].includes(i.status),
      ),
      "该手机号已有待处理邀请",
    );
    const systems: InviteSystem[] = values.systems.map((s) => {
      validateSystem(s.code);
      allowedRole(db, session, s.code, s.role);
      const definition = catalog.find((c) => c.code === s.code)!;
      ensure(definition.spaces.includes(s.org), "请选择有效的业务空间");
      if (values.customerKey || session.kind === "customer")
        ensure(
          target.systems.some(
            (c) => c.code === s.code && c.org === s.org && c.enabled,
          ),
          "配置超出客户已开通的业务空间",
        );
      const local = validLocal(
        db,
        values.phone,
        s.code,
        s.org,
        s.role,
        identity?.cid,
      );
      ensure(!local || s.mode === "bind", "请确认绑定已有关联账号");
      ensure(local || s.mode === "create", "账号查询结果已变化，请重新查询");
      return { code: s.code, org: s.org, role: s.role, mode: s.mode };
    });
    if (!db.customers.some((c) => c.key === target.key)) {
      target.systems = systems.map((s) => ({
        code: s.code,
        org: s.org,
        enabled: true,
      }));
      db.customers.push(target);
    }
    const actor = current(db, session);
    const invitation: Invitation = {
      id: uid(),
      phone: values.phone,
      email: values.email,
      inviterId: actor?.id || "portal",
      inviter: actor?.name || "门户管理员",
      createdAt: now(),
      status: "已发送",
      customerKey: target.key,
      customerName: target.name,
      cid: identity?.cid,
      newCustomer: !values.customerKey && session.kind === "admin",
      systems,
    };
    db.invites.unshift(invitation);
    return invitation;
  }
  const customerMatch = url.match(/^\/customers\/([^/]+)\/(systems|admins)$/);
  if (customerMatch) {
    ensure(session.kind === "admin", "仅门户管理员可管理客户");
    const target = customer(db, customerMatch[1]);
    if (customerMatch[2] === "admins") {
      const ids = body.ids as string[];
      ensure(Array.isArray(ids) && ids.length > 0, "请至少配置一名客户管理员");
      const selected = db.users.filter((u) => ids.includes(u.id));
      ensure(
        selected.length === ids.length &&
          selected.every(
            (u) => u.customerKey === target.key && u.status === "正常",
          ),
        "请选择该客户的有效用户",
      );
      for (const user of selected)
        for (const s of target.systems.filter((s) => s.enabled)) {
          const binding = user.systems.find((b) => b.code === s.code);
          ensure(
            binding?.bound,
            "候选管理员尚未完成系统账号绑定，请先为其配置业务系统",
          );
          validLocal(db, user.phone, s.code, s.org, binding.role, user.cid);
        }
      for (const user of db.users.filter((u) => u.customerKey === target.key)) {
        user.admin = ids.includes(user.id);
        if (user.admin)
          for (const s of target.systems.filter((s) => s.enabled))
            user.systems.find((b) => b.code === s.code)!.enabled = true;
      }
      return target;
    }
    const systems = body.systems as CustomerSystem[];
    ensure(Array.isArray(systems), "配置格式错误");
    ensure(
      new Set(systems.map((s) => s.code)).size === systems.length,
      "不能重复配置业务系统",
    );
    for (const s of target.systems)
      ensure(
        systems.some((n) => n.code === s.code && n.org === s.org),
        "已绑定的业务空间不支持更换或删除",
      );
    for (const s of systems) {
      validateSystem(s.code);
      ensure(
        catalog.find((c) => c.code === s.code)!.spaces.includes(s.org),
        "请选择有效业务空间",
      );
      if (
        s.enabled &&
        !target.systems.find((old) => old.code === s.code)?.enabled
      )
        for (const user of db.users.filter(
          (u) => u.customerKey === target.key && u.admin && u.status === "正常",
        )) {
          const binding = user.systems.find((b) => b.code === s.code);
          if (binding) continue;
          const role = body.adminRole;
          ensure(
            role &&
              catalog.find((c) => c.code === s.code)!.roles.includes(role),
            "请配置管理员的业务角色",
          );
          bind(db, user, s.code, s.org, role);
        }
    }
    target.systems = systems;
    return target;
  }
  const userMatch = url.match(/^\/users\/([^/]+)\/(systems|revoke)$/);
  if (userMatch) {
    const user = db.users.find((u) => u.id === userMatch[1]);
    ensure(user, "用户不存在");
    canManage(db, session, user.customerKey);
    ensure(user.status === "正常", "该用户已注销");
    if (userMatch[2] === "revoke") {
      user.status = "已注销";
      user.admin = false;
      for (const [key, value] of Object.entries(db.tokens))
        if (value.userId === user.id) delete db.tokens[key];
      return null;
    }
    const code = body.code as SystemCode;
    validateSystem(code);
    const config = customer(db, user.customerKey).systems.find(
      (s) => s.code === code,
    );
    ensure(config, "客户尚未配置该系统");
    let binding = user.systems.find((s) => s.code === code);
    if (body.enabled) {
      ensure(config.enabled, "客户已关闭该系统，请联系门户管理员");
      const role = binding?.role || body.role;
      ensure(
        catalog.find((s) => s.code === code)!.roles.includes(role),
        "请选择有效角色",
      );
      bind(db, user, code, config.org, role);
    } else {
      ensure(binding, "该用户尚未开通该系统");
      binding.enabled = false;
    }
    return user;
  }
  if (url === "/tickets" && method === "post") {
    const user = current(db, session);
    ensure(
      user && active(db, user, body.code),
      "当前系统入口未开通或账号绑定异常",
    );
    const ticket = uid();
    const tickets = JSON.parse(localStorage.getItem(TICKETS) || "{}");
    tickets[ticket] = {
      userId: user.id,
      code: body.code,
      expires: Date.now() + 60000,
    };
    localStorage.setItem(TICKETS, JSON.stringify(tickets));
    return { url: `/iot-demo?ticket=${ticket}` };
  }
  if (url === "/tickets/consume") {
    const tickets = JSON.parse(localStorage.getItem(TICKETS) || "{}");
    const ticket = tickets[body.ticket];
    ensure(
      ticket && ticket.expires > Date.now() && ticket.userId === session.userId,
      "登录票据无效或已使用，请从工作台重新进入",
    );
    const user = db.users.find((u) => u.id === ticket.userId)!;
    ensure(active(db, user, ticket.code), "账号或授权状态已发生变化");
    delete tickets[body.ticket];
    localStorage.setItem(TICKETS, JSON.stringify(tickets));
    return { user, system: catalog.find((c) => c.code === ticket.code) };
  }
  throw new Error("接口不存在");
}
export const mockAdapter: AxiosAdapter = async (config) => {
  await new Promise((resolve) => setTimeout(resolve, 180));
  const db = load();
  try {
    const body =
      typeof config.data === "string"
        ? JSON.parse(config.data)
        : config.data || {};
    const token = String(config.headers?.Authorization || "").replace(
      /^Bearer /,
      "",
    );
    const data = route(
      db,
      (config.method || "get").toLowerCase(),
      config.url || "",
      body,
      token,
    );
    save(db);
    return {
      data: { code: "SUCCESS", message: "操作成功", data },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "请求失败";
    return {
      data: {
        code: message === "UNAUTHORIZED" ? "UNAUTHORIZED" : "BUSINESS_ERROR",
        message:
          message === "UNAUTHORIZED" ? "登录状态已失效，请重新登录" : message,
        data: null,
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  }
};
