import React, { useEffect, useState } from 'react';
import { Card, List, Spin, Space, Checkbox, Typography, Row, Col, Empty } from 'antd';
import axios from 'axios';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';

const { Title } = Typography;

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
      if (notes.includes('loud')) badges.push({ type: 'Volume', value: 'Loud ↑' });
      else if (notes.includes('quiet')) badges.push({ type: 'Volume', value: 'Quiet ↓' });
      else if (notes.includes('normal-volume')) badges.push({ type: 'Volume', value: 'Normal' });

      // Pitch badge
      if (notes.includes('high-pitch')) badges.push({ type: 'Pitch', value: 'High ↑' });
      else if (notes.includes('low-pitch')) badges.push({ type: 'Pitch', value: 'Low ↓' });
      else if (notes.includes('normal-pitch')) badges.push({ type: 'Pitch', value: 'Normal' });

      // Speed badge
      if (notes.includes('fast')) badges.push({ type: 'Speed', value: 'Fast ↑' });
      else if (notes.includes('slow')) badges.push({ type: 'Speed', value: 'Slow ↓' });
      else if (notes.includes('normal-speed')) badges.push({ type: 'Speed', value: 'Normal' });

      return badges;
    };

    const badges = getMetricBadges();

    return (
      <Card style={{ width: '100%', marginBottom: '16px' }}>
        <div style={{ marginBottom: '12px' }}>
          {badges.map((badge, index) => (
            <span
              key={index}
              style={{
                display: 'inline-block',
                padding: '4px 8px',
                marginRight: '8px',
                borderRadius: '4px',
                backgroundColor:
                  badge.type === 'Volume'
                    ? '#e6f7ff'
                    : badge.type === 'Pitch'
                      ? '#fff7e6'
                      : '#f6ffed',
                border: `1px solid ${
                  badge.type === 'Volume'
                    ? '#91d5ff'
                    : badge.type === 'Pitch'
                      ? '#ffd591'
                      : '#b7eb8f'
                }`
              }}
            >
              {`${badge.type}: ${badge.value}`}
            </span>
          ))}
        </div>
        <div>
          <p>{new Date(recording.date_recorded).toLocaleString()}</p>
          <audio controls style={{ width: '100%' }}>
            <source src={recording.recording_url} type="audio/wav" />
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
          dataSource={filteredRecordings}
          renderItem={renderRecordingCard}
          locale={{ emptyText: 'No recordings found for the selected week' }}
        />
      ) : (
        <Empty description="Select a date to view recordings" />
      )}
    </div>
  );
};

RecordingsList.propTypes = {
  userId: PropTypes.string.isRequired,
  selectedDate: PropTypes.string
};

export default RecordingsList;
