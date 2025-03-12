import React, { useState, useEffect } from 'react';
import SideBar from '../components/SideBar';
import TopNavBar from '../components/TopNavBar';
import './PatientDashboard.css';
import DatePickerDropdown from '../components/DatePickerDropdown';
import Graph from '../components/Graph';
import dayjs from 'dayjs';
import axios from 'axios';
import { Card, Row, Col, Statistic, Tabs } from 'antd';
import RecordingsList from '../components/RecordingsList';

const PatientDashboard = () => {
  const [speechData, setSpeechData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [thresholds, setThresholds] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalRecordings: 0,
    avgVolume: 0,
    avgPitch: 0,
    avgSpeed: 0
  });
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

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

  // Fetch thresholds on component mount
  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/thresholds/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
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
        console.error('Error fetching thresholds:', error.message);
      }
    };

    fetchThresholds();
  }, [userId]);

  // Fetch speech data when date changes
  const handleDateChange = async (date, dateString) => {
    if (!dateString) return;

    const formattedStartDate = dayjs(dateString, 'MMMM Do, YYYY').format('YYYY-MM-DD');
    const formattedEndDate = dayjs(dateString, 'MMMM Do, YYYY').add(7, 'day').format('YYYY-MM-DD');

    const token = localStorage.getItem('token'); // Ensure token is retrieved

    console.log('handleDateChange token:', token);

    try {
      const response = await axios.get(`http://localhost:8000/api/speechData/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate: formattedStartDate, endDate: formattedEndDate }
      });

      setSpeechData(response.data);
      setSelectedDate(dateString);
    } catch (error) {
      console.error('Error fetching speech data:', error.message);
      setSpeechData([]);
    }
  };

  const items = [
    {
      key: 'graph',
      label: 'Graph',
      children: (
        <>
          <div className="mb-6">
            <DatePickerDropdown onDateChange={handleDateChange} />
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
        <Row gutter={[16, 16]}>
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
                    analytics.avgVolume === 0
                      ? 'gray'
                      : analytics.avgVolume > (thresholds?.volume_max || 0) ||
                          analytics.avgVolume < (thresholds?.volume_min || 0)
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
                    analytics.avgPitch === 0
                      ? 'gray'
                      : analytics.avgPitch > (thresholds?.pitch_max || 0) ||
                          analytics.avgPitch < (thresholds?.pitch_min || 0)
                        ? '#cf1322'
                        : '#3f8600'
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
                    analytics.avgSpeed === 0
                      ? 'gray'
                      : analytics.avgSpeed > (thresholds?.speed_max || 0) ||
                          analytics.avgPitch < (thresholds?.speed_min || 0)
                        ? '#cf1322'
                        : '#3f8600'
                }}
              />
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'recordings',
      label: 'Recordings',
      children: <RecordingsList userId={userId} />
    }
  ];

  return (
    <div className="dashboard-layout">
      <SideBar />
      <div className="right-content">
        <TopNavBar />
        <div className="content p-6">
          <Tabs defaultActiveKey="graph" items={items} size="large" type="card" />
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
