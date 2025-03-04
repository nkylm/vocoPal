import { Routes, Route } from 'react-router-dom';
import routes from './routes';
import AuthProvider from './util/AuthContext';

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {routes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
      </Routes>
    </AuthProvider>
  );
};
export default App;
