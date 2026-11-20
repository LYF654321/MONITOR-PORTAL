import { useEffect, useState } from 'react';
import { Button, App } from 'antd';
import { api } from '@/services';
import { useAction } from '@/hooks/usePortal';
export function SmsButton({ phone }: { phone: () => string }) {
  const [seconds, setSeconds] = useState(0);
  const { run, pending } = useAction();
  const { message } = App.useApp();
  useEffect(() => {
    if (!seconds) return;
    const timer = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);
  return (
    <Button
      loading={pending}
      disabled={seconds > 0}
      onClick={() =>
        run(async () => {
          const result = await api.code(phone());
          setSeconds(result.retryAfter);
          message.success(
            result.demoCode ? `模拟验证码已生成：${result.demoCode}` : '验证码已发送',
          );
        })
      }
    >
      {seconds > 0 ? `${seconds}s 后重新获取` : '获取验证码'}
    </Button>
  );
}
