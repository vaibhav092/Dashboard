import { Navigate } from 'react-router';
import { useIsLogin } from '@/context/isLogin.jsx';

const ProtectedRoute = ({ children }) => {
    const { isLogin } = useIsLogin();

    if (!isLogin) {
        return <Navigate to='/login' replace />;
    }

    return children;
};

export default ProtectedRoute;
