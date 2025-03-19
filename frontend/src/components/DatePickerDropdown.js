import React, { useState } from 'react';
import { DatePicker, Select, Space } from 'antd';
import { CalendarOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const DatePickerDropdown = ({ onDateChange, value, granularity, onGranularityChange }) => {
  const [open, setOpen] = useState(false);

  const handleDateChange = (date) => {
    if (!date) return;

    // Convert the ISO date to dayjs and start of day to avoid timezone issues
    const startDate = dayjs(date).startOf('day');

    console.log('startDate: ', startDate);
    let endDate;
    let dateString;

    switch (granularity) {
      case 'day':
        endDate = startDate.clone().add(1, 'day');
        dateString = startDate.format('MMM D, YYYY');
        break;
      case 'week':
        endDate = startDate.clone().add(6, 'days');
        dateString = `${startDate.format('MMM D')} - ${endDate.format('MMM D, YYYY')}`;
        break;
      case 'month':
        endDate = startDate.clone().endOf('month');
        dateString = startDate.format('MMMM YYYY');
        break;
      case 'year':
        endDate = startDate.clone().endOf('year');
        dateString = startDate.format('YYYY');
        break;
      default:
        endDate = startDate.clone().add(6, 'days');
        dateString = `${startDate.format('MMM D')} - ${endDate.format('MMM D, YYYY')}`;
    }

    onDateChange(startDate, dateString, endDate);
    setOpen(false);
  };

  const handleNavigate = (direction) => {
    if (!value) return;

    const currentDate = dayjs(value);
    let newDate;

    switch (granularity) {
      case 'day':
        newDate =
          direction === 'forward' ? currentDate.add(1, 'day') : currentDate.subtract(1, 'day');
        break;
      case 'week':
        newDate =
          direction === 'forward' ? currentDate.add(7, 'days') : currentDate.subtract(7, 'days');
        break;
      case 'month':
        newDate =
          direction === 'forward' ? currentDate.add(1, 'month') : currentDate.subtract(1, 'month');
        break;
      case 'year':
        newDate =
          direction === 'forward' ? currentDate.add(1, 'year') : currentDate.subtract(1, 'year');
        break;
      default:
        newDate =
          direction === 'forward' ? currentDate.add(7, 'days') : currentDate.subtract(7, 'days');
    }

    handleDateChange(newDate);
  };

  // Get the formatted date range for display
  const getDisplayDateRange = () => {
    if (!value) return 'Select date';

    console.log('value: ', value);

    const startDate = dayjs(value);
    let endDate;

    switch (granularity) {
      case 'day':
        return startDate.format('MMM D, YYYY');
      case 'week':
        endDate = dayjs(value).add(6, 'days');
        return `${startDate.format('MMM D')} - ${endDate.format('MMM D, YYYY')}`;
      case 'month':
        return startDate.format('MMMM YYYY');
      case 'year':
        return startDate.format('YYYY');
      default:
        endDate = dayjs(value).add(6, 'days');
        return `${startDate.format('MMM D')} - ${endDate.format('MMM D, YYYY')}`;
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Space size="large">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarOutlined
            style={{ fontSize: '16px', cursor: 'pointer' }}
            onClick={() => setOpen(!open)}
          />
          <span style={{ color: '#666', minWidth: '200px' }}>{getDisplayDateRange()}</span>
          <div
            style={{
              display: 'flex',
              gap: '4px',
              background: '#f5f5f5',
              padding: '4px',
              borderRadius: '20px'
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: '50%',
                background: 'white',
                border: '1px solid #d9d9d9',
                transition: 'all 0.3s',
                ':hover': {
                  borderColor: '#1890ff',
                  color: '#1890ff'
                }
              }}
              onClick={() => value && handleNavigate('backward')}
            >
              <LeftOutlined
                style={{
                  fontSize: '12px',
                  color: value ? '#1890ff' : '#d9d9d9'
                }}
              />
            </div>
            <div
              style={{
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: '50%',
                background: 'white',
                border: '1px solid #d9d9d9',
                transition: 'all 0.3s',
                ':hover': {
                  borderColor: '#1890ff',
                  color: '#1890ff'
                }
              }}
              onClick={() => value && handleNavigate('forward')}
            >
              <RightOutlined
                style={{
                  fontSize: '12px',
                  color: value ? '#1890ff' : '#d9d9d9'
                }}
              />
            </div>
          </div>
          <DatePicker
            open={open}
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            onChange={handleDateChange}
            value={value ? dayjs(value) : null}
            onOpenChange={setOpen}
            picker={granularity === 'year' ? 'year' : granularity === 'month' ? 'month' : 'date'}
          />
        </div>
        <Select
          value={granularity}
          onChange={(value) => {
            onGranularityChange(value);
            setOpen(false);
          }}
          style={{ width: 120 }}
          options={[
            { value: 'day', label: 'Daily' },
            { value: 'week', label: 'Weekly' },
            { value: 'month', label: 'Monthly' },
            { value: 'year', label: 'Yearly' }
          ]}
        />
      </Space>
    </div>
  );
};

export default DatePickerDropdown;
