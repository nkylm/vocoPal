import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

const routes = [
    { path: '/', element: <Dashboard />, exact: true },
    { path: '/settings', element: <Settings />, exact: true },
];

export default routes;
