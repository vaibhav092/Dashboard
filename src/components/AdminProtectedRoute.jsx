// components/AdminProtectedRoute.jsx
import { Navigate } from 'react-router';
import { useIsLogin } from '@/context/isLogin';
import { useRole } from '@/context/Role';

const AdminProtectedRoute = ({ children }) => {
    const { isLogin } = useIsLogin();
    const { role } = useRole();

    if (!isLogin) {
        return <Navigate to='/login' replace />;
    }

    if (role !== 'admin') {
        return <Navigate to='/' replace />;
    }

    return children;
};

export default AdminProtectedRoute;
