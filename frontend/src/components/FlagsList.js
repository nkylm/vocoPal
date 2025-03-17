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

const FlagsList = ({ userId, selectedDate, startDate, endDate }) => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredFlags, setFilteredFlags] = useState([]);
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
    const fetchFlags = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          let url = `http://localhost:8000/api/speechData/${userId}/recordings`;
  
          // Only fetch flags if a date is selected
          if (selectedDate) {
            const startDate = dayjs(selectedDate, 'MMMM Do, YYYY').format('YYYY-MM-DD');
            const endDate = dayjs(selectedDate, 'MMMM Do, YYYY').add(7, 'day').format('YYYY-MM-DD');
            url += `?startDate=${startDate}&endDate=${endDate}`;
  
            const response = await axios.get(url, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setFlags(response.data);
          } else {
            // If no date is selected, show no flags
            setFlags([]);
          }
        } catch (error) {
          console.error('Error fetching recordings:', error);
          setFlags([]);
        } finally {
          setLoading(false);
        }
    };

    fetchFlags();
  }, [userId, startDate, endDate]);

  useEffect(() => {
    const filterFlags = () => {
      return flags.filter((flag) => {
        const notes = flag.audio_notes;

        const matchesSpeechMetric =
          (filters.volumeLevel &&
            (notes.includes('loud') ||
              notes.includes('quiet') ||
              notes.includes('normal-volume'))) ||
          (filters.pitchLevel &&
            (notes.includes('high-pitch') ||
              notes.includes('low-pitch') ||
              notes.includes('normal-pitch'))) ||
          (filters.speedLevel &&
            (notes.includes('fast') || notes.includes('slow') || notes.includes('normal-speed'))) ||
          (filters.volumeFluctuation && notes.includes('volume-fluctuation')) ||
          (filters.pitchFluctuation &&
            (notes.includes('volatile') || notes.includes('monotone'))) ||
          (filters.speedFluctuation && notes.includes('speed-fluctuation'));

        const matchesTargetRange =
          (filters.aboveTargetRange &&
            (notes.includes('loud') || notes.includes('high-pitch') || notes.includes('fast'))) ||
          (filters.belowTargetRange &&
            (notes.includes('quiet') || notes.includes('low-pitch') || notes.includes('slow')));

        return matchesSpeechMetric && matchesTargetRange;
      });
    };

    setFilteredFlags(filterFlags());
  }, [flags, filters]);

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

  const renderFlagCard = (flag) => {
    const getMetricBadges = () => {
      const badges = [];
      const notes = flag.audio_notes;

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
          height: '120px',  // Fixed height instead of aspect ratio
        }}
        bodyStyle={{
          padding: '16px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {badges.map((badge, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
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
        <Text type="secondary">
          {dayjs(flag.date_recorded).format('MMM D, h:mm A')}
        </Text>
      </Card>
    );
  };

  if (loading) {
    return <Spin tip="Loading flags..." />;
  }

  return (
    <div>
      <FilterSection />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <Title level={4}>Flags</Title>
        {selectedDate ? (
          <span>
            Showing {filteredFlags.length} of {flags.length}
          </span>
        ) : (
          <span>Please select a date to view flags</span>
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
          dataSource={filteredFlags}
          renderItem={renderFlagCard}
          locale={{ emptyText: 'No flags found for the selected period' }}
        />
      ) : (
        <Empty description="Select a date to view flags" />
      )}
    </div>
  );
};

FlagsList.propTypes = {
  userId: PropTypes.string.isRequired,
  selectedDate: PropTypes.string,
  startDate: PropTypes.string,
  endDate: PropTypes.string
};

export default FlagsList;