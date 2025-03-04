import PatientDashboard from './pages/PatientDashboard';
import TherapistDashboard from './pages/TherapistDashboard';
import PatientSettings from './pages/PatientSettings';
import TherapistSettings from './pages/TherapistSettings';
import Login from './pages/Login';
import ProtectedRoute from './util/ProtectedRoute';

const RoleBasedComponent = ({
  patientComponent: PatientComponent,
  therapistComponent: TherapistComponent
}) => {
  const role = localStorage.getItem('role');
  return role === 'therapist' ? <TherapistComponent /> : <PatientComponent />;
};

const routes = [
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <RoleBasedComponent
          patientComponent={PatientDashboard}
          therapistComponent={TherapistDashboard}
        />
      </ProtectedRoute>
    ),
    exact: true
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <RoleBasedComponent
          patientComponent={PatientSettings}
          therapistComponent={TherapistSettings}
        />
      </ProtectedRoute>
    ),
    exact: true
  }
];

export default routes;
