# 监测统一门户

基于需求 DR01 和 `D:\IOT1\unified-portal.html` 原型实现的前端工程。采用 React 18、TypeScript、Umi Max 4、Ant Design 5 和 Axios；参考 IAM 的身份入口与请求分层、MAS 的查询区 / 工具栏 / 表格 / 抽屉组织方式，保留独立的页面、组件、服务、类型和 mock 数据层。

## 运行

推荐 Node.js 20 LTS（最低 20.18.0），使用 npm 和工程内的 package-lock.json。

```bash
npm ci
npm run dev
```

访问 `http://localhost:8000`。生产构建：

```bash
npm run build
```

构建产物为 `dist/`。本项目使用浏览器 history 路由，部署时所有页面路径需回退到 `index.html`，邀请链接才能直接打开。可参考 `deploy/nginx.conf.example`。

## 演示账号

| 入口 | 身份 | 账号 | 密码 |
| --- | --- | --- | --- |
| 管理员入口 | 门户管理员 | admin | admin123 |
| 客户入口 | 华东客户管理员 | 13800138000 | demo1234 |
| 客户入口 | 华东普通用户 | 13900139000 | demo1234 |
| 客户入口 | 华南客户管理员 | 13700137000 | demo1234 |

客户入口也可使用手机验证码登录。先点击“获取验证码”，模拟验证码为 `123456`，重发间隔 60 秒，有效期 5 分钟。

预置邀请（在未完成前可反复打开）：

- `/invitation/inv-existing`：手机号 13500135000 已有客户中心账号，接受邀请并短信验证后完成绑定。
- `/invitation/inv-register`：手机号 13400134000 尚未注册，接受邀请后填写用户名、密码及验证码。

手机号 13500135000 在接受邀请之前不能登录门户。新建客户的首位受邀人完成开通后，自动成为该客户管理员。手机端完成开通后展示电脑端门户地址；桌面端进入工作台。

## 已实现页面与交互

- 登录：客户密码登录、手机验证码登录、管理员本地登录；未邀请绑定和已注销账号限制。
- 邀请管理：组合查询、排序、分页、详情、复制链接；新建 / 已有客户、系统账号查询、已有账号确认绑定、空间与角色配置、重复邀请校验。
- 客户管理：客户查询、业务系统配置、客户入口开关、客户管理员配置；已绑定空间不可更换。
- 用户管理：按账号 / 手机 / 邮箱 / 客户 Key 查询、用户系统入口开关与角色选择、注销确认及会话撤销。
- 工作台：个人信息、客户 Key、系统空间与角色、有效系统入口。
- 公开邀请页：只读受邀信息、接受 / 拒绝、短信认证、注册、部分开通反馈、手机布局。
- IOT 接入演示：一次性票据、60 秒过期与重复消费限制、身份及授权校验、业务系统切换。当前只有 IOT 可用，MAS / DORS / DTS 展示为待接入。

门户管理员管理全部客户和用户；客户管理员管理本客户用户；普通用户只显示工作台与自己的邀请记录。客户发起邀请受自身系统、空间与角色范围约束。客户关闭系统后，其下用户入口统一关闭，保留原授权和绑定；重新开启后恢复符合条件的入口。用户注销保留客户中心与业务系统账号，撤销门户会话，需要重新邀请才能恢复。

## Mock 与真实服务的边界

默认使用浏览器内的 Axios mock adapter，无需额外启动后端。模拟数据库持久化到当前浏览器、当前站点的 localStorage，登录令牌存于当前标签页的 sessionStorage。同站点标签页间会同步用户及授权变化。

本工程没有连接真实华测云客户中心、短信、邮件或 IOT。创建邀请只生成可复制的本地链接；IOT 页面用于展示接入校验结果，不是 IOT 业务系统。模拟数据中包含演示身份凭证，仅供本地演示；正式凭证校验、短信、邮件、账号开通和票据签发 / 校验均应由服务端负责，client_secret 不应进入前端。

清除演示修改并重新载入种子数据，可在浏览器控制台执行：

```js
localStorage.removeItem('monitor-portal:mock:v1');
localStorage.removeItem('monitor-portal:mock:tickets');
sessionStorage.removeItem('monitor-portal:token');
location.assign('/login');
```

正式接入时复制 `.env.example` 为 `.env.local`，设置 `UMI_APP_MOCK=false` 和 `UMI_APP_API_BASE`，然后重启开发服务或重新构建。环境变量在构建时写入，不能只在静态部署后更改。`/api` 地址默认由部署网关转发；直接跨域地址需服务端允许跨域。

当前 `src/services/index.ts` 中的路径和请求结构是本工程的待对接约定，并非已经核实的客户中心公开接口。服务端需提供门户接口，或按正式接口调整该服务层。当前业务响应约定为：

```ts
{ code: 'SUCCESS', message: '操作成功', data: T }
{ code: 'BUSINESS_ERROR', message: '业务提示', data: null }
{ code: 'UNAUTHORIZED', message: '登录状态已失效', data: null }
```

请求统一附带 `Authorization: Bearer <token>`。`snapshot` 提供当前身份可见的客户、用户、邀请与系统目录；正式服务必须在接口侧校验身份、客户范围和权限。真实 IOT 票据地址由 `/tickets` 返回，成功后前端跳转该地址。

## 目录

```text
config/config.ts           Umi、主题入口和环境配置
src/pages/                 登录、邀请、客户、用户、工作台、公开邀请及接入演示
src/components/            品牌、页面标题、表格、状态、复制、短信按钮和门户布局
src/hooks/usePortal.tsx    当前身份、数据刷新、登录退出和操作状态
src/services/              Axios 请求和业务接口
src/mock/                  种子数据、权限规则和 mock adapter
src/types/                 业务类型
src/utils/                 查询处理、邀请地址和有效系统计算
src/styles/global.less     统一样式、深浅主题和响应式布局
public/                    静态资源
```

新增业务系统先扩展系统目录及服务端接入能力，再接入本地账号查询、绑定 / 开通、有效性校验和票据入口。表格与抽屉保持薄封装，直接使用 Ant Design 的筛选、分页、表单验证及反馈能力。
