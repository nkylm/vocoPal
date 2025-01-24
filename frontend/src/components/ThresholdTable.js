import React, { useState } from 'react';
import { Table, InputNumber, Button, Typography, message } from 'antd';
import axios from 'axios';

const { Title } = Typography;

const ThresholdTable = () => {
  const [data, setData] = useState([
    { key: '1', metric: 'Volume', level: 50, fluctuation: 10 },
    { key: '2', metric: 'Pitch', level: 150, fluctuation: 20 },
    { key: '3', metric: 'Speed', level: 3, fluctuation: 0.5 },
  ]);

  const [loading, setLoading] = useState(false);

  // Update the data dynamically
  const handleInputChange = (value, recordKey, field) => {
    const updatedData = data.map((item) => {
      if (item.key === recordKey) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setData(updatedData);
  };

  // Save the processed data
  const handleSave = async () => {
    setLoading(true);

    try {
      // Prepare the data for the API call
      const payload = data.map((item) => ({
        metric: item.metric,
        min: item.level - item.fluctuation,
        max: item.level + item.fluctuation,
      }));

      console.log(payload)

      // Replace this user ID with the actual user ID from your application
      const userId = '63e11d23f5a2b0f4e89e4b9c'; 

      // Make the API call
      const response = await axios.post('http://localhost:8000/api/thresholds/', {
        user_id: userId,
        volume_min: payload[0].min,
        volume_max: payload[0].max,
        pitch_min: payload[1].min,
        pitch_max: payload[1].max,
        speed_min: payload[2].min,
        speed_max: payload[2].max,
      });

      console.log('Thresholds saved:', response.data);
      message.success('Target ranges saved successfully!');
    } catch (error) {
      console.error('Error saving thresholds:', error.message);
      message.error('Failed to save target ranges. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Metric',
      dataIndex: 'metric',
      key: 'metric',
      render: (text) => <strong>{text}</strong>, // Bold metric name
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      render: (text, record) => (
        <InputNumber
          min={0}
          value={record.level}
          onChange={(value) => handleInputChange(value, record.key, 'level')}
        />
      ),
    },
    {
      title: 'Fluctuation',
      dataIndex: 'fluctuation',
      key: 'fluctuation',
      render: (text, record) => (
        <InputNumber
          min={0}
          value={record.fluctuation}
          step={record.metric === 'Speed' ? 0.1 : 1}
          onChange={(value) => handleInputChange(value, record.key, 'fluctuation')}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Title level={3}>Set Target Ranges</Title>
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        bordered
        size="middle"
      />
      <Button
        type="primary"
        style={{ marginTop: 16 }}
        onClick={handleSave}
        loading={loading}
      >
        Save Target Ranges
      </Button>
    </div>
  );
};

export default ThresholdTable;
