import React from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(advancedFormat);

const DatePickerDropdown = ({ onDateChange }) => {
  return (
    <div>
      <DatePicker
        onChange={onDateChange}
        format={(value) => value.format('MMMM Do, YYYY')}
        placeholder="Select a date"
      />
    </div>
  );
};

export default DatePickerDropdown;
