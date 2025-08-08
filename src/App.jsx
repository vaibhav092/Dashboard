import { BrowserRouter, Route, Routes } from 'react-router';
import Home from './Pages/Home';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './Layout';
import { Toaster } from 'sonner';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import EmployeesList from '@/components/ExployeeList';
import ClientsList from './components/ClientList';
import EmployeeProfile from './components/EmployeeProfile';
import OffliceLogin from './components/OffliceLogin';
import Report from './components/Report';
import ViewProfile from './components/ViewProfile';

function App() {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path='/login' element={<Login />} />

                    <Route
                        path='/'
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Home />} />
                        <Route path='profile' element={<EmployeeProfile />} />
                        <Route path='work' element={<OffliceLogin />} />
                        <Route path='report' element={<Report />} />
                    </Route>

                    <Route
                        path='/admin'
                        element={
                            <AdminProtectedRoute>
                                <Layout />
                            </AdminProtectedRoute>
                        }
                    >
                        <Route path='employee'>
                            <Route path=':id' element={<ViewProfile />} />
                            <Route index element={<EmployeesList />} />
                        </Route>
                        <Route path='client'>
                            <Route index element={<ClientsList />} />
                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
            <Toaster />
        </>
    );
}

export default App;
