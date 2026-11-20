import { useState } from "react";
import { history, useLocation } from "@umijs/max";
import {
  App,
  Avatar,
  Button,
  Drawer,
  Dropdown,
  Layout,
  Menu,
  Space,
  Tooltip,
} from "antd";
import {
  AppstoreOutlined,
  ApartmentOutlined,
  LogoutOutlined,
  MailOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  QuestionCircleOutlined,
  SafetyCertificateOutlined,
  SunOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Brand } from "@/components";
import { usePortal } from "@/hooks/usePortal";
import { isMock } from "@/services/request";
import type { ReactNode } from "react";
export default function PortalLayout({
  children,
  dark,
  onThemeChange,
}: {
  children: ReactNode;
  dark: boolean;
  onThemeChange: () => void;
}) {
  const { data, signOut } = usePortal();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const { modal } = App.useApp();
  if (!data) return null;
  const isAdmin = data.session.kind === "admin";
  const actor = data.currentUser;
  const canManage = isAdmin || actor?.admin;
  const isListPage = ["/invitations", "/customers", "/users"].includes(
    location.pathname,
  );
  const items = [
    ...(!isAdmin
      ? [{ key: "/workbench", icon: <AppstoreOutlined />, label: "工作台" }]
      : []),
    { key: "/invitations", icon: <MailOutlined />, label: "邀请管理" },
    ...(isAdmin
      ? [{ key: "/customers", icon: <ApartmentOutlined />, label: "客户管理" }]
      : []),
    ...(canManage
      ? [{ key: "/users", icon: <TeamOutlined />, label: "用户管理" }]
      : []),
  ];
  const role = isAdmin
    ? "门户管理员"
    : actor?.admin
      ? "客户管理员"
      : "客户用户";
  const menu = (
    <>
      <div className="nav-label">{collapsed ? "" : "门户管理"}</div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={items}
        onClick={({ key }) => {
          history.push(key);
          setMobileMenu(false);
        }}
      />
      <div className="sidebar-bottom">
        {!collapsed && (
          <>
            <SafetyCertificateOutlined />
            <div>
              <strong>统一身份 · 独立授权</strong>
              <p>安全连接每一个业务系统</p>
            </div>
          </>
        )}
      </div>
    </>
  );
  return (
    <Layout className="portal-layout">
      <Layout.Header className="portal-header">
        <div className="header-left">
          <Brand />
        </div>
        <Space size={18} className="header-actions">
          <Tooltip title={dark ? "切换浅色主题" : "切换深色主题"}>
            <Button
              type="text"
              aria-label="切换主题"
              icon={dark ? <SunOutlined /> : <MoonOutlined />}
              onClick={onThemeChange}
            />
          </Tooltip>
          <Tooltip title="使用帮助">
            <Button
              type="text"
              aria-label="使用帮助"
              icon={<QuestionCircleOutlined />}
              onClick={() =>
                modal.info({
                  title: "监测统一门户使用说明",
                  content: (
                    <div className="help-content">
                      <p>
                        门户管理员通过邀请开通客户与用户，再配置业务系统入口。
                      </p>
                      <p>
                        客户管理员仅能管理所属客户下的用户。普通用户可在自身权限范围内邀请新用户。
                      </p>
                      <p>业务系统的租户、角色和数据权限继续由各系统管理。</p>
                      {isMock && (
                        <p>
                          当前为演示环境，邮件、短信和 IOT
                          跳转均使用本地模拟服务。
                        </p>
                      )}
                    </div>
                  ),
                })
              }
            />
          </Tooltip>
          <span className="header-divider" />
          <Dropdown
            menu={{
              items: [
                { key: "role", label: role, disabled: true },
                { type: "divider" },
                {
                  key: "logout",
                  label: "退出登录",
                  icon: <LogoutOutlined />,
                  onClick: () => void signOut(),
                },
              ],
            }}
            trigger={["click"]}
          >
            <button className="user-menu">
              <Avatar
                size={34}
                icon={
                  isAdmin ? <SafetyCertificateOutlined /> : <UserOutlined />
                }
              />
              <div>
                <strong>{isAdmin ? "admin" : actor?.name}</strong>
                <small>{role}</small>
              </div>
            </button>
          </Dropdown>
        </Space>
      </Layout.Header>
      <Layout>
        <Layout.Sider
          width={224}
          collapsedWidth={76}
          collapsed={collapsed}
          className={`portal-sider ${collapsed ? "portal-sider-collapsed" : ""}`}
          theme={dark ? "dark" : "light"}
        >
          {menu}
          <button
            className="collapse-button"
            aria-label={collapsed ? "展开导航" : "收起导航"}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            {!collapsed && <span>收起导航</span>}
          </button>
        </Layout.Sider>
        <Layout
          className={`workspace ${collapsed ? "workspace-collapsed" : ""}`}
        >
          <div className="breadcrumbs">
            <Button
              className="mobile-menu-button"
              type="text"
              aria-label="打开菜单"
              icon={<MenuUnfoldOutlined />}
              onClick={() => setMobileMenu(true)}
            />
            <span>监测统一门户</span>
            <span>/</span>
            <strong>
              {items.find((i) => i.key === location.pathname)?.label ||
                "工作台"}
            </strong>
          </div>
          <Layout.Content
            className={`workspace-content ${isListPage ? "workspace-content-list" : ""}`}
          >
            {children}
          </Layout.Content>
          <Layout.Footer className="portal-footer">
            <span>© {new Date().getFullYear()} 华测导航 · 监测统一门户</span>
            <span>统一连接，让监测更简单</span>
          </Layout.Footer>
        </Layout>
      </Layout>
      <Drawer
        placement="left"
        open={mobileMenu}
        onClose={() => setMobileMenu(false)}
        width={250}
        title={<Brand compact />}
        className="mobile-nav"
      >
        {menu}
      </Drawer>
    </Layout>
  );
}
