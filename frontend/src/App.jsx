import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import AddCustomer from './pages/AddCustomer';
import Vehicles from './pages/Vehicles';
import VehicleDetails from './pages/VehicleDetails';
import AddVehicle from './pages/AddVehicle';
import EditVehicle from './pages/EditVehicle';
import Inventory from './pages/Inventory';
import AddInventory from './pages/AddInventory';
import JobOrders from './pages/JobOrders';
import JobOrderDetails from './pages/JobOrderDetails';
import AddJobOrder from './pages/AddJobOrder';

function App() {
    const { fetchUser, isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated) {
            fetchUser();
        }
    }, [isAuthenticated, fetchUser]);

    return (
        <Router>
            <Routes>
                <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
                
                <Route element={<ProtectedRoute />}>
                    <Route element={<Layout />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/customers" element={<Customers />} />
                        <Route path="/customers/add" element={<AddCustomer />} />
                        <Route path="/vehicles" element={<Vehicles />} />
                        <Route path="/vehicles/:id" element={<VehicleDetails />} />
                        <Route path="/vehicles/:id/edit" element={<EditVehicle />} />
                        <Route path="/vehicles/add" element={<AddVehicle />} />
                        <Route path="/job-orders" element={<JobOrders />} />
                        <Route path="/job-orders/:id" element={<JobOrderDetails />} />
                        <Route path="/job-orders/add" element={<AddJobOrder />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/inventory/add" element={<AddInventory />} />
                    </Route>
                </Route>
                
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;
