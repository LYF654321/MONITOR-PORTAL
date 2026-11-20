import { useEffect, useState } from 'react';
import { history } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Descriptions,
  Form,
  Input,
  Result,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Brand, CopyText, DataTable, SystemTag } from '@/components';
import { SmsButton } from '@/components/SmsButton';
import { useAction, usePortal } from '@/hooks/usePortal';
import { api } from '@/services';
import type { InviteSystem, PublicInvitation } from '@/types';
export default function InvitationLanding({ id }: { id: string }) {
  const [data, setData] = useState<PublicInvitation>();
  const [error, setError] = useState('');
  const [step, setStep] = useState<'review' | 'auth' | 'success'>('review');
  const [loading, setLoading] = useState(true);
  const { run, pending } = useAction();
  const { signIn } = usePortal();
  const { modal, message } = App.useApp();
  const [form] = Form.useForm();
  useEffect(() => {
    let alive = true;
    api
      .invitation(id)
      .then((result) => {
        if (alive) {
          setData(result);
          if (['已接受', '部分开通'].includes(result.invite.status)) setStep('auth');
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);
  const invitation = data?.invite;
  return (
    <div className="public-page">
      <header className="public-header">
        <Brand />
        <Button onClick={() => history.push('/login')}>返回登录</Button>
      </header>
      <main className="public-main">
        <section className="invitation-card">
          {loading ? (
            <div className="public-loading">
              <Spin size="large" />
            </div>
          ) : error ? (
            <Result status="404" title="邀请链接不可用" subTitle={error} />
          ) : (
            invitation &&
            (step === 'success' ? (
              <Result
                status={invitation.status === '已完成' ? 'success' : 'warning'}
                title={invitation.status === '已完成' ? '门户开通成功' : '身份认证完成'}
                subTitle={
                  invitation.status === '已完成'
                    ? '已成功接受邀请并完成门户开通，请通过电脑浏览器进入监测统一门户。'
                    : '部分业务系统尚未开通，请联系邀请人处理。'
                }
                extra={
                  <>
                    <Typography.Paragraph copyable>{window.location.origin}</Typography.Paragraph>
                    <Button onClick={() => history.push('/login')}>返回门户登录</Button>
                  </>
                }
              />
            ) : ['已拒绝', '已完成'].includes(invitation.status) ? (
              <Result
                status={invitation.status === '已完成' ? 'success' : 'info'}
                title={invitation.status === '已完成' ? '该邀请已完成' : '已拒绝邀请'}
                subTitle={
                  invitation.status === '已完成'
                    ? '您的门户账号已开通，可前往门户登录。'
                    : '本次邀请已结束。如需开通，请联系邀请人重新发起邀请。'
                }
                extra={
                  <Button type="primary" onClick={() => history.push('/login')}>
                    前往登录
                  </Button>
                }
              />
            ) : (
              <>
                <div className="invitation-heading">
                  <span className="detail-icon">
                    <MailOutlined />
                  </span>
                  <Tag bordered={false} color="orange">
                    门户开通邀请
                  </Tag>
                  <h1>
                    {step === 'review'
                      ? '您收到一份邀请'
                      : invitation.cid
                        ? '验证身份，完成开通'
                        : '注册账号，完成开通'}
                  </h1>
                  <p>
                    {step === 'review'
                      ? `${invitation.inviter} 邀请您加入 ${invitation.customerName}`
                      : invitation.cid
                        ? '使用受邀手机号完成客户中心身份认证'
                        : '您的手机号尚未注册客户中心，请填写账号信息'}
                  </p>
                </div>
                <div className="invitation-person">
                  <div>
                    <span>受邀手机号</span>
                    <strong>{invitation.phone}</strong>
                  </div>
                  <div>
                    <span>受邀邮箱</span>
                    <strong>{invitation.email}</strong>
                  </div>
                </div>
                {step === 'review' ? (
                  <>
                    <Descriptions
                      column={1}
                      size="small"
                      items={[
                        { key: 'customer', label: '所属客户', children: invitation.customerName },
                        {
                          key: 'key',
                          label: '客户 Key',
                          children: <CopyText value={invitation.customerKey} mono />,
                        },
                      ]}
                    />
                    <h3 className="public-section-title">本次开通的业务系统</h3>
                    <DataTable<InviteSystem>
                      rowKey="code"
                      pagination={false}
                      dataSource={invitation.systems}
                      columns={[
                        {
                          title: '业务系统',
                          dataIndex: 'code',
                          render: (code) => <SystemTag code={code} />,
                        },
                        { title: '业务空间', dataIndex: 'org' },
                        { title: '角色', dataIndex: 'role' },
                      ]}
                    />
                    <Alert
                      type="info"
                      showIcon
                      message={
                        invitation.newCustomer
                          ? '接受邀请后，您将成为该客户的管理员。'
                          : '请核对业务系统、空间和角色，如信息不符请联系邀请人。'
                      }
                      style={{ marginTop: 20 }}
                    />
                    <div className="invitation-actions">
                      <Button
                        size="large"
                        onClick={() =>
                          modal.confirm({
                            title: '确认拒绝邀请？',
                            content:
                              '拒绝后，本次业务系统授权不会生效。如需开通，请联系邀请人重新邀请。',
                            okText: '确认拒绝',
                            cancelText: '取消',
                            onOk: async () => {
                              const result = await api.rejectInvite(id);
                              setData({ ...data!, invite: result });
                            },
                          })
                        }
                      >
                        拒绝邀请
                      </Button>
                      <Button
                        size="large"
                        type="primary"
                        loading={pending}
                        icon={<ArrowRightOutlined />}
                        iconPosition="end"
                        onClick={() =>
                          run(async () => {
                            const result = await api.acceptInvite(id);
                            setData({ ...data!, invite: result });
                            setStep('auth');
                          })
                        }
                      >
                        接受邀请
                      </Button>
                    </div>
                  </>
                ) : (
                  <Form
                    name="inviteAccept"
                    form={form}
                    layout="vertical"
                    size="large"
                    onFinish={(values) =>
                      run(async () => {
                        const result = await api.completeInvite(id, values);
                        setData({ ...data!, invite: result.invite });
                        if (window.matchMedia('(max-width: 780px)').matches) {
                          setStep('success');
                        } else {
                          await signIn(result.session);
                          if (result.invite.status !== '已完成')
                            message.warning('部分业务系统开通失败，请联系邀请人');
                          else message.success('门户开通成功');
                          history.replace('/workbench');
                        }
                      })
                    }
                  >
                    {!invitation.cid && (
                      <>
                        <Form.Item
                          name="account"
                          label="用户名"
                          rules={[
                            { required: true, message: '请输入用户名' },
                            {
                              pattern: /^[a-zA-Z][a-zA-Z0-9_]{2,29}$/,
                              message: '3至30位字母、数字或下划线，以字母开头',
                            },
                          ]}
                        >
                          <Input autoComplete="username" placeholder="请设置用户名" />
                        </Form.Item>
                        <Form.Item
                          name="password"
                          label="密码"
                          rules={[
                            { required: true, message: '请输入密码' },
                            { min: 8, message: '密码至少8位' },
                            {
                              pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
                              message: '密码需包含字母和数字',
                            },
                          ]}
                        >
                          <Input.Password
                            autoComplete="new-password"
                            placeholder="至少8位，包含字母和数字"
                          />
                        </Form.Item>
                        <Form.Item
                          name="confirmPassword"
                          label="确认密码"
                          dependencies={['password']}
                          rules={[
                            { required: true, message: '请再次输入密码' },
                            ({ getFieldValue }) => ({
                              validator: (_, value) =>
                                !value || getFieldValue('password') === value
                                  ? Promise.resolve()
                                  : Promise.reject(new Error('两次输入的密码不一致')),
                            }),
                          ]}
                        >
                          <Input.Password
                            autoComplete="new-password"
                            placeholder="请再次输入密码"
                          />
                        </Form.Item>
                      </>
                    )}
                    <Form.Item label="手机验证码" required>
                      <Space.Compact block>
                        <Form.Item
                          name="code"
                          noStyle
                          rules={[
                            { required: true, message: '请输入验证码' },
                            { len: 6, message: '请输入6位验证码' },
                          ]}
                        >
                          <Input
                            maxLength={6}
                            placeholder="请输入验证码"
                            autoComplete="one-time-code"
                          />
                        </Form.Item>
                        <SmsButton phone={() => invitation.phone} />
                      </Space.Compact>
                    </Form.Item>
                    <Button
                      size="large"
                      type="primary"
                      block
                      htmlType="submit"
                      loading={pending}
                      icon={<CheckCircleOutlined />}
                    >
                      {invitation.cid ? '登录并开通门户' : '注册并开通门户'}
                    </Button>
                    <Button
                      block
                      type="text"
                      onClick={() => setStep('review')}
                      style={{ marginTop: 12 }}
                    >
                      返回邀请信息
                    </Button>
                  </Form>
                )}
                <div className="public-trust">
                  <SafetyCertificateOutlined /> 由华测云客户中心提供安全身份认证
                </div>
              </>
            ))
          )}
        </section>
      </main>
      <footer className="login-footer">© {new Date().getFullYear()} 华测导航 · 监测统一门户</footer>
    </div>
  );
}
