import React, { useState, useEffect } from 'react';
import SideBar from "../components/SideBar";
import TopNavBar from "../components/TopNavBar";
import './Dashboard.css';
import DatePickerDropdown from '../components/DatePickerDropdown';
import Graph from '../components/Graph';
import dayjs from 'dayjs';
import axios from 'axios';

const Dashboard = () => {
  const [speechData, setSpeechData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [thresholds, setThresholds] = useState(null);

  const userId = '63e11d23f5a2b0f4e89e4b9c'; // Replace with actual user ID

  // Fetch thresholds on component mount
  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/thresholds/${userId}`);
        if (response.data && response.data.length) {
          const [threshold] = response.data; // Assuming one set of thresholds per user
          console.log('Thresholds: ', threshold)
          setThresholds({
            volume_min: threshold.volume_min,
            volume_max: threshold.volume_max,
            pitch_min: threshold.pitch_min,
            pitch_max: threshold.pitch_max,
            speed_min: threshold.speed_min,
            speed_max: threshold.speed_max,
          });
        }
      } catch (error) {
        console.error('Error fetching thresholds:', error.message);
      }
    };

    fetchThresholds();
  }, [userId]);

  // Fetch speech data when date changes
  const handleDateChange = async (date, dateString) => {
    if (!dateString) return;

    const formattedStartDate = dayjs(dateString, "MMMM Do, YYYY").format("YYYY-MM-DD");
    const formattedEndDate = dayjs(dateString, "MMMM Do, YYYY").add(7, 'day').format("YYYY-MM-DD");

    try {
      const response = await axios.get(`http://localhost:8000/api/speechData/${userId}`, {
        params: { startDate: formattedStartDate, endDate: formattedEndDate },
      });

      console.log('speechData response:', response)
      setSpeechData(response.data);
      setSelectedDate(dateString);
    } catch (error) {
      console.error('Error fetching speech data:', error.message);
      setSpeechData([]);
    }
  };
  return (
    <div className="dashboard-layout">
      <SideBar />
      <div className="right-content">
        <TopNavBar />
        <div className="content">
          <DatePickerDropdown onDateChange={handleDateChange} />
          {thresholds ? (
            <Graph
              speechData={speechData}
              selectedDate={selectedDate}
              thresholds={thresholds}
            />
          ) : (
            <p>Loading thresholds...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;



