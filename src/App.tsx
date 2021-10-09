import { FC, lazy, Suspense } from 'react'
import { Switch, Route, BrowserRouter } from 'react-router-dom'
import { ConfigProvider, Spin } from 'antd'
import zhCN from 'antd/es/locale/zh_CN'
import './App.less'

const App: FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Suspense fallback={<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Spin size="large" /></div>}>
          <Switch>
            <Route path="/" component={lazy(() => import('src/views/Home'))} />
          </Switch>
        </Suspense>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
