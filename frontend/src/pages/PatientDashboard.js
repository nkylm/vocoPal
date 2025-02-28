import React, { useState, useEffect } from 'react';
import SideBar from '../components/SideBar';
import TopNavBar from '../components/TopNavBar';
import './PatientDashboard.css';
import DatePickerDropdown from '../components/DatePickerDropdown';
import Graph from '../components/Graph';
import dayjs from 'dayjs';
import axios from 'axios';
import { Card, Row, Col, Statistic } from 'antd';
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
      console.log('speechData: ', speechData);
      const avgVolume =
        speechData.reduce((sum, data) => sum + data.metrics.volume, 0) / totalRecordings;
      const avgPitch =
        speechData.reduce((sum, data) => sum + data.metrics.pitch, 0) / totalRecordings;
      const avgSpeed =
        speechData.reduce((sum, data) => sum + data.metrics.speed, 0) / totalRecordings;

      console.log('avgVolume: ', avgVolume);
      console.log('avgPitch: ', avgPitch);
      console.log('avgSpeed: ', avgSpeed);

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
        console.log('token: ', token);
        console.log('userId: ', userId);
        const response = await axios.get(`http://localhost:8000/api/thresholds/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data && response.data.length) {
          const [threshold] = response.data; // Assuming one set of thresholds per user
          console.log('Thresholds: ', threshold);
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

      console.log('SpeechData response:', response);
      setSpeechData(response.data);
      setSelectedDate(dateString);
    } catch (error) {
      console.error('Error fetching speech data:', error.message);
      setSpeechData([]);
    }
  };

  return (
    <div className="dashboard-layout">
      <SideBar />
      <div className="right-content">
        <TopNavBar />
        <div className="content p-6">
          <div className="mb-6">
            <DatePickerDropdown onDateChange={handleDateChange} />
          </div>
          {/* Analytics Cards */}
          <h2 className="analytics-title">Analytics</h2>
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
                      analytics.avgVolume > (thresholds?.volume_max || 0) ? '#cf1322' : '#3f8600'
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
                    color: analytics.avgPitch > (thresholds?.pitch_max || 0) ? '#cf1322' : '#3f8600'
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Average Speed"
                  value={analytics.avgSpeed}
                  suffix="WPM"
                  precision={1}
                  valueStyle={{
                    color: analytics.avgSpeed > (thresholds?.speed_max || 0) ? '#cf1322' : '#3f8600'
                  }}
                />
              </Card>
            </Col>
          </Row>
          <h2 className="recordings-list-title">Recordings</h2>
          <RecordingsList userId={userId} /> {/* Show recordings here */}
          {/* Graph Section */}
          <Card className="mb-6">
            {thresholds ? (
              <Graph speechData={speechData} selectedDate={selectedDate} thresholds={thresholds} />
            ) : (
              <p>Loading thresholds...</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
