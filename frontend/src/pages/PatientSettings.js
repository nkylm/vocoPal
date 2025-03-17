import React, { useState, useEffect } from 'react';
import SideBar from '../components/SideBar';
import TopNavBar from '../components/TopNavBar';
import './PatientDashboard.css';
import ThresholdTable from '../components/ThresholdTable';
import PermissionsTable from '../components/PermissionsTable';
import './PatientSettings.css';
import { Typography } from 'antd';
import axios from 'axios';

const { Text } = Typography;

const PatientSettings = () => {
  const [permissionsKey, setPermissionsKey] = useState(0); // Used to force re-render of PermissionsTable
  const [pendingRequests, setPendingRequests] = useState([]);
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  // Fetch pending requests
  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/access/shared-with', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const pending = response.data.sharedWith.filter(item => item.status === 'pending');
        setPendingRequests(pending);
      } catch (error) {
        console.error('Error fetching pending requests:', error);
      }
    };

    fetchPendingRequests();
  }, [token]);

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
            {pendingRequests.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Text type="secondary">
                  Pending requests ({pendingRequests.length}):
                  {pendingRequests.map(request => (
                    <span key={request.userId._id} style={{ marginLeft: '8px' }}>
                      {request.userId.email}
                    </span>
                  ))}
                </Text>
              </div>
            )}
            <PermissionsTable key={permissionsKey} />
          </div>

          <div className="settings-section">
            <h2 className="threshold-title">Target Range Tolerance</h2>
            <ThresholdTable patientId={userId} readOnly={false} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientSettings;
