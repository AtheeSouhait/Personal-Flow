import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ProjectDetail from './pages/ProjectDetail'
import FocusMode from './pages/FocusMode'
import { PinnedTodosProvider } from './context/PinnedTodosContext'
import { CelebrationProvider } from './context/CelebrationContext'

function App() {
  return (
    <CelebrationProvider>
    <PinnedTodosProvider>
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/focus" element={<FocusMode />} />
      </Routes>
    </Layout>
    </PinnedTodosProvider>
    </CelebrationProvider>
  )
}

export default App
