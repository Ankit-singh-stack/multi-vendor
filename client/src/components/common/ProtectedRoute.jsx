import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { ROLE_DASHBOARD } from '../../utils/constants';
import Loader from './Loader';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader fullPage label="Checking your session..." />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && roles.length && !roles.includes(user.role)) {
    return <Navigate to={ROLE_DASHBOARD[user.role] || '/'} replace />;
  }

  return children;
};

export default ProtectedRoute;
