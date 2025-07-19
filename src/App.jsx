import { BrowserRouter, Route, Routes } from 'react-router';
import Home from './Pages/Home';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './Layout';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AddEmployee from '@/components/AddExployee';
import EmployeesList from '@/components/ExployeeList';

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
                        <Route element={<Home />} />
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
                    </Route>
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
