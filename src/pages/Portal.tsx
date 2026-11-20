import { useEffect, useState } from "react";
import { history, useLocation } from "@umijs/max";
import { App, ConfigProvider, Result, theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { PortalProvider, usePortal } from "@/hooks/usePortal";
import PortalLayout from "@/components/PortalLayout";
import Login from "./Login";
import Invitations from "./Invitations";
import Customers from "./Customers";
import Users from "./Users";
import Workbench from "./Workbench";
import InvitationLanding from "./InvitationLanding";
import IotDemo from "./IotDemo";
import "@/styles/global.less";

dayjs.locale("zh-cn");
export default function Portal() {
  const [dark, setDark] = useState(() => {
    const value = localStorage.getItem("monitor-portal:theme") === "dark";
    document.documentElement.dataset.theme = value ? "dark" : "light";
    return value;
  });
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  function toggleTheme() {
    setDark((value) => {
      localStorage.setItem("monitor-portal:theme", value ? "light" : "dark");
      return !value;
    });
  }
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#f47721",
          colorInfo: "#f47721",
          colorSuccess: "#23a879",
          colorWarning: "#e9a23b",
          colorError: "#e05252",
          colorText: dark ? "#e8eaed" : "#253449",
          colorTextSecondary: dark ? "#a4adba" : "#63748a",
          colorBgLayout: dark ? "#10141c" : "#f5f7fa",
          colorBorderSecondary: dark ? "#303744" : "#edf0f4",
          borderRadius: 6,
          fontSize: 14,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
          controlHeight: 36,
        },
        components: {
          Layout: {
            headerBg: dark ? "#191f29" : "#ffffff",
            siderBg: dark ? "#191f29" : "#ffffff",
          },
          Menu: {
            itemHeight: 46,
            itemMarginInline: 14,
            itemSelectedBg: dark ? "#402b20" : "#fff2e8",
            itemSelectedColor: "#f47721",
            itemBorderRadius: 6,
          },
          Table: {
            headerBg: dark ? "#202733" : "#f8f9fb",
            headerColor: dark ? "#a4adba" : "#69768a",
            headerSplitColor: "transparent",
            cellPaddingBlock: 18,
          },
          Button: { primaryShadow: "none" },
          Drawer: { footerPaddingBlock: 16 },
          Tabs: { horizontalItemGutter: 28 },
        },
      }}
    >
      <App>
        <div className={dark ? "app-root theme-dark" : "app-root"}>
          <PortalProvider>
            <PortalRoutes dark={dark} onThemeChange={toggleTheme} />
          </PortalProvider>
        </div>
      </App>
    </ConfigProvider>
  );
}
function PortalRoutes({
  dark,
  onThemeChange,
}: {
  dark: boolean;
  onThemeChange: () => void;
}) {
  const { data } = usePortal();
  const location = useLocation();
  const path = location.pathname;
  const invitation = path.match(/^\/invitation\/([^/]+)$/);
  const isAdmin = data?.session.kind === "admin";
  const canManage = isAdmin || data?.currentUser?.admin;
  const defaultPath = isAdmin ? "/invitations" : "/workbench";
  useEffect(() => {
    if (invitation) return;
    if (!data && path !== "/login") history.replace("/login");
    else if (data && (path === "/" || path === "/login"))
      history.replace(defaultPath);
    else if (
      data &&
      ((path === "/customers" && !isAdmin) ||
        (path === "/users" && !canManage) ||
        (path === "/workbench" && isAdmin))
    )
      history.replace(defaultPath);
  }, [path, data, isAdmin, canManage, defaultPath, Boolean(invitation)]);
  if (invitation)
    return (
      <InvitationLanding
        key={invitation[1]}
        id={decodeURIComponent(invitation[1])}
      />
    );
  if (!data) return <Login />;
  if (path === "/iot-demo") return <IotDemo />;
  let content;
  if (path === "/invitations") content = <Invitations />;
  else if (path === "/customers" && isAdmin) content = <Customers />;
  else if (path === "/users" && canManage) content = <Users />;
  else if (
    (path === "/workbench" || path === "/" || path === "/login") &&
    !isAdmin
  )
    content = <Workbench />;
  else if (path === "/" || path === "/login") content = <Invitations />;
  else
    content = (
      <Result
        status="404"
        title="页面不存在"
        subTitle="请通过左侧导航访问已开通的功能。"
      />
    );
  return (
    <PortalLayout dark={dark} onThemeChange={onThemeChange}>
      {content}
    </PortalLayout>
  );
}
