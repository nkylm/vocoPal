import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!role) {
    // Handle case where role is missing
    localStorage.clear(); // Clear potentially corrupt data
    return <Navigate to="/login" replace />;
  }

  if (!['patient', 'therapist'].includes(role)) {
    // Handle invalid role
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
