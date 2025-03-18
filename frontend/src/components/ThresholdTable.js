import React, { useState } from 'react';
import { Table, Select, Button, Typography, message } from 'antd';
import axios from 'axios';

const { Title } = Typography;
const { Option } = Select;

const ThresholdTable = ({ patientId, readOnly }) => {
  // Predefined ranges for each metric
  const metricRanges = {
    Volume: {
      level: '60-70 dB',
      levelOptions: {
        Narrow: '60-70 dB',
        Moderate: '55-75 dB',
        Wide: '50-80 dB'
      },
      fluctuationOptions: {
        Narrow: '± 6 dB',
        Moderate: '± 10 dB',
        Wide: '± 15 dB'
      }
    },
    Pitch: {
      level: '85-155 Hz',
      levelOptions: {
        Narrow: '85-155 Hz',
        Moderate: '75-165 Hz',
        Wide: '65-175 Hz'
      },
      fluctuationOptions: {
        Narrow: '± 20 Hz',
        Moderate: '± 35 Hz',
        Wide: '± 50 Hz'
      }
    },
    Speed: {
      level: '4-5 syll/sec',
      levelOptions: {
        Narrow: '4-5 syll/sec',
        Moderate: '3-6 syll/sec',
        Wide: '2-7 syll/sec'
      },
      fluctuationOptions: {
        Narrow: '± 3 syll/sec',
        Moderate: '± 4 syll/sec',
        Wide: '± 5 syll/sec'
      }
    }
  };

  const volumeFluctuationLimits = {
    Narrow: 6,
    Moderate: 10,
    Wide: 15
  };

  // Define specific fluctuation ranges for pitch (these would be your actual values)
  const pitchFluctuationRanges = {
    Narrow: { min: 5, max: 15 },
    Moderate: { min: 10, max: 30 },
    Wide: { min: 20, max: 50 }
  };

  // Define specific fluctuation upper limits for speed
  const speedFluctuationLimits = {
    Narrow: 2,
    Moderate: 4,
    Wide: 6
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

  const handleSave = async () => {

    setLoading(true);
    try {
      if (readOnly) {
        throw new Error('Read-only mode - changes not allowed');
      }

      // Get the pitch and speed fluctuation types from data
      const volumeFluctuationType = data.find(item => item.metric === 'Volume').fluctuationType;
      const pitchFluctuationType = data.find(item => item.metric === 'Pitch').fluctuationType;
      const speedFluctuationType = data.find(item => item.metric === 'Speed').fluctuationType;
      
      // Prepare the payload based on selected ranges
      const volumeRange = parseRange(metricRanges.Volume.levelOptions[data[0].levelType]);
      const pitchRange = parseRange(metricRanges.Pitch.levelOptions[data[1].levelType]);
      const speedRange = parseRange(metricRanges.Speed.levelOptions[data[2].levelType]);
      
      // Get the separate fluctuation thresholds
      const volumeFluctuation = volumeFluctuationLimits[volumeFluctuationType];
      const pitchFluctuation = pitchFluctuationRanges[pitchFluctuationType];
      const speedFluctuationMax = speedFluctuationLimits[speedFluctuationType];

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
        speed_fluctuation_max: speedFluctuationMax,
      };

      console.log('payload: ', payload)

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
            {record.metric === 'Volume' && 
              ` (Max: ${volumeFluctuationLimits[record.fluctuationType]} db)`}
            {record.metric === 'Pitch' && pitchFluctuationRanges[record.fluctuationType] && 
              ` (${pitchFluctuationRanges[record.fluctuationType].min}-${pitchFluctuationRanges[record.fluctuationType].max} Hz)`}
            {record.metric === 'Speed' && 
              ` (Max: ${speedFluctuationLimits[record.fluctuationType]} syll/sec)`}
          </span>
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: 20 }}>
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
    </div>
  );
};

export default ThresholdTable;