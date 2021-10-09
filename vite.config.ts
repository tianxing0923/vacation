import path from 'path'
import reactRefresh from '@vitejs/plugin-react-refresh'
import { ConfigEnv, UserConfig } from 'vite'

const config = ({ command }: ConfigEnv) => {
  let options: UserConfig = {}
  // DEV
  if (command === 'serve') {
    options = {
      plugins: [reactRefresh()],
      resolve: {
        alias: {
          src: path.resolve(__dirname, 'src'),
        },
      },
      css: {
        preprocessorOptions: {
          less: {
            javascriptEnabled: true,
          },
        },
      },
      optimizeDeps: {
        include: ['antd/es/locale/zh_CN'],
      },
      esbuild: {
        jsxInject: `import React from 'react'`,
      },
      build: {
        outDir: 'build',
      },
    }
  }
  // PROD
  else {
    options = {
      base: './',
      plugins: [],
      resolve: {
        alias: {
          src: path.resolve(__dirname, 'src'),
        },
      },
      css: {
        preprocessorOptions: {
          less: {
            javascriptEnabled: true,
          },
        },
      },
      optimizeDeps: {
        include: ['antd/es/locale/zh_CN'],
      },
      esbuild: {
        jsxInject: `import React from 'react'`,
      },
      build: {
        outDir: 'build',
      },
    }
  }

  return options
}

export default config
