import React, { useEffect, useState, useRef } from 'react';
import {
  Card,
  List,
  Spin,
  Space,
  Checkbox,
  Typography,
  Row,
  Col,
  Empty,
  Dropdown,
  Button
} from 'antd';
import axios from 'axios';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import {
  SoundOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  DownOutlined,
  FilterOutlined
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
    pitchFluctuation: true,
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
          (filters.volumeLevel && (notes.includes('loud') || notes.includes('quiet'))) ||
          (filters.pitchLevel && (notes.includes('high-pitch') || notes.includes('low-pitch'))) ||
          (filters.speedLevel && (notes.includes('fast') || notes.includes('slow'))) ||
          (filters.volumeFluctuation && notes.includes('unstable-volume')) ||
          (filters.pitchFluctuation &&
            (notes.includes('unstable-pitch') || notes.includes('monotone'))) ||
          (filters.speedFluctuation && notes.includes('unstable-speed'));

        // Separate the notes into above and below target range
        const aboveTargetNotes =
          notes.includes('loud') ||
          notes.includes('high-pitch') ||
          notes.includes('fast') ||
          notes.includes('unstable-pitch') ||
          notes.includes('unstable-volume') ||
          notes.includes('unstable-speed');

        const belowTargetNotes =
          notes.includes('quiet') ||
          notes.includes('low-pitch') ||
          notes.includes('slow') ||
          notes.includes('monotone');

        // Check if the recording matches the selected target range filters
        const matchesTargetRange =
          (filters.aboveTargetRange && aboveTargetNotes) ||
          (filters.belowTargetRange && belowTargetNotes);

        return matchesSpeechMetric && matchesTargetRange;
      });
    };

    console.log('filterRecordings: ', filterRecordings());
    setFilteredRecordings(filterRecordings());
  }, [recordings, filters]);

  const handleFilterChange = (filterName) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const FilterDropdownContent = () => (
    <div
      style={{
        padding: '16px',
        width: '250px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow:
          '0 6px 16px -8px rgba(0,0,0,0.08), 0 9px 28px 0 rgba(0,0,0,0.05), 0 12px 48px 16px rgba(0,0,0,0.03)'
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <Title level={5} style={{ color: '#6C757D', fontWeight: 600, marginBottom: '16px' }}>
          SPEECH METRIC
        </Title>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Checkbox
              checked={filters.volumeLevel}
              onChange={() => handleFilterChange('volumeLevel')}
            >
              <Text style={{ fontSize: '14px' }}>Volume Level</Text>
            </Checkbox>
          </div>
          <div>
            <Checkbox
              checked={filters.pitchLevel}
              onChange={() => handleFilterChange('pitchLevel')}
            >
              <Text style={{ fontSize: '14px' }}>Pitch Level</Text>
            </Checkbox>
          </div>
          <div>
            <Checkbox
              checked={filters.speedLevel}
              onChange={() => handleFilterChange('speedLevel')}
            >
              <Text style={{ fontSize: '14px' }}>Speed Level</Text>
            </Checkbox>
          </div>
          <div>
            <Checkbox
              checked={filters.volumeFluctuation}
              onChange={() => handleFilterChange('volumeFluctuation')}
            >
              <Text style={{ fontSize: '14px' }}>Volume Fluctuation</Text>
            </Checkbox>
          </div>
          <div>
            <Checkbox
              checked={filters.pitchFluctuation}
              onChange={() => handleFilterChange('pitchFluctuation')}
            >
              <Text style={{ fontSize: '14px' }}>Pitch Fluctuation</Text>
            </Checkbox>
          </div>
          <div>
            <Checkbox
              checked={filters.speedFluctuation}
              onChange={() => handleFilterChange('speedFluctuation')}
            >
              <Text style={{ fontSize: '14px' }}>Speed Fluctuation</Text>
            </Checkbox>
          </div>
        </Space>
      </div>

      <div>
        <Title level={5} style={{ color: '#6C757D', fontWeight: 600, marginBottom: '16px' }}>
          TARGET RANGE
        </Title>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Checkbox
              checked={filters.aboveTargetRange}
              onChange={() => handleFilterChange('aboveTargetRange')}
            >
              <Text style={{ fontSize: '14px' }}>Above Target Range</Text>
            </Checkbox>
          </div>
          <div>
            <Checkbox
              checked={filters.belowTargetRange}
              onChange={() => handleFilterChange('belowTargetRange')}
            >
              <Text style={{ fontSize: '14px' }}>Below Target Range</Text>
            </Checkbox>
          </div>
        </Space>
      </div>
    </div>
  );

  const renderRecordingCard = (recording) => {
    const getMetricBadges = () => {
      const badges = [];
      const notes = recording.audio_notes;

      // Volume badges
      if (notes.includes('loud')) {
        badges.push({
          type: 'Volume',
          value: 'Loud',
          icon: <SoundOutlined />,
          direction: '↑',
          bgColor: '#e6f4ff',
          color: '#1890ff',
          textColor: '#1890ff'
        });
      } else if (notes.includes('quiet')) {
        badges.push({
          type: 'Volume',
          value: 'Quiet',
          icon: <SoundOutlined />,
          direction: '↓',
          bgColor: '#e6f4ff',
          color: '#1890ff',
          textColor: '#1890ff'
        });
      }
      if (notes.includes('unstable-volume')) {
        badges.push({
          type: 'Volume',
          value: 'Unstable',
          icon: <SoundOutlined />,
          direction: '↕',
          bgColor: '#e6f4ff',
          color: '#1890ff',
          textColor: '#1890ff'
        });
      }

      // Pitch badges
      if (notes.includes('high-pitch')) {
        badges.push({
          type: 'Pitch',
          value: 'High',
          icon: <RiseOutlined />,
          direction: '↑',
          bgColor: '#fff7e6',
          color: '#faad14',
          textColor: '#d48806'
        });
      } else if (notes.includes('low-pitch')) {
        badges.push({
          type: 'Pitch',
          value: 'Low',
          icon: <RiseOutlined />,
          direction: '↓',
          bgColor: '#fff7e6',
          color: '#faad14',
          textColor: '#d48806'
        });
      }
      if (notes.includes('unstable-pitch')) {
        badges.push({
          type: 'Pitch',
          value: 'Unstable',
          icon: <RiseOutlined />,
          direction: '↕',
          bgColor: '#fff7e6',
          color: '#faad14',
          textColor: '#d48806'
        });
      } else if (notes.includes('monotone')) {
        badges.push({
          type: 'Pitch',
          value: 'Monotone',
          icon: <RiseOutlined />,
          direction: '→',
          bgColor: '#fff7e6',
          color: '#faad14',
          textColor: '#d48806'
        });
      }

      // Speed badges
      if (notes.includes('fast')) {
        badges.push({
          type: 'Speed',
          value: 'Fast',
          icon: <ThunderboltOutlined />,
          direction: '↑',
          bgColor: '#f9f0ff',
          color: '#722ed1',
          textColor: '#722ed1'
        });
      } else if (notes.includes('slow')) {
        badges.push({
          type: 'Speed',
          value: 'Slow',
          icon: <ThunderboltOutlined />,
          direction: '↓',
          bgColor: '#f9f0ff',
          color: '#722ed1',
          textColor: '#722ed1'
        });
      }
      if (notes.includes('unstable-speed')) {
        badges.push({
          type: 'Speed',
          value: 'Unstable',
          icon: <ThunderboltOutlined />,
          direction: '↕',
          bgColor: '#f9f0ff',
          color: '#722ed1',
          textColor: '#722ed1'
        });
      }

      return badges;
    };

    const badges = getMetricBadges();

    return (
      <div style={{ padding: '0 8px' }}>
        <Card
          style={{
            width: '100%',
            marginBottom: '16px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            border: '1px solid #f0f0f0',
            minHeight: '200px'
          }}
          bodyStyle={{
            padding: '16px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            {badges.map((badge, index) => (
              <div key={index} style={{ display: 'flex', marginBottom: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 12px',
                    borderRadius: '6px 0 0 6px',
                    backgroundColor: badge.bgColor
                  }}
                >
                  {React.cloneElement(badge.icon, {
                    style: {
                      fontSize: '16px',
                      color: badge.color
                    }
                  })}
                  <Text strong style={{ color: badge.textColor, marginLeft: '4px' }}>
                    {badge.type}
                  </Text>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 12px',
                    borderRadius: '0 6px 6px 0',
                    backgroundColor: '#f5f5f5'
                  }}
                >
                  <Text>
                    {badge.value} {badge.direction}
                  </Text>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto' }}>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              {dayjs(recording.date_recorded).format('MMM D, h:mm a')}
            </Text>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Background noise: {capitalizeFirst(recording.metrics.ambient_noise)}
                </Text>
              </div>
            </div>

            <audio
              controls
              style={{ width: '100%', marginTop: '12px' }}
              key={recording.recording_url}
              src={recording.recording_url}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        </Card>
      </div>
    );
  };

  const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            Flagged recordings
          </Title>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {selectedDate ? (
            <Text type="secondary">
              Showing {filteredRecordings.length} of {recordings.length}
            </Text>
          ) : (
            <Text type="secondary">Please select a date to view recordings</Text>
          )}

          <Dropdown
            overlay={<FilterDropdownContent />}
            trigger={['click']}
            placement="bottomRight"
            overlayStyle={{ width: '280px' }}
          >
            <Button style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
              Filter ({Object.values(filters).filter(Boolean).length}) <DownOutlined />
            </Button>
          </Dropdown>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <Spin tip="Loading recordings..." />
        </div>
      ) : selectedDate ? (
        <List
          grid={{
            gutter: 16,
            xs: 1,
            sm: 1,
            md: 3,
            lg: 4,
            xl: 4,
            xxl: 4
          }}
          dataSource={filteredRecordings}
          renderItem={renderRecordingCard}
          locale={{
            emptyText: <Empty description="No recordings found for the selected period" />
          }}
          style={{ marginBottom: '60px' }}
        />
      ) : (
        <Empty
          description="Select a date to view recordings"
          style={{ marginTop: '48px', marginBottom: '60px' }}
        />
      )}
    </div>
  );
};

RecordingsList.propTypes = {
  userId: PropTypes.string.isRequired,
  selectedDate: PropTypes.string
};

export default RecordingsList;
