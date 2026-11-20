import { useState } from "react";
import { history } from "@umijs/max";
import { Button, Form, Input, Segmented, Space, Tabs } from "antd";
import {
  ArrowRightOutlined,
  LockOutlined,
  MobileOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Brand } from "@/components";
import { SmsButton } from "@/components/SmsButton";
import { useAction, usePortal } from "@/hooks/usePortal";
import { api } from "@/services";
import { isMock } from "@/services/request";
import type { LoginValues } from "@/types";
export default function Login() {
  const [kind, setKind] = useState<"admin" | "customer">("customer");
  const [method, setMethod] = useState<"password" | "sms">("password");
  const [form] = Form.useForm<LoginValues>();
  const { run, pending } = useAction();
  const { signIn } = usePortal();
  function changeKind(value: "admin" | "customer") {
    setKind(value);
    form.resetFields();
    if (isMock)
      form.setFieldsValue(
        value === "admin"
          ? { account: "admin", password: "admin123" }
          : { account: "13800138000", password: "demo1234" },
      );
  }
  return (
    <div className="login-page">
      <header className="public-header">
        <Brand />
      </header>
      <main className="login-main">
        <section className="login-card">
          <div className="login-card-brand">
            <Brand />
          </div>
          <Segmented
            block
            size="large"
            value={kind}
            onChange={changeKind}
            options={[
              { label: "客户入口", value: "customer" },
              { label: "管理员入口", value: "admin" },
            ]}
          />
          <div className="login-card-heading">
            <h2>{kind === "admin" ? "管理员登录" : "欢迎登录"}</h2>
            <p>
              {kind === "admin"
                ? "使用门户管理员账号登录管理平台"
                : "使用华测云客户中心账号，进入您的工作台"}
            </p>
          </div>
          <div className="login-form-area">
            {kind === "customer" && (
              <Tabs
                activeKey={method}
                onChange={(key) => setMethod(key as typeof method)}
                items={[
                  { key: "password", label: "账号密码登录" },
                  { key: "sms", label: "手机验证码登录" },
                ]}
              />
            )}
            <Form
              name="portalLogin"
              form={form}
              layout="vertical"
              size="large"
              initialValues={
                isMock ? { account: "13800138000", password: "demo1234" } : {}
              }
              onFinish={(values) =>
                run(async () => {
                  const session = await api.login({ ...values, kind, method });
                  await signIn(session);
                  history.replace(
                    kind === "admin" ? "/invitations" : "/workbench",
                  );
                })
              }
            >
              {kind === "admin" || method === "password" ? (
                <>
                  <Form.Item
                    name="account"
                    label={kind === "admin" ? "管理员账号" : "账号"}
                    rules={[{ required: true, message: "请输入账号" }]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="请输入账号 / 手机号"
                      autoComplete="username"
                    />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="密码"
                    rules={[{ required: true, message: "请输入密码" }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请输入密码"
                      autoComplete="current-password"
                    />
                  </Form.Item>
                </>
              ) : (
                <>
                  <Form.Item
                    name="phone"
                    label="手机号"
                    rules={[
                      { required: true, message: "请输入手机号" },
                      { pattern: /^1\d{10}$/, message: "请输入有效的手机号码" },
                    ]}
                  >
                    <Input
                      prefix={<MobileOutlined />}
                      placeholder="请输入受邀手机号"
                      maxLength={11}
                      autoComplete="tel"
                    />
                  </Form.Item>
                  <Form.Item label="验证码" required>
                    <Space.Compact block>
                      <Form.Item
                        name="code"
                        noStyle
                        rules={[{ required: true, message: "请输入验证码" }]}
                      >
                        <Input
                          placeholder="请输入6位验证码"
                          maxLength={6}
                          autoComplete="one-time-code"
                        />
                      </Form.Item>
                      <SmsButton phone={() => form.getFieldValue("phone")} />
                    </Space.Compact>
                  </Form.Item>
                </>
              )}
              <Button
                type="primary"
                block
                size="large"
                htmlType="submit"
                loading={pending}
                icon={<ArrowRightOutlined />}
                iconPosition="end"
              >
                {kind === "admin" ? "登录管理平台" : "登录"}
              </Button>
            </Form>
          </div>
          <div className="login-trust">
            <SafetyCertificateOutlined />
            {kind === "admin"
              ? "门户本地身份认证"
              : "由华测云客户中心提供身份认证"}
          </div>
        </section>
      </main>
      <footer className="login-footer">
        © {new Date().getFullYear()} 华测导航 · 监测统一门户
      </footer>
    </div>
  );
}
