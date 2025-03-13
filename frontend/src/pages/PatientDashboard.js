import React, { useState, useEffect } from 'react';
import SideBar from '../components/SideBar';
import TopNavBar from '../components/TopNavBar';
import './PatientDashboard.css';
import DatePickerDropdown from '../components/DatePickerDropdown';
import Graph from '../components/Graph';
import dayjs from 'dayjs';
import axios from 'axios';
import { Card, Row, Col, Typography, Tabs } from 'antd';
import {
  SoundOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import RecordingsList from '../components/RecordingsList';

const { Title, Text } = Typography;

const PatientDashboard = () => {
  const [speechData, setSpeechData] = useState([]);
  const [lastWeekSpeechData, setLastWeekSpeechData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [thresholds, setThresholds] = useState(null);
  const [analytics, setAnalytics] = useState({
    volume: { inRange: 0, above: 0, below: 0, lastWeekInRange: 0 },
    pitch: { inRange: 0, above: 0, below: 0, lastWeekInRange: 0 },
    speed: { inRange: 0, above: 0, below: 0, lastWeekInRange: 0 }
  });
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  const [granularity, setGranularity] = useState('week');

  // Calculate analytics from speech data
  useEffect(() => {
    console.log('useEffect');
    console.log('speechData: ', speechData);
    console.log('lastWeekSpeechData: ', lastWeekSpeechData);

    if (thresholds) {
      // Only check for thresholds, allow empty arrays
      const volumeMetrics =
        speechData.length > 0
          ? speechData.reduce(
              (acc, data) => {
                const volume = data.metrics.volume;
                if (volume > thresholds.volume_max) acc.above++;
                else if (volume < thresholds.volume_min) acc.below++;
                else acc.inRange++;
                return acc;
              },
              { inRange: 0, above: 0, below: 0 }
            )
          : { inRange: 0, above: 0, below: 0 };

      console.log('volumeMetrics: ', volumeMetrics);

      const pitchMetrics =
        speechData.length > 0
          ? speechData.reduce(
              (acc, data) => {
                const pitch = data.metrics.pitch;
                if (pitch > thresholds.pitch_max) acc.above++;
                else if (pitch < thresholds.pitch_min) acc.below++;
                else acc.inRange++;
                return acc;
              },
              { inRange: 0, above: 0, below: 0 }
            )
          : { inRange: 0, above: 0, below: 0 };

      const speedMetrics =
        speechData.length > 0
          ? speechData.reduce(
              (acc, data) => {
                const speed = data.metrics.speed;
                if (speed > thresholds.speed_max) acc.above++;
                else if (speed < thresholds.speed_min) acc.below++;
                else acc.inRange++;
                return acc;
              },
              { inRange: 0, above: 0, below: 0 }
            )
          : { inRange: 0, above: 0, below: 0 };

      // Calculate last week's in-range percentages
      const lastWeekVolumeInRange =
        lastWeekSpeechData.length > 0
          ? lastWeekSpeechData.reduce((acc, data) => {
              return data.metrics.volume >= data.thresholds.volume_min &&
                data.metrics.volume <= data.thresholds.volume_max
                ? acc + 1
                : acc;
            }, 0)
          : 0;

      console.log('lastWeekVolumeInRange: ', lastWeekVolumeInRange);

      const lastWeekPitchInRange =
        lastWeekSpeechData.length > 0
          ? lastWeekSpeechData.reduce((acc, data) => {
              return data.metrics.pitch >= data.thresholds.pitch_min &&
                data.metrics.pitch <= data.thresholds.pitch_max
                ? acc + 1
                : acc;
            }, 0)
          : 0;

      const lastWeekSpeedInRange =
        lastWeekSpeechData.length > 0
          ? lastWeekSpeechData.reduce((acc, data) => {
              return data.metrics.speed >= data.thresholds.speed_min &&
                data.metrics.speed <= data.thresholds.speed_max
                ? acc + 1
                : acc;
            }, 0)
          : 0;

      const total = speechData.length;
      const lastWeekTotal = lastWeekSpeechData.length;

      console.log('lastWeekTotal: ', lastWeekTotal);

      setAnalytics({
        volume: {
          inRange: total ? Math.round((volumeMetrics.inRange / total) * 100) : 0,
          above: total ? Math.round((volumeMetrics.above / total) * 100) : 0,
          below: total ? Math.round((volumeMetrics.below / total) * 100) : 0,
          lastWeekInRange: lastWeekTotal
            ? Math.round((lastWeekVolumeInRange / lastWeekTotal) * 100)
            : 0
        },
        pitch: {
          inRange: total ? Math.round((pitchMetrics.inRange / total) * 100) : 0,
          above: total ? Math.round((pitchMetrics.above / total) * 100) : 0,
          below: total ? Math.round((pitchMetrics.below / total) * 100) : 0,
          lastWeekInRange: lastWeekTotal
            ? Math.round((lastWeekPitchInRange / lastWeekTotal) * 100)
            : 0
        },
        speed: {
          inRange: total ? Math.round((speedMetrics.inRange / total) * 100) : 0,
          above: total ? Math.round((speedMetrics.above / total) * 100) : 0,
          below: total ? Math.round((speedMetrics.below / total) * 100) : 0,
          lastWeekInRange: lastWeekTotal
            ? Math.round((lastWeekSpeedInRange / lastWeekTotal) * 100)
            : 0
        }
      });
    }
  }, [speechData, lastWeekSpeechData, thresholds]);

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

  // Add useEffect to handle granularity changes
  useEffect(() => {
    if (selectedDate) {
      // Reuse the date that was already selected but with new granularity
      handleDateChange(selectedDate, null, null);
    }
  }, [granularity]); // Add granularity to dependency array

  // Modify handleDateChange to calculate date ranges based on granularity
  const handleDateChange = async (date, dateString, endDate) => {
    if (!date) return;

    const startDate = dayjs(date).startOf('day');
    let formattedStartDate;
    let formattedEndDate;

    // Calculate start and end dates based on granularity
    switch (granularity) {
      case 'day':
        formattedStartDate = startDate.format('YYYY-MM-DD');
        formattedEndDate = startDate.clone().add(1, 'day').format('YYYY-MM-DD');
        break;
      case 'week':
        formattedStartDate = startDate.format('YYYY-MM-DD');
        formattedEndDate = startDate.clone().add(7, 'days').format('YYYY-MM-DD');
        break;
      case 'month':
        formattedStartDate = startDate.startOf('month').format('YYYY-MM-DD');
        formattedEndDate = startDate.endOf('month').format('YYYY-MM-DD');
        break;
      case 'year':
        formattedStartDate = startDate.startOf('year').format('YYYY-MM-DD');
        formattedEndDate = startDate.endOf('year').format('YYYY-MM-DD');
        break;
      default:
        formattedStartDate = startDate.format('YYYY-MM-DD');
        formattedEndDate = startDate.clone().add(7, 'days').format('YYYY-MM-DD');
    }

    // Always update the selected date first
    setSelectedDate(startDate);

    try {
      const response = await axios.get(`http://localhost:8000/api/speechData/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          startDate: formattedStartDate,
          endDate: formattedEndDate
        }
      });
      setSpeechData(response.data);
    } catch (error) {
      console.error('Error fetching speech data:', error);
      setSpeechData([]); // Set empty data on error
    }

    // Fetch last week's data for comparison
    try {
      const lastWeekStartDate = startDate.clone().subtract(7, 'days').format('YYYY-MM-DD');
      const lastWeekEndDate = startDate.format('YYYY-MM-DD');
      
      const lastWeekResponse = await axios.get(`http://localhost:8000/api/speechData/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          startDate: lastWeekStartDate,
          endDate: lastWeekEndDate
        }
      });
      setLastWeekSpeechData(lastWeekResponse.data);
    } catch (error) {
      console.error('Error fetching last week data:', error);
      setLastWeekSpeechData([]); // Set empty data on error
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
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: getTitleBoxColor(title),
            padding: '4px 12px',
            borderRadius: '6px',
            marginBottom: '12px'
          }}
        >
          {React.cloneElement(icon, {
            style: { fontSize: '16px', marginRight: '8px', color: '#000000' }
          })}
          <Text strong>{title}</Text>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div
            style={{
              backgroundColor: '#f0f9f0',
              borderRadius: '8px',
              padding: '12px',
              flex: '1.5',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <Title level={2} style={{ margin: '0', fontSize: '36px', textAlign: 'center' }}>
              {data.inRange}%
            </Title>
            <Text style={{ textAlign: 'center' }}>In target range</Text>
            <Text type="secondary" style={{ textAlign: 'center' }}>
              {range}
            </Text>
            <div style={{ marginTop: 'auto', textAlign: 'center' }}>
              <Text type="secondary">Last week: </Text>
              <span
                style={{
                  backgroundColor: data.inRange - data.lastWeekInRange > 0 ? '#9AD4AB' : '#F08F95',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {data.inRange - data.lastWeekInRange > 0 ? (
                  <ArrowUpOutlined />
                ) : (
                  <ArrowDownOutlined />
                )}
                {Math.abs(data.inRange - data.lastWeekInRange)}%
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1' }}>
            <div
              style={{
                backgroundColor: '#f5f5f5',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <Title level={3} style={{ margin: '0' }}>
                {data.above}%
              </Title>
              <Text type="secondary">
                {title === 'Volume' ? 'Loud' : title === 'Pitch' ? 'High' : 'Fast'}{' '}
                <ArrowUpOutlined />
              </Text>
            </div>
            <div
              style={{
                backgroundColor: '#f5f5f5',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <Title level={3} style={{ margin: '0' }}>
                {data.below}%
              </Title>
              <Text type="secondary">
                {title === 'Volume' ? 'Quiet' : title === 'Pitch' ? 'Low' : 'Slow'}{' '}
                <ArrowDownOutlined />
              </Text>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="dashboard-layout">
      <SideBar />
      <div className="right-content">
        <TopNavBar />
        <div className="content p-6">
          <div className="mb-6">
            <DatePickerDropdown 
              onDateChange={handleDateChange}
              value={selectedDate}
              granularity={granularity}
              onGranularityChange={setGranularity}
            />
          </div>
          <Tabs
            defaultActiveKey="graph"
            items={[
              {
                key: 'graph',
                label: 'Graph',
                children: (
                  <Card>
                    {thresholds ? (
                      <Graph speechData={speechData} selectedDate={selectedDate} granularity={granularity} />
                    ) : (
                      <p>Loading thresholds...</p>
                    )}
                  </Card>
                )
              },
              {
                key: 'analytics',
                label: 'Analytics',
                children: (
                  <>
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
              },
              {
                key: 'recordings',
                label: 'Recordings',
                children: (
                  <RecordingsList
                    userId={userId}
                    selectedDate={selectedDate}
                    startDate={selectedDate ? dayjs(selectedDate).startOf(granularity).format('YYYY-MM-DD') : null}
                    endDate={selectedDate ? dayjs(selectedDate).endOf(granularity).format('YYYY-MM-DD') : null}
                  />
                )
              }
            ]}
            size="large"
            type="card"
          />
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
