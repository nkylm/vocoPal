import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Settings from './pages/Settings';
import ProtectedRoute from './util/ProtectedRoute';

const routes = [
    { path: '/login', element: <Login />},
    { path: '/', element: <ProtectedRoute><Dashboard /></ProtectedRoute>, exact: true },
    { path: '/settings', element: <ProtectedRoute><Settings /></ProtectedRoute>, exact: true },
];

export default routes;
