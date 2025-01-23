import React, { useState } from 'react';
import { DatePicker, Spin, List } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);

const DatePickerDropdown = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const handleDateChange = async (date, dateString) => {
    if (!dateString) return; // If no date selected, do nothing

    const formattedStartDate = dayjs(dateString, "MMMM Do, YYYY").format("YYYY-MM-DD");
    const formattedEndDate = dayjs(dateString, "MMMM Do, YYYY").add(7,'day').format("YYYY-MM-DD");

    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/speechData/63e11d23f5a2b0f4e89e4b9c', {
        params: { startDate: formattedStartDate, endDate: formattedEndDate }, // Send the date as a query param
      });
      console.log(formattedStartDate, formattedEndDate)
      console.log(response)
      setData(response.data); // Update the state with the retrieved data
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <DatePicker
        onChange={handleDateChange}
        format={(value) => value.format('MMMM Do, YYYY')} // Format display
        placeholder="Select a date"
      />
      {loading ? (
        <Spin tip="Loading data..." />
      ) : (
        <List
          dataSource={data}
          renderItem={(item) => <List.Item>{JSON.stringify(item)}</List.Item>}
        />
      )}
    </div>
  );
};

export default DatePickerDropdown;
