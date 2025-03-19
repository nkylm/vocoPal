import React, { useState, useEffect } from 'react';
import TherapistSideBar from '../components/TherapistSideBar';
import TherapistTopNavBar from '../components/TherapistTopNavBar';
import ThresholdTable from '../components/ThresholdTable';
import { Select, Empty } from 'antd';
import axios from 'axios';

const { Option } = Select;

const TherapistSettings = () => {
  const [patients, setPatients] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientAccessLevel, setPatientAccessLevel] = useState('Can view');
  const token = localStorage.getItem('token');

  const fetchPatients = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/access/has-access-to', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allAccess = response.data.hasAccessTo || [];

      // Separate pending requests and accepted patients
      const pending = allAccess.filter((p) => p.status === 'pending');
      const accepted = allAccess.filter((p) => p.status === 'accepted');

      setPendingRequests(pending);
      setPatients(accepted);

      if (accepted.length > 0) {
        const firstPatient = accepted[0];
        setSelectedPatient(firstPatient.userId._id);
        setPatientAccessLevel(firstPatient.accessLevel || 'Can view');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  // Fetch list of patients the therapist has access to
  useEffect(() => {
    fetchPatients();
  }, [token]);

  const handlePatientChange = (patientId) => {
    setSelectedPatient(patientId);

    // Update access level for the selected patient
    const selectedPatientData = patients.find((p) => p.userId._id === patientId);
    if (selectedPatientData) {
      setPatientAccessLevel(selectedPatientData.accessLevel || 'Can view');
    }
  };

  const handleRespondToRequest = async (patientId, response) => {
    try {
      await axios.post(
        'http://localhost:8000/api/access/respond-to-request',
        { patientId, response },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh the patients list
      fetchPatients();
    } catch (error) {
      console.error('Error responding to request:', error);
    }
  };

  return (
    <div className="dashboard-layout">
      <TherapistSideBar
        patients={patients}
        pendingRequests={pendingRequests}
        selectedPatient={selectedPatient}
        onPatientSelect={handlePatientChange}
        onRespondToRequest={handleRespondToRequest}
      />
      <div className="right-content">
        <TherapistTopNavBar />
        <div className="content p-6">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>

          {selectedPatient ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Target Range Tolerance</h2>
              <ThresholdTable
                patientId={selectedPatient}
                readOnly={patientAccessLevel !== 'Can edit'}
              />
            </>
          ) : (
            <Empty description="Select a patient to manage their target range settings" />
          )}
        </div>
      </div>
    </div>
  );
};

export default TherapistSettings;
