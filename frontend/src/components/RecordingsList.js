import React, { useEffect, useState } from 'react';
import { Card, List, Spin, Space, Checkbox, Typography, Row, Col, Empty } from 'antd';
import axios from 'axios';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import {
  SoundOutlined,
  RiseOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const RecordingsList = ({ userId, selectedDate }) => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredRecordings, setFilteredRecordings] = useState([]);
  const [filters, setFilters] = useState({
    // Speech Metric
    volumeLevel: true,
    pitchLevel: true,
    speedLevel: true,
    volumeFluctuation: false,
    pitchFluctuation: false,
    speedFluctuation: false,
    // Target Range
    aboveTargetRange: true,
    belowTargetRange: true
  });

  useEffect(() => {
    const fetchRecordings = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        let url = `http://localhost:8000/api/speechData/${userId}/recordings`;

        // Only fetch recordings if a date is selected
        if (selectedDate) {
          const startDate = dayjs(selectedDate, 'MMMM Do, YYYY').format('YYYY-MM-DD');
          const endDate = dayjs(selectedDate, 'MMMM Do, YYYY').add(7, 'day').format('YYYY-MM-DD');
          url += `?startDate=${startDate}&endDate=${endDate}`;

          const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setRecordings(response.data);
        } else {
          // If no date is selected, show no recordings
          setRecordings([]);
        }
      } catch (error) {
        console.error('Error fetching recordings:', error);
        setRecordings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordings();
  }, [userId, selectedDate]);

  useEffect(() => {
    // Filter recordings based on selected filters
    const filterRecordings = () => {
      return recordings.filter((recording) => {
        const notes = recording.audio_notes;

        // Check if any of the enabled filters match the recording's notes
        const matchesSpeechMetric =
          (filters.volumeLevel &&
            (notes.includes('loud') ||
              notes.includes('quiet'))) ||
          (filters.pitchLevel &&
            (notes.includes('high-pitch') ||
              notes.includes('low-pitch'))) ||
          (filters.speedLevel &&
            (notes.includes('fast') || notes.includes('slow'))) ||
          (filters.volumeFluctuation && notes.includes('unstable-volume')) ||
          (filters.pitchFluctuation &&
            (notes.includes('volatile') || notes.includes('monotone'))) ||
          (filters.speedFluctuation && notes.includes('unstable-speed'));

        const matchesTargetRange =
          (filters.aboveTargetRange &&
            (notes.includes('loud') || notes.includes('high-pitch') || notes.includes('fast'))) ||
          (filters.belowTargetRange &&
            (notes.includes('quiet') || notes.includes('low-pitch') || notes.includes('slow')));

        return matchesSpeechMetric && matchesTargetRange;
      });
    };

    setFilteredRecordings(filterRecordings());
  }, [recordings, filters]);

  const handleFilterChange = (filterName) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const FilterSection = () => (
    <Card className="mb-4">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Row>
          <Col span={12}>
            <Title level={5}>SPEECH METRIC</Title>
            <Space direction="vertical">
              <Checkbox
                checked={filters.volumeLevel}
                onChange={() => handleFilterChange('volumeLevel')}
              >
                Volume Level
              </Checkbox>
              <Checkbox
                checked={filters.pitchLevel}
                onChange={() => handleFilterChange('pitchLevel')}
              >
                Pitch Level
              </Checkbox>
              <Checkbox
                checked={filters.speedLevel}
                onChange={() => handleFilterChange('speedLevel')}
              >
                Speed Level
              </Checkbox>
              <Checkbox
                checked={filters.volumeFluctuation}
                onChange={() => handleFilterChange('volumeFluctuation')}
              >
                Volume Fluctuation
              </Checkbox>
              <Checkbox
                checked={filters.pitchFluctuation}
                onChange={() => handleFilterChange('pitchFluctuation')}
              >
                Pitch Fluctuation
              </Checkbox>
              <Checkbox
                checked={filters.speedFluctuation}
                onChange={() => handleFilterChange('speedFluctuation')}
              >
                Speed Fluctuation
              </Checkbox>
            </Space>
          </Col>
          <Col span={12}>
            <Title level={5}>TARGET RANGE</Title>
            <Space direction="vertical">
              <Checkbox
                checked={filters.aboveTargetRange}
                onChange={() => handleFilterChange('aboveTargetRange')}
              >
                Above Target Range
              </Checkbox>
              <Checkbox
                checked={filters.belowTargetRange}
                onChange={() => handleFilterChange('belowTargetRange')}
              >
                Below Target Range
              </Checkbox>
            </Space>
          </Col>
        </Row>
      </Space>
    </Card>
  );

  const renderRecordingCard = (recording) => {
    const getMetricBadges = () => {
      const badges = [];
      const notes = recording.audio_notes;

      // Volume badge
      if (notes.includes('loud')) {
        badges.push({ 
          type: 'Volume', 
          value: 'Loud', 
          icon: <SoundOutlined />, 
          direction: '↑',
          bgColor: '#e6f4ff',
          iconColor: '#1890ff'
        });
      } else if (notes.includes('quiet')) {
        badges.push({ 
          type: 'Volume', 
          value: 'Quiet', 
          icon: <SoundOutlined />, 
          direction: '↓',
          bgColor: '#e6f4ff',
          iconColor: '#1890ff'
        });
      }

      // Pitch badge
      if (notes.includes('high-pitch')) {
        badges.push({ 
          type: 'Pitch', 
          value: 'High', 
          icon: <RiseOutlined />, 
          direction: '↑',
          bgColor: '#fff7e6',
          iconColor: '#faad14'
        });
      } else if (notes.includes('low-pitch')) {
        badges.push({ 
          type: 'Pitch', 
          value: 'Low', 
          icon: <RiseOutlined />, 
          direction: '↓',
          bgColor: '#fff7e6',
          iconColor: '#faad14'
        });
      } else if (notes.includes('volatile')) {
        badges.push({ 
          type: 'Pitch', 
          value: 'Volatile', 
          icon: <RiseOutlined />, 
          direction: '↑',
          bgColor: '#fff7e6',
          iconColor: '#faad14'
        });
      } else if (notes.includes('monotone')) {
        badges.push({ 
          type: 'Pitch', 
          value: 'Monotone', 
          icon: <RiseOutlined />, 
          direction: '↓',
          bgColor: '#fff7e6',
          iconColor: '#faad14'
        });
      }

      // Speed badge
      if (notes.includes('fast')) {
        badges.push({ 
          type: 'Speed', 
          value: 'Fast', 
          icon: <ThunderboltOutlined />, 
          direction: '↑',
          bgColor: '#f9f0ff',
          iconColor: '#722ed1'
        });
      } else if (notes.includes('slow')) {
        badges.push({ 
          type: 'Speed', 
          value: 'Slow', 
          icon: <ThunderboltOutlined />, 
          direction: '↓',
          bgColor: '#f9f0ff',
          iconColor: '#722ed1'
        });
      }

      return badges;
    };

    const badges = getMetricBadges();

    return (
      <Card 
        style={{ 
          width: '100%',
          marginBottom: '16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          border: '1px solid #f0f0f0',
          minHeight: '200px', // Minimum height, will expand as needed
        }}
        bodyStyle={{
          padding: '16px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {badges.map((badge, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '4px'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: badge.bgColor,
              }}>
                {React.cloneElement(badge.icon, {
                  style: { 
                    fontSize: '16px',
                    color: badge.iconColor
                  }
                })}
                <Text strong>{badge.type}</Text>
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: '#f5f5f5',
              }}>
                <Text>{badge.value} {badge.direction}</Text>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto' }}>
          <p>{dayjs(recording.date_recorded).format('MMM D, h:mm A')}</p>
          <audio 
            controls 
            style={{ width: '100%', marginTop: '4px' }}
            key={recording.recording_url}
            src={recording.recording_url}
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      </Card>
    );
  };

  if (loading) {
    return <Spin tip="Loading recordings..." />;
  }

  return (
    <div>
      <FilterSection />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <Title level={4}>Flagged recordings</Title>
        {selectedDate ? (
          <span>
            Showing {filteredRecordings.length} of {recordings.length}
          </span>
        ) : (
          <span>Please select a date to view recordings</span>
        )}
      </div>
      {selectedDate ? (
        <List
          grid={{
            gutter: 32, 
            xs: 1,
            sm: 2,
            md: 2,
            lg: 4,
            xl: 4,
            xxl: 4,
          }}
          dataSource={filteredRecordings}
          renderItem={renderRecordingCard}
          locale={{ emptyText: 'No recordings found for the selected period' }}
          style={{ marginBottom: '60px' }} // Add space at the bottom
        />
      ) : (
        <Empty description="Select a date to view recordings" style={{ marginBottom: '60px' }} />
      )}
    </div>
  );
};

RecordingsList.propTypes = {
  userId: PropTypes.string.isRequired,
  selectedDate: PropTypes.string
};

export default RecordingsList;