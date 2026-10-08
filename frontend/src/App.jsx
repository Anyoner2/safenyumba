import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Footer from './components/Footer.jsx'
import Navbar from './components/Navbar.jsx'
import Estates from './pages/Estates.jsx'
import EstateDashboard from './pages/EstateDashboard.jsx'
import Home from './pages/Home.jsx'
import Houses from './pages/Houses.jsx'
import LandlordDashboard from './pages/LandlordDashboard.jsx'
import Login from './pages/Login.jsx'
import ListProperty from './pages/ListProperty.jsx'
import Register from './pages/Register.jsx'
import RentPayments from './pages/RentPayments.jsx'
import { AuthProvider } from './auth.jsx'
import './App.css'

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Navbar />
        <main className="page-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/houses" element={<Houses />} />
            <Route path="/estates" element={<Estates />} />
            <Route path="/dashboard" element={<LandlordDashboard />} />
            <Route path="/estate-dashboard" element={<EstateDashboard />} />
            <Route path="/list-property" element={<ListProperty />} />
            <Route path="/rent-payments" element={<RentPayments />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </AuthProvider>
    </HashRouter>
  )
}

export default App
