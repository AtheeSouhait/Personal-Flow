import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ProjectDetail from './pages/ProjectDetail'
import { PinnedTodosProvider } from './context/PinnedTodosContext'

function App() {
  return (
    <PinnedTodosProvider>
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
      </Routes>
    </Layout>
    </PinnedTodosProvider>
  )
}

export default App
