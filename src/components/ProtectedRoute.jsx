import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';
import { ShieldX } from 'lucide-react';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { loading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldX className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-white font-black text-3xl uppercase mb-2">Access Denied</h1>
          <p className="text-gray-400 text-sm mb-6">
            You do not have permission to access the admin panel.<br />
            Please log in with an admin account.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/login"
              className="px-6 py-2.5 bg-[#ff4700] text-white text-sm font-bold rounded-lg hover:bg-[#e03e00] transition-colors"
            >
              Login as Admin
            </Link>
            <Link
              to="/"
              className="px-6 py-2.5 border border-white/10 text-gray-400 text-sm font-bold rounded-lg hover:border-white/30 hover:text-white transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
