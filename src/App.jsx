import { BrowserRouter, Route, Routes } from 'react-router';
import Home from './Pages/Home';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './Layout';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AddEmployee from '@/components/AddExployee';
import EmployeesList from '@/components/ExployeeList';
import AddClient from './components/AddClient';
import ClientsList from './components/ClientList';

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
                            <Route path='add' element={<AddEmployee />} />
                            <Route index element={<EmployeesList />} />
                        </Route>
                        <Route path='client'>
                            <Route path='add' element={<AddClient />} />
                            <Route index element={<ClientsList />} />
                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
