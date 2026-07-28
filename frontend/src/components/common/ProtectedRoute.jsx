import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified, check if user has permission
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to their respective dashboard if they try to access unauthorized routes
    return <Navigate to={`/${role}`} replace />;
  }

  // If role is still loading but user exists, we render children (or a spinner)
  // But our AuthContext only renders children after loading is false.
  
  return children;
};

export default ProtectedRoute;
