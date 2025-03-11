import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Select, Empty, Tabs } from 'antd';
import { SoundOutlined, RiseOutlined, ThunderboltOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import TherapistSideBar from '../components/TherapistSideBar';
import TherapistTopNavBar from '../components/TherapistTopNavBar';
import DatePickerDropdown from '../components/DatePickerDropdown';
import Graph from '../components/Graph';
import RecordingsList from '../components/RecordingsList';
import axios from 'axios';
import dayjs from 'dayjs';
import './TherapistDashboard.css';

const { Option } = Select;
const { Title, Text } = Typography;

const TherapistDashboard = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [speechData, setSpeechData] = useState([]);
  const [lastWeekSpeechData, setLastWeekSpeechData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [thresholds, setThresholds] = useState(null);
  const [hasRecordingsAccess, setHasRecordingsAccess] = useState(false);
  const [analytics, setAnalytics] = useState({
    volume: { inRange: 0, above: 0, below: 0, lastWeekInRange: 0 },
    pitch: { inRange: 0, above: 0, below: 0, lastWeekInRange: 0 },
    speed: { inRange: 0, above: 0, below: 0, lastWeekInRange: 0 }
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
    if (speechData.length > 0 && thresholds) {
      const volumeMetrics = speechData.reduce((acc, data) => {
        const volume = data.metrics.volume;
        if (volume > thresholds.volume_max) acc.above++;
        else if (volume < thresholds.volume_min) acc.below++;
        else acc.inRange++;
        return acc;
      }, { inRange: 0, above: 0, below: 0 });

      const pitchMetrics = speechData.reduce((acc, data) => {
        const pitch = data.metrics.pitch;
        if (pitch > thresholds.pitch_max) acc.above++;
        else if (pitch < thresholds.pitch_min) acc.below++;
        else acc.inRange++;
        return acc;
      }, { inRange: 0, above: 0, below: 0 });

      const speedMetrics = speechData.reduce((acc, data) => {
        const speed = data.metrics.speed;
        if (speed > thresholds.speed_max) acc.above++;
        else if (speed < thresholds.speed_min) acc.below++;
        else acc.inRange++;
        return acc;
      }, { inRange: 0, above: 0, below: 0 });

      // Calculate last week's in-range percentages
      const lastWeekVolumeInRange = lastWeekSpeechData.reduce((acc, data) => {
        return data.metrics.volume >= thresholds.volume_min && 
               data.metrics.volume <= thresholds.volume_max ? acc + 1 : acc;
      }, 0);

      const lastWeekPitchInRange = lastWeekSpeechData.reduce((acc, data) => {
        return data.metrics.pitch >= thresholds.pitch_min && 
               data.metrics.pitch <= thresholds.pitch_max ? acc + 1 : acc;
      }, 0);

      const lastWeekSpeedInRange = lastWeekSpeechData.reduce((acc, data) => {
        return data.metrics.speed >= thresholds.speed_min && 
               data.metrics.speed <= thresholds.speed_max ? acc + 1 : acc;
      }, 0);

      const total = speechData.length;
      const lastWeekTotal = lastWeekSpeechData.length;

      setAnalytics({
        volume: {
          inRange: Math.round((volumeMetrics.inRange / total) * 100) || 0,
          above: Math.round((volumeMetrics.above / total) * 100) || 0,
          below: Math.round((volumeMetrics.below / total) * 100) || 0,
          lastWeekInRange: lastWeekTotal ? Math.round((lastWeekVolumeInRange / lastWeekTotal) * 100) : 0
        },
        pitch: {
          inRange: Math.round((pitchMetrics.inRange / total) * 100) || 0,
          above: Math.round((pitchMetrics.above / total) * 100) || 0,
          below: Math.round((pitchMetrics.below / total) * 100) || 0,
          lastWeekInRange: lastWeekTotal ? Math.round((lastWeekPitchInRange / lastWeekTotal) * 100) : 0
        },
        speed: {
          inRange: Math.round((speedMetrics.inRange / total) * 100) || 0,
          above: Math.round((speedMetrics.above / total) * 100) || 0,
          below: Math.round((speedMetrics.below / total) * 100) || 0,
          lastWeekInRange: lastWeekTotal ? Math.round((lastWeekSpeedInRange / lastWeekTotal) * 100) : 0
        }
      });
    }
  }, [speechData, lastWeekSpeechData, thresholds]);

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

    // Get last week's date range
    const lastWeekStartDate = dayjs(dateString, 'MMMM Do, YYYY').subtract(7, 'day').format('YYYY-MM-DD');
    const lastWeekEndDate = dayjs(dateString, 'MMMM Do, YYYY').format('YYYY-MM-DD');

    let currentWeekData = [];
    let lastWeekData = [];

    try {
      // Fetch current week's data
      const response = await axios.get(`http://localhost:8000/api/speechData/${selectedPatient}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate: formattedStartDate, endDate: formattedEndDate }
      });
      currentWeekData = response.data;
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching current week data:', error.message);
      }
    }

    try {
      // Fetch last week's data
      const lastWeekResponse = await axios.get(`http://localhost:8000/api/speechData/${selectedPatient}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate: lastWeekStartDate, endDate: lastWeekEndDate }
      });
      lastWeekData = lastWeekResponse.data;
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching last week data:', error.message);
      }
      // If no data found for last week, that's okay - just use empty array
      lastWeekData = [];
    }

    // Update states regardless of API call success
    setSpeechData(currentWeekData);
    setLastWeekSpeechData(lastWeekData);
    setSelectedDate(dateString);
  };

  const handlePatientChange = (patientId) => {
    setSelectedPatient(patientId);
    setSpeechData([]); // Clear previous patient's data
    setLastWeekSpeechData([]); // Clear previous patient's last week data
    setSelectedDate(null);

    // Update recordings access status for the selected patient
    const selectedPatientData = patients.find((p) => p.userId._id === patientId);
    if (selectedPatientData) {
      setHasRecordingsAccess(selectedPatientData.recordings || false);
    } else {
      setHasRecordingsAccess(false);
    }
  };

  const renderMetricCard = (title, icon, data, range) => {
    const getTitleBoxColor = (title) => {
      switch (title) {
        case 'Volume':
          return '#e6f4ff';
        case 'Pitch':
          return '#fff7e6';
        case 'Speed':
          return '#f9f0ff';
        default:
          return '#f5f5f5';
      }
    };

    return (
      <Card className="metric-card" bodyStyle={{ padding: '12px' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          backgroundColor: getTitleBoxColor(title),
          padding: '4px 12px',
          borderRadius: '6px',
          marginBottom: '12px'
        }}>
          {React.cloneElement(icon, { style: { fontSize: '16px', marginRight: '8px', color: '#000000' } })}
          <Text strong>{title}</Text>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ 
            backgroundColor: '#f0f9f0', 
            borderRadius: '8px', 
            padding: '12px', 
            flex: '1.5',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <Title level={2} style={{ margin: '0', fontSize: '36px', textAlign: 'center' }}>{data.inRange}%</Title>
            <Text style={{ textAlign: 'center' }}>In target range</Text>
            <Text type="secondary" style={{ textAlign: 'center' }}>{range}</Text>
            <div style={{ marginTop: 'auto', textAlign: 'center' }}>
              <Text type="secondary">Last week: </Text>
              <span style={{ 
                backgroundColor: data.inRange - data.lastWeekInRange > 0 ? '#ffeded' : '#fff1f0',
                padding: '2px 8px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {data.inRange - data.lastWeekInRange > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {Math.abs(data.inRange - data.lastWeekInRange)}%
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1' }}>
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '12px', 
              borderRadius: '8px', 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <Title level={3} style={{ margin: '0' }}>{data.above}%</Title>
              <Text type="secondary">
                {title === 'Volume' ? 'Loud' : title === 'Pitch' ? 'High' : 'Fast'} <ArrowUpOutlined />
              </Text>
            </div>
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '12px', 
              borderRadius: '8px', 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <Title level={3} style={{ margin: '0' }}>{data.below}%</Title>
              <Text type="secondary">
                {title === 'Volume' ? 'Quiet' : title === 'Pitch' ? 'Low' : 'Slow'} <ArrowDownOutlined />
              </Text>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const getTabItems = () => {
    const baseItems = [
      {
        key: 'graph',
        label: 'Graph',
        children: (
          <>
            <div className="mb-6">
              <DatePickerDropdown onDateChange={handleDateChange} value={selectedDate} />
            </div>
            <Card>
              {thresholds ? (
                <Graph speechData={speechData} selectedDate={selectedDate} />
              ) : (
                <p>Loading thresholds...</p>
              )}
            </Card>
          </>
        )
      },
      {
        key: 'analytics',
        label: 'Analytics',
        children: (
          <>
            <div className="mb-6">
              <DatePickerDropdown onDateChange={handleDateChange} value={selectedDate} />
            </div>
            <Title level={4}>Level</Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                {renderMetricCard(
                  'Volume',
                  <SoundOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
                  analytics.volume,
                  `${thresholds?.volume_min}-${thresholds?.volume_max} dB`
                )}
              </Col>
              <Col xs={24} md={8}>
                {renderMetricCard(
                  'Pitch',
                  <RiseOutlined style={{ fontSize: '24px', color: '#faad14' }} />,
                  analytics.pitch,
                  `${thresholds?.pitch_min}-${thresholds?.pitch_max} Hz`
                )}
              </Col>
              <Col xs={24} md={8}>
                {renderMetricCard(
                  'Speed',
                  <ThunderboltOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
                  analytics.speed,
                  `${thresholds?.speed_min}-${thresholds?.speed_max} syll/sec`
                )}
              </Col>
            </Row>
          </>
        )
      }
    ];

    // Add either Recordings or Flags tab based on access
    const thirdTab = hasRecordingsAccess
      ? {
          key: 'recordings',
          label: 'Recordings',
          children: (
            <>
              <div className="mb-6">
                <DatePickerDropdown onDateChange={handleDateChange} value={selectedDate} />
              </div>
              {selectedPatient && <RecordingsList userId={selectedPatient} selectedDate={selectedDate} />}
            </>
          )
        }
      : {
          key: 'flags',
          label: 'Flags',
          children: <Card>Flagged recordings will appear here</Card>
        };

    return [...baseItems, thirdTab];
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
          </div>

          {selectedPatient ? (
            <Tabs 
              defaultActiveKey="graph" 
              items={getTabItems()}
              size="large"
              type="card"
            />
          ) : (
            <Empty description="Select a patient to view their data" />
          )}
        </div>
      </div>
    </div>
  );
};

export default TherapistDashboard;
