import React, { useState, useEffect } from 'react';
import { Table, Select, Button, Typography, message, Spin } from 'antd';
import axios from 'axios';

const { Title } = Typography;
const { Option } = Select;

const ThresholdTable = ({ patientId, readOnly }) => {
  // Predefined ranges for each metric
  const metricRanges = {
    Volume: {
      level: '13-18 dB',
      levelOptions: {
        Narrow: '12-16 dB',
        Moderate: '10-18 dB',
        Wide: '8-20 dB'
      },
      fluctuationOptions: {
        Narrow: '3.5 dB',
        Moderate: '4 dB',
        Wide: '5 dB'
      }
    },
    Pitch: {
      level: '75-165 Hz',
      levelOptions: {
        Narrow: '110-155 Hz',
        Moderate: '100-165 Hz',
        Wide: '155-265 Hz'
      },
      fluctuationOptions: {
        Narrow: '25-35 Hz',
        Moderate: '20-40 Hz',
        Wide: '10-50 Hz'
      }
    },
    Speed: {
      level: '2-4 syll/sec',
      levelOptions: {
        Narrow: '3-4 syll/sec',
        Moderate: '2-4 syll/sec',
        Wide: '2-5 syll/sec'
      },
      fluctuationOptions: {
        Narrow: '1 syll/sec',
        Moderate: '2 syll/sec',
        Wide: '3 syll/sec'
      }
    }
  };

  const volumeFluctuationLimits = {
    Narrow: 3.5,
    Moderate: 4,
    Wide: 5
  };

  // Define specific fluctuation ranges for pitch
  const pitchFluctuationRanges = {
    Narrow: { min: 25, max: 35 },
    Moderate: { min: 20, max: 40 },
    Wide: { min: 10, max: 50 }
  };

  // Define specific fluctuation upper limits for speed
  const speedFluctuationLimits = {
    Narrow: 1,
    Moderate: 2,
    Wide: 3
  };

  const [data, setData] = useState([
    {
      key: '1',
      metric: 'Volume',
      levelType: 'Narrow',
      fluctuationType: 'Moderate'
    },
    {
      key: '2',
      metric: 'Pitch',
      levelType: 'Wide',
      fluctuationType: 'Narrow'
    },
    {
      key: '3',
      metric: 'Speed',
      levelType: 'Moderate',
      fluctuationType: 'Wide'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  // Helper function to determine level type based on min and max values
  const determineLevelType = (min, max, metricType) => {
    const options = metricRanges[metricType].levelOptions;
    for (const [type, range] of Object.entries(options)) {
      const { min: typeMin, max: typeMax } = parseRange(range);
      if (min === typeMin && max === typeMax) {
        return type;
      }
    }
    return 'Moderate'; // Default fallback
  };

  // Helper function to determine fluctuation type based on values
  const determineFluctuationType = (value, metricType) => {
    if (metricType === 'Volume') {
      for (const [type, limit] of Object.entries(volumeFluctuationLimits)) {
        if (value === limit) return type;
      }
    } else if (metricType === 'Pitch') {
      for (const [type, range] of Object.entries(pitchFluctuationRanges)) {
        if (value >= range.min && value <= range.max) return type;
      }
    } else if (metricType === 'Speed') {
      for (const [type, limit] of Object.entries(speedFluctuationLimits)) {
        if (value === limit) return type;
      }
    }
    return 'Moderate'; // Default fallback
  };

  // Helper function to parse range values
  const parseRange = (rangeStr) => {
    if (rangeStr.includes('syll/sec')) {
      const [min, max] = rangeStr.replace(' syll/sec', '').split('-').map(Number);
      return { min, max };
    } else if (rangeStr.includes('dB')) {
      const [min, max] = rangeStr.replace(' dB', '').split('-').map(Number);
      return { min, max };
    } else if (rangeStr.includes('Hz')) {
      const [min, max] = rangeStr.replace(' Hz', '').split('-').map(Number);
      return { min, max };
    }
    return null;
  };

  // Fetch user thresholds from backend
  useEffect(() => {
    const fetchUserThresholds = async () => {
      setFetchingData(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:8000/api/thresholds/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const thresholds = response.data;

        console.log('thresholds: ', thresholds);

        // Determine level types based on min/max values
        const volumeLevelType = determineLevelType(
          thresholds[0].volume_min,
          thresholds[0].volume_max,
          'Volume'
        );

        const pitchLevelType = determineLevelType(
          thresholds[0].pitch_min,
          thresholds[0].pitch_max,
          'Pitch'
        );

        const speedLevelType = determineLevelType(
          thresholds[0].speed_min,
          thresholds[0].speed_max,
          'Speed'
        );

        // Determine fluctuation types
        const volumeFluctuationType = determineFluctuationType(
          thresholds[0].volume_fluctuation_max,
          'Volume'
        );

        // For pitch, we'll use the max value to determine type
        const pitchFluctuationType = determineFluctuationType(
          thresholds[0].pitch_fluctuation_max,
          'Pitch'
        );

        const speedFluctuationType = determineFluctuationType(
          thresholds[0].speed_fluctuation_max,
          'Speed'
        );

        // Update the data state with fetched values
        setData([
          {
            key: '1',
            metric: 'Volume',
            levelType: volumeLevelType,
            fluctuationType: volumeFluctuationType
          },
          {
            key: '2',
            metric: 'Pitch',
            levelType: pitchLevelType,
            fluctuationType: pitchFluctuationType
          },
          {
            key: '3',
            metric: 'Speed',
            levelType: speedLevelType,
            fluctuationType: speedFluctuationType
          }
        ]);
      } catch (error) {
        console.error('Error fetching user thresholds:', error);
        message.error('Failed to load user thresholds. Using default values.');
        // Keep the default values
      } finally {
        setFetchingData(false);
      }
    };

    fetchUserThresholds();
  }, [patientId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (readOnly) {
        throw new Error('Read-only mode - changes not allowed');
      }

      // Get the metric data
      const volumeData = data.find((item) => item.metric === 'Volume');
      const pitchData = data.find((item) => item.metric === 'Pitch');
      const speedData = data.find((item) => item.metric === 'Speed');

      // Prepare the payload based on selected ranges
      const volumeRange = parseRange(metricRanges.Volume.levelOptions[volumeData.levelType]);
      const pitchRange = parseRange(metricRanges.Pitch.levelOptions[pitchData.levelType]);
      const speedRange = parseRange(metricRanges.Speed.levelOptions[speedData.levelType]);

      // Get the separate fluctuation thresholds
      const volumeFluctuation = volumeFluctuationLimits[volumeData.fluctuationType];
      const pitchFluctuation = pitchFluctuationRanges[pitchData.fluctuationType];
      const speedFluctuationMax = speedFluctuationLimits[speedData.fluctuationType];

      const payload = {
        // Level thresholds
        volume_min: volumeRange.min,
        volume_max: volumeRange.max,
        pitch_min: pitchRange.min,
        pitch_max: pitchRange.max,
        speed_min: speedRange.min,
        speed_max: speedRange.max,

        // Separate fluctuation thresholds
        volume_fluctuation_max: volumeFluctuation,
        pitch_fluctuation_min: pitchFluctuation.min,
        pitch_fluctuation_max: pitchFluctuation.max,
        speed_fluctuation_max: speedFluctuationMax
      };

      console.log('payload: ', payload);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8000/api/thresholds/${patientId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success('Target ranges and fluctuation thresholds saved successfully!');
    } catch (error) {
      console.error('Error:', error);
      if (error.message === 'Read-only mode - changes not allowed') {
        message.error("You don't have permission to modify these settings.");
      } else {
        message.error('Failed to save target ranges. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value, recordKey, field) => {
    const updatedData = data.map((item) => {
      if (item.key === recordKey) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setData(updatedData);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'metric',
      key: 'metric',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Level',
      dataIndex: 'levelType',
      key: 'level',
      render: (text, record) => (
        <div>
          <Select
            value={record.levelType}
            onChange={(value) => handleChange(value, record.key, 'levelType')}
            style={{ width: 120, marginRight: 8 }}
            disabled={readOnly}
          >
            <Option value="Narrow">Narrow</Option>
            <Option value="Moderate">Moderate</Option>
            <Option value="Wide">Wide</Option>
          </Select>
          <span style={{ marginLeft: 8, color: '#666' }}>
            {metricRanges[record.metric].levelOptions[record.levelType]}
          </span>
        </div>
      )
    },
    {
      title: 'Fluctuation',
      dataIndex: 'fluctuationType',
      key: 'fluctuation',
      render: (text, record) => (
        <div>
          <Select
            value={record.fluctuationType}
            onChange={(value) => handleChange(value, record.key, 'fluctuationType')}
            style={{ width: 120, marginRight: 8 }}
            disabled={readOnly}
          >
            <Option value="Narrow">Narrow</Option>
            <Option value="Moderate">Moderate</Option>
            <Option value="Wide">Wide</Option>
          </Select>
          <span style={{ marginLeft: 8, color: '#666' }}>
            {metricRanges[record.metric].fluctuationOptions[record.fluctuationType]}
            {record.metric === 'Volume'}
            {record.metric === 'Pitch'}
            {record.metric === 'Speed'}
          </span>
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: 20 }}>
      {fetchingData ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="large" />
          <p>Loading user thresholds...</p>
        </div>
      ) : (
        <>
          <Table columns={columns} dataSource={data} pagination={false} bordered size="middle" />
          <Button
            type="primary"
            style={{ marginTop: 16 }}
            onClick={handleSave}
            loading={loading}
            disabled={readOnly}
          >
            Save Target Ranges
          </Button>
        </>
      )}
    </div>
  );
};

export default ThresholdTable;
