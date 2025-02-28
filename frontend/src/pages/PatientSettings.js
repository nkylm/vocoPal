import React, { useState } from 'react';
import SideBar from '../components/SideBar';
import TopNavBar from '../components/TopNavBar';
import './PatientDashboard.css';
import ThresholdTable from '../components/ThresholdTable';
import PermissionsTable from '../components/PermissionsTable';
import './PatientSettings.css';

const PatientSettings = () => {
  const [permissionsKey, setPermissionsKey] = useState(0); // Used to force re-render of PermissionsTable

  const handleShareSuccess = () => {
    // Force re-render of PermissionsTable to show updated data
    setPermissionsKey((prevKey) => prevKey + 1);
  };

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <SideBar />
      </div>
      <div className="right-content">
        <TopNavBar onShareSuccess={handleShareSuccess} />
        <div className="content settings-content">
          <div className="settings-header">
            <h1>Settings</h1>
          </div>

          <div className="settings-section">
            <h2 className="threshold-title">Permissions</h2>
            <PermissionsTable key={permissionsKey} />
          </div>

          <div className="settings-section">
            <h2 className="threshold-title">Target Range Tolerance</h2>
            <ThresholdTable />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientSettings;
