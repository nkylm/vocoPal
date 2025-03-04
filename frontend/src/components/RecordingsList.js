import React, { useEffect, useState } from 'react';
import { Card, List, Button, Spin } from 'antd';
import axios from 'axios';

const RecordingsList = ({ userId }) => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const token = localStorage.getItem('token'); // Get stored token
        const response = await axios.get(
          `http://localhost:8000/api/speechData/${userId}/recordings`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setRecordings(response.data);
        console.log(response.data);
      } catch (error) {
        console.error('Error fetching recordings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordings();
  }, [userId]);

  return (
    <div>
      {loading ? (
        <Spin tip="Loading recordings..." />
      ) : (
        <List
          grid={{ gutter: 16, column: 3 }}
          dataSource={recordings}
          renderItem={(recording) => (
            <List.Item>
              <Card
                title={new Date(recording.date_recorded).toLocaleString()}
                style={{ width: 300 }}
              >
                <video width="100%" controls>
                  <source src={recording.recording_url} type="audio/wav" />
                  Your browser does not support the audio tag.
                </video>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default RecordingsList;
