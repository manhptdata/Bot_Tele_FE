import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useGetMeQuery } from '../../api/userApi';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user: authUser } = useSelector((state: RootState) => state.auth);
  const { data: meData } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const currentUser = meData || authUser;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/orders" replace />;
  }

  return <Outlet />;
};
