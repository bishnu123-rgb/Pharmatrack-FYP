import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import Medicines from "./pages/Medicines";
import Batches from "./pages/Batches";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import Alerts from "./pages/Alerts";
import Profile from "./pages/Profile";
import UserManagement from "./pages/UserManagement";
import Suppliers from "./pages/Suppliers";
import StockRequests from "./pages/StockRequests";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import StoreLanding from "./pages/store/StoreLanding";
import MedicineDetail from "./pages/store/MedicineDetail";
import Home from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";

import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />


        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <Layout>
                <Categories />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/medicines"
          element={
            <ProtectedRoute>
              <Layout>
                <Medicines />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/batches"
          element={
            <ProtectedRoute>
              <Layout>
                <Batches />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <Layout>
                <Sales />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/purchases"
          element={
            <ProtectedRoute>
              <Layout>
                <Purchases />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <Layout>
                <Alerts />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Layout>
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/suppliers"
          element={
            <ProtectedRoute>
              <Layout>
                <Suppliers />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/stock-requests"
          element={
            <ProtectedRoute>
              <Layout>
                <StockRequests />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Public Customer Store Routes (No Login Required) */}
        <Route path="/store" element={<StoreLanding />} />
        <Route path="/store/medicine/:id" element={<MedicineDetail />} />

        {/* Default route */}
        <Route path="/" element={<Home />} />

        {/* Unauthorized access */}
        <Route path="/unauthorized" element={
          <div className="min-h-screen bg-white flex items-center justify-center font-sans">
            <div className="text-center space-y-4 max-w-md px-8">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-500 text-3xl font-black border border-rose-100">✕</div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Access Denied</h1>
              <p className="text-slate-500 font-bold">You do not have permission to access this page. Please contact your system administrator.</p>
              <a href="/dashboard" className="inline-block mt-4 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-200">Back to Dashboard</a>
            </div>
          </div>
        } />

        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-screen bg-white flex items-center justify-center font-sans">
            <div className="text-center space-y-4 max-w-md px-8">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400 text-3xl font-black border border-slate-100">?</div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Page Not Found</h1>
              <p className="text-slate-500 font-bold">The page you are looking for does not exist.</p>
              <a href="/dashboard" className="inline-block mt-4 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-200">Back to Dashboard</a>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
