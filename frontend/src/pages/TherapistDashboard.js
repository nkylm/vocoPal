import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Select, Empty } from 'antd';
import TherapistSideBar from '../components/TherapistSideBar';
import TherapistTopNavBar from '../components/TherapistTopNavBar';
import DatePickerDropdown from '../components/DatePickerDropdown';
import Graph from '../components/Graph';
import RecordingsList from '../components/RecordingsList';
import axios from 'axios';
import dayjs from 'dayjs';
import './TherapistDashboard.css';

const { Option } = Select;

const TherapistDashboard = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [speechData, setSpeechData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [thresholds, setThresholds] = useState(null);
  const [hasRecordingsAccess, setHasRecordingsAccess] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalRecordings: 0,
    avgVolume: 0,
    avgPitch: 0,
    avgSpeed: 0
  });

  const token = localStorage.getItem('token');

  // Fetch list of patients the therapist has access to
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/access/has-access-to', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const patientsWithAccess = response.data.hasAccessTo.filter(
          (p) => p.analytics || p.recordings
        );

        setPatients(patientsWithAccess);

        console.log('patientsWithAccess', patientsWithAccess);
        if (patientsWithAccess.length > 0) {
          const firstPatient = patientsWithAccess[0];
          setSelectedPatient(firstPatient.userId._id);
          setHasRecordingsAccess(firstPatient.recordings || false);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };

    fetchPatients();
  }, [token]);

  // Calculate analytics from speech data
  useEffect(() => {
    if (speechData.length > 0) {
      const totalRecordings = speechData.length;
      const avgVolume =
        speechData.reduce((sum, data) => sum + data.metrics.volume, 0) / totalRecordings;
      const avgPitch =
        speechData.reduce((sum, data) => sum + data.metrics.pitch, 0) / totalRecordings;
      const avgSpeed =
        speechData.reduce((sum, data) => sum + data.metrics.speed, 0) / totalRecordings;

      setAnalytics({
        totalRecordings,
        avgVolume: avgVolume.toFixed(1),
        avgPitch: avgPitch.toFixed(1),
        avgSpeed: avgSpeed.toFixed(1)
      });
    }
  }, [speechData]);

  // Fetch patient's thresholds
  useEffect(() => {
    const fetchThresholds = async () => {
      if (!selectedPatient) return;

      try {
        const response = await axios.get(
          `http://localhost:8000/api/thresholds/${selectedPatient}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data && response.data.length) {
          const [threshold] = response.data;
          setThresholds({
            volume_min: threshold.volume_min,
            volume_max: threshold.volume_max,
            pitch_min: threshold.pitch_min,
            pitch_max: threshold.pitch_max,
            speed_min: threshold.speed_min,
            speed_max: threshold.speed_max
          });
        }
      } catch (error) {
        console.error('Error fetching thresholds:', error);
      }
    };

    fetchThresholds();
  }, [selectedPatient, token]);

  // Fetch speech data when date or patient changes
  const handleDateChange = async (date, dateString) => {
    if (!dateString || !selectedPatient) return;

    const formattedStartDate = dayjs(dateString, 'MMMM Do, YYYY').format('YYYY-MM-DD');
    const formattedEndDate = dayjs(dateString, 'MMMM Do, YYYY').add(7, 'day').format('YYYY-MM-DD');

    try {
      const response = await axios.get(`http://localhost:8000/api/speechData/${selectedPatient}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate: formattedStartDate, endDate: formattedEndDate }
      });

      setSpeechData(response.data);
      setSelectedDate(dateString);
    } catch (error) {
      console.error('Error fetching speech data:', error);
      setSpeechData([]);
    }
  };

  const handlePatientChange = (patientId) => {
    setSelectedPatient(patientId);
    setSpeechData([]); // Clear previous patient's data
    setSelectedDate(null);

    // Update recordings access status for the selected patient
    const selectedPatientData = patients.find((p) => p.userId._id === patientId);
    if (selectedPatientData) {
      setHasRecordingsAccess(selectedPatientData.recordings || false);
    } else {
      setHasRecordingsAccess(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <TherapistSideBar
        patients={patients}
        selectedPatient={selectedPatient}
        onPatientSelect={handlePatientChange}
      />
      <div className="right-content">
        <TherapistTopNavBar />
        <div className="content p-6">
          <div className="flex justify-between items-center mb-6">
            <Select
              value={selectedPatient}
              onChange={handlePatientChange}
              className="w-64"
              placeholder="Select patient"
            >
              {patients.map((patient) => (
                <Option key={patient.userId._id} value={patient.userId._id}>
                  {patient.userId.name}
                </Option>
              ))}
            </Select>
            <DatePickerDropdown onDateChange={handleDateChange} />
          </div>

          {selectedPatient ? (
            <>
              <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Total Recordings"
                      value={analytics.totalRecordings}
                      prefix={<i className="fas fa-microphone" />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Average Volume"
                      value={analytics.avgVolume}
                      suffix="dB"
                      precision={1}
                      valueStyle={{
                        color:
                          analytics.avgVolume > (thresholds?.volume_max || 0)
                            ? '#cf1322'
                            : '#3f8600'
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Average Pitch"
                      value={analytics.avgPitch}
                      suffix="Hz"
                      precision={1}
                      valueStyle={{
                        color:
                          analytics.avgPitch > (thresholds?.pitch_max || 0) ? '#cf1322' : '#3f8600'
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card>
                    <Statistic
                      title="Average Speed"
                      value={analytics.avgSpeed}
                      suffix="Syll/Sec"
                      precision={1}
                      valueStyle={{
                        color:
                          analytics.avgSpeed > (thresholds?.speed_max || 0) ? '#cf1322' : '#3f8600'
                      }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Conditionally render RecordingsList based on permissions */}
              {hasRecordingsAccess && selectedPatient && (
                <Card className="mb-6">
                  <RecordingsList userId={selectedPatient} />
                </Card>
              )}

              <Card className="mb-6">
                {thresholds ? (
                  <Graph
                    speechData={speechData}
                    selectedDate={selectedDate}
                    thresholds={thresholds}
                  />
                ) : (
                  <p>Loading thresholds...</p>
                )}
              </Card>
            </>
          ) : (
            <Empty description="Select a patient to view their data" />
          )}
        </div>
      </div>
    </div>
  );
};

export default TherapistDashboard;
