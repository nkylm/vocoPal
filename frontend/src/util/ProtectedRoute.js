import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../util/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem('token'); // Ensure persistence

  return user || token ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
