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
  const [previousPeriodSpeechData, setPreviousPeriodSpeechData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [thresholds, setThresholds] = useState(null);
  const [analytics, setAnalytics] = useState({
    volume: { inRange: 0, above: 0, below: 0, previousPeriodInRange: 0 },
    pitch: { inRange: 0, above: 0, below: 0, previousPeriodInRange: 0 },
    speed: { inRange: 0, above: 0, below: 0, previousPeriodInRange: 0 },
    // Add fluctuation analytics
    volumeFluctuation: { inRange: 0, unstable: 0, previousPeriodInRange: 0 },
    pitchFluctuation: { inRange: 0, unstable: 0, monotone: 0, previousPeriodInRange: 0 },
    speedFluctuation: { inRange: 0, unstable: 0, previousPeriodInRange: 0 }
  });
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  const [granularity, setGranularity] = useState('week');
  const [comparisonPeriodLabel, setComparisonPeriodLabel] = useState('Last week');

  // Calculate analytics from speech data
  useEffect(() => {
    console.log('useEffect');
    console.log('speechData: ', speechData);
    console.log('previousPeriodSpeechData: ', previousPeriodSpeechData);

    if (thresholds) {
      // Only check for thresholds, allow empty arrays
      const volumeMetrics =
        speechData.length > 0
          ? speechData.reduce(
              (acc, data) => {
                const volume = data.metrics.volume;
                if (volume > data.thresholds.volume_max) acc.above++;
                else if (volume < data.thresholds.volume_min) acc.below++;
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
                if (pitch > data.thresholds.pitch_max) acc.above++;
                else if (pitch < data.thresholds.pitch_min) acc.below++;
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
                if (speed > data.thresholds.speed_max) acc.above++;
                else if (speed < data.thresholds.speed_min) acc.below++;
                else acc.inRange++;
                return acc;
              },
              { inRange: 0, above: 0, below: 0 }
            )
          : { inRange: 0, above: 0, below: 0 };

      // Calculate fluctuation metrics
      const volumeFluctuationMetrics =
        speechData.length > 0
          ? speechData.reduce(
              (acc, data) => {
                // Assuming volume_fluctuation is stored in data.metrics
                const volumeFluctuation = data.metrics.volume_fluctuation || 0;
                if (volumeFluctuation > data.thresholds.volume_fluctuation_max) acc.unstable++;
                else acc.inRange++;
                return acc;
              },
              { inRange: 0, unstable: 0 }
            )
          : { inRange: 0, unstable: 0 };

      const pitchFluctuationMetrics =
        speechData.length > 0
          ? speechData.reduce(
              (acc, data) => {
                const pitchFluctuation = data.metrics.pitch_fluctuation || 0;
                if (pitchFluctuation > data.thresholds.pitch_fluctuation_max) acc.unstable++;
                else if (pitchFluctuation < data.thresholds.pitch_fluctuation_min) acc.monotone++;
                else acc.inRange++;
                return acc;
              },
              { inRange: 0, unstable: 0, monotone: 0 }
            )
          : { inRange: 0, unstable: 0, monotone: 0 };

      const speedFluctuationMetrics =
        speechData.length > 0
          ? speechData.reduce(
              (acc, data) => {
                const speedFluctuation = data.metrics.speed_fluctuation || 0;
                if (speedFluctuation > data.thresholds.speed_fluctuation_max) acc.unstable++;
                else acc.inRange++;
                return acc;
              },
              { inRange: 0, unstable: 0 }
            )
          : { inRange: 0, unstable: 0 };

      // Calculate previous period's in-range percentages
      const previousPeriodVolumeInRange =
        previousPeriodSpeechData.length > 0
          ? previousPeriodSpeechData.reduce((acc, data) => {
              return data.metrics.volume >= data.thresholds.volume_min &&
                data.metrics.volume <= data.thresholds.volume_max
                ? acc + 1
                : acc;
            }, 0)
          : 0;

      console.log('previousPeriodVolumeInRange: ', previousPeriodVolumeInRange);

      const previousPeriodPitchInRange =
        previousPeriodSpeechData.length > 0
          ? previousPeriodSpeechData.reduce((acc, data) => {
              return data.metrics.pitch >= data.thresholds.pitch_min &&
                data.metrics.pitch <= data.thresholds.pitch_max
                ? acc + 1
                : acc;
            }, 0)
          : 0;

      console.log('previousPeriodPitchInRange: ', previousPeriodPitchInRange);

      const previousPeriodSpeedInRange =
        previousPeriodSpeechData.length > 0
          ? previousPeriodSpeechData.reduce((acc, data) => {
              return data.metrics.speed >= data.thresholds.speed_min &&
                data.metrics.speed <= data.thresholds.speed_max
                ? acc + 1
                : acc;
            }, 0)
          : 0;

      console.log('previousPeriodSpeedInRange: ', previousPeriodSpeedInRange);

      // Calculate previous period's fluctuation in-range percentages
      const previousPeriodVolumeFluctuationInRange =
        previousPeriodSpeechData.length > 0
          ? previousPeriodSpeechData.reduce((acc, data) => {
              const volumeFluctuation = data.metrics.volume_fluctuation || 0;
              return volumeFluctuation <= data.thresholds.volume_fluctuation_max
                ? acc + 1
                : acc;
            }, 0)
          : 0;

      const previousPeriodPitchFluctuationInRange =
        previousPeriodSpeechData.length > 0
          ? previousPeriodSpeechData.reduce((acc, data) => {
              const pitchFluctuation = data.metrics.pitch_fluctuation || 0;
              return pitchFluctuation >= data.thresholds.pitch_fluctuation_min &&
                pitchFluctuation <= data.thresholds.pitch_fluctuation_max
                ? acc + 1
                : acc;
            }, 0)
          : 0;

      const previousPeriodSpeedFluctuationInRange =
        previousPeriodSpeechData.length > 0
          ? previousPeriodSpeechData.reduce((acc, data) => {
              const speedFluctuation = data.metrics.speed_fluctuation || 0;
              return speedFluctuation <= data.thresholds.speed_fluctuation_max
                ? acc + 1
                : acc;
            }, 0)
          : 0;

      const total = speechData.length;
      const previousPeriodTotal = previousPeriodSpeechData.length;

      console.log('previousPeriodTotal: ', previousPeriodTotal);

      setAnalytics({
        volume: {
          inRange: total ? Math.round((volumeMetrics.inRange / total) * 100) : 0,
          above: total ? Math.round((volumeMetrics.above / total) * 100) : 0,
          below: total ? Math.round((volumeMetrics.below / total) * 100) : 0,
          previousPeriodInRange: previousPeriodTotal
            ? Math.round((previousPeriodVolumeInRange / previousPeriodTotal) * 100)
            : 0
        },
        pitch: {
          inRange: total ? Math.round((pitchMetrics.inRange / total) * 100) : 0,
          above: total ? Math.round((pitchMetrics.above / total) * 100) : 0,
          below: total ? Math.round((pitchMetrics.below / total) * 100) : 0,
          previousPeriodInRange: previousPeriodTotal
            ? Math.round((previousPeriodPitchInRange / previousPeriodTotal) * 100)
            : 0
        },
        speed: {
          inRange: total ? Math.round((speedMetrics.inRange / total) * 100) : 0,
          above: total ? Math.round((speedMetrics.above / total) * 100) : 0,
          below: total ? Math.round((speedMetrics.below / total) * 100) : 0,
          previousPeriodInRange: previousPeriodTotal
            ? Math.round((previousPeriodSpeedInRange / previousPeriodTotal) * 100)
            : 0
        },
        // Add fluctuation analytics
        volumeFluctuation: {
          inRange: total ? Math.round((volumeFluctuationMetrics.inRange / total) * 100) : 0,
          unstable: total ? Math.round((volumeFluctuationMetrics.unstable / total) * 100) : 0,
          previousPeriodInRange: previousPeriodTotal
            ? Math.round((previousPeriodVolumeFluctuationInRange / previousPeriodTotal) * 100)
            : 0
        },
        pitchFluctuation: {
          inRange: total ? Math.round((pitchFluctuationMetrics.inRange / total) * 100) : 0,
          unstable: total ? Math.round((pitchFluctuationMetrics.unstable / total) * 100) : 0,
          monotone: total ? Math.round((pitchFluctuationMetrics.monotone / total) * 100) : 0,
          previousPeriodInRange: previousPeriodTotal
            ? Math.round((previousPeriodPitchFluctuationInRange / previousPeriodTotal) * 100)
            : 0
        },
        speedFluctuation: {
          inRange: total ? Math.round((speedFluctuationMetrics.inRange / total) * 100) : 0,
          unstable: total ? Math.round((speedFluctuationMetrics.unstable / total) * 100) : 0,
          previousPeriodInRange: previousPeriodTotal
            ? Math.round((previousPeriodSpeedFluctuationInRange / previousPeriodTotal) * 100)
            : 0
        }
      });
    }
  }, [speechData, previousPeriodSpeechData, thresholds]);

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
            speed_max: threshold.speed_max,
            volume_fluctuation_max: threshold.volume_fluctuation_max,
            pitch_fluctuation_min: threshold.pitch_fluctuation_min,
            pitch_fluctuation_max: threshold.pitch_fluctuation_max,
            speed_fluctuation_max: threshold.speed_fluctuation_max
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
    
    // Update comparison period label based on granularity
    updateComparisonPeriodLabel();
  }, [granularity]); // Add granularity to dependency array
  
  // Function to update comparison period label
  const updateComparisonPeriodLabel = () => {
    switch (granularity) {
      case 'day':
        setComparisonPeriodLabel('Previous day');
        break;
      case 'week':
        setComparisonPeriodLabel('Previous week');
        break;
      case 'month':
        setComparisonPeriodLabel('Previous month');
        break;
      case 'year':
        setComparisonPeriodLabel('Previous year');
        break;
      default:
        setComparisonPeriodLabel('Previous period');
    }
  };

  // Modify handleDateChange to calculate date ranges based on granularity
  const handleDateChange = async (date, dateString, endDate) => {
    if (!date) return;

    const startDate = dayjs(date).startOf('day');
    let formattedStartDate;
    let formattedEndDate;
    let previousPeriodStartDate;
    let previousPeriodEndDate;

    // Calculate start and end dates based on granularity
    switch (granularity) {
      case 'day':
        formattedStartDate = startDate.format('YYYY-MM-DD');
        formattedEndDate = startDate.add(1, 'day').format('YYYY-MM-DD');
        previousPeriodStartDate = startDate.subtract(1, 'day').format('YYYY-MM-DD');
        previousPeriodEndDate = startDate.endOf('day').format('YYYY-MM-DD');
        break;
      case 'week':
        formattedStartDate = startDate.format('YYYY-MM-DD');
        formattedEndDate = startDate.add(6, 'days').format('YYYY-MM-DD');
        previousPeriodStartDate = startDate.subtract(7, 'days').format('YYYY-MM-DD');
        previousPeriodEndDate = startDate.subtract(1, 'day').format('YYYY-MM-DD');
        break;
      case 'month':
        formattedStartDate = startDate.startOf('month').format('YYYY-MM-DD');
        formattedEndDate = startDate.endOf('month').format('YYYY-MM-DD');
        previousPeriodStartDate = startDate.subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
        previousPeriodEndDate = startDate.subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
        break;
      case 'year':
        formattedStartDate = startDate.startOf('year').format('YYYY-MM-DD');
        formattedEndDate = startDate.endOf('year').format('YYYY-MM-DD');
        previousPeriodStartDate = startDate.subtract(1, 'year').startOf('year').format('YYYY-MM-DD');
        previousPeriodEndDate = startDate.subtract(1, 'year').endOf('year').format('YYYY-MM-DD');
        break;
      default:
        formattedStartDate = startDate.format('YYYY-MM-DD');
        formattedEndDate = startDate.add(6, 'days').format('YYYY-MM-DD');
        previousPeriodStartDate = startDate.subtract(7, 'days').format('YYYY-MM-DD');
        previousPeriodEndDate = startDate.subtract(1, 'day').format('YYYY-MM-DD');
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

    // Fetch previous period's data for comparison
    try {
      const previousPeriodResponse = await axios.get(`http://localhost:8000/api/speechData/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          startDate: previousPeriodStartDate,
          endDate: previousPeriodEndDate
        }
      });
      setPreviousPeriodSpeechData(previousPeriodResponse.data);
    } catch (error) {
      console.error('Error fetching previous period data:', error);
      setPreviousPeriodSpeechData([]); // Set empty data on error
    }
    
    // Update comparison period label
    updateComparisonPeriodLabel();
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
              <Text type="secondary">{comparisonPeriodLabel}: </Text>
              <span
                style={{
                  backgroundColor: data.inRange - data.previousPeriodInRange > 0 ? '#9AD4AB' : '#F08F95',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {data.inRange - data.previousPeriodInRange > 0 ? (
                  <ArrowUpOutlined />
                ) : (
                  <ArrowDownOutlined />
                )}
                {Math.abs(data.inRange - data.previousPeriodInRange)}%
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
  
  // New function to render fluctuation metric cards
  const renderFluctuationMetricCard = (title, icon, data, range) => {
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
              <Text type="secondary">{comparisonPeriodLabel}: </Text>
              <span
                style={{
                  backgroundColor: data.inRange - data.previousPeriodInRange > 0 ? '#9AD4AB' : '#F08F95',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {data.inRange - data.previousPeriodInRange > 0 ? (
                  <ArrowUpOutlined />
                ) : (
                  <ArrowDownOutlined />
                )}
                {Math.abs(data.inRange - data.previousPeriodInRange)}%
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
                {data.unstable}%
              </Title>
              <Text type="secondary">
                Unstable <ArrowUpOutlined />
              </Text>
            </div>
            {title === 'Pitch' && (
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
                  {data.monotone}%
                </Title>
                <Text type="secondary">
                  Monotone <ArrowDownOutlined />
                </Text>
              </div>
            )}
            {title !== 'Pitch' && (
              <div
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  visibility: 'hidden' // Hide this div if not pitch to maintain layout
                }}
              >
              </div>
            )}
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

                    <Title level={4} className="mt-6">Fluctuation</Title>
                    <Row gutter={[16, 16]} style={{ marginBottom: '60px' }}>
                      <Col xs={24} md={8}>
                        {renderFluctuationMetricCard(
                          'Volume',
                          <SoundOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
                          analytics.volumeFluctuation,
                          `<${thresholds?.volume_fluctuation_max} dB`
                        )}
                      </Col>
                      <Col xs={24} md={8}>
                        {renderFluctuationMetricCard(
                          'Pitch',
                          <RiseOutlined style={{ fontSize: '24px', color: '#faad14' }} />,
                          analytics.pitchFluctuation,
                          `${thresholds?.pitch_fluctuation_min}-${thresholds?.pitch_fluctuation_max} Hz`
                        )}
                      </Col>
                      <Col xs={24} md={8}>
                        {renderFluctuationMetricCard(
                          'Speed',
                          <ThunderboltOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
                          analytics.speedFluctuation,
                          `<${thresholds?.speed_fluctuation_max} syll/sec`
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