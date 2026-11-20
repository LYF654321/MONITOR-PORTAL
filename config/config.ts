import { defineConfig } from '@umijs/max';

export default defineConfig({
  title: '监测统一门户',
  hash: true,
  favicons: ['/favicon.svg'],
  npmClient: 'npm',
  routes: [{ path: '/*', component: '@/pages/Portal' }],
  antd: false,
  layout: false,
  request: false,
  access: false,
  model: false,
  initialState: false,
  esbuildMinifyIIFE: true,
  define: {
    'process.env.UMI_APP_MOCK': process.env.UMI_APP_MOCK ?? 'true',
    'process.env.UMI_APP_API_BASE': process.env.UMI_APP_API_BASE ?? '/api',
  },
});
