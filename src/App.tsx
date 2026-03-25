import { Route, Routes } from 'react-router-dom'
import AdsList from './pages/AdsList'
import AdView from './pages/AdView'
import AdEdit from './pages/AdEdit'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/ads" element={<AdsList />} />
      <Route path="/ads/:id" element={<AdView />} />
      <Route path="/ads/:id/edit" element={<AdEdit />} />
    </Routes>
  )
}

export default App
