import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Radio } from 'antd';

// Extend dayjs with the customParseFormat plugin
dayjs.extend(customParseFormat);

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const GraphComponent = ({ speechData, selectedDate }) => {
  const [displayMode, setDisplayMode] = useState('inRange'); // 'inRange', 'aboveRange', 'belowRange'

  if (!selectedDate || speechData.length === 0) {
    return <p>Please select a date to view the graph.</p>;
  }

  const parsedDate = dayjs(selectedDate, 'MMMM Do, YYYY');
  const dates = Array.from({ length: 7 }, (_, i) => parsedDate.add(i, 'day').format('YYYY-MM-DD'));

  // Helper function to calculate percentages for each range type
  const calculatePercentages = (date, rangeType) => {
    const dataForDate = speechData.filter((entry) =>
      dayjs(entry.date_recorded).isSame(date, 'day')
    );

    if (dataForDate.length === 0) return { volume: 0, pitch: 0, speed: 0 };

    const getMetricStatus = (notes, metric) => {
      const normalNote = `normal-${metric}`;
      const aboveNotes = {
        volume: 'loud',
        pitch: 'high-pitch',
        speed: 'fast'
      };
      const belowNotes = {
        volume: 'quiet',
        pitch: 'low-pitch',
        speed: 'slow'
      };

      if (rangeType === 'inRange') return notes.includes(normalNote);
      if (rangeType === 'aboveRange') return notes.includes(aboveNotes[metric]);
      if (rangeType === 'belowRange') return notes.includes(belowNotes[metric]);
      return false;
    };

    const metrics = {
      volume: 0,
      pitch: 0,
      speed: 0
    };

    Object.keys(metrics).forEach(metric => {
      const matchingEntries = dataForDate.filter(entry => 
        getMetricStatus(entry.audio_notes, metric)
      ).length;
      metrics[metric] = (matchingEntries / dataForDate.length) * 100;
    });

    return metrics;
  };

  // Calculate percentages for all dates
  const percentages = dates.map(date => calculatePercentages(date, displayMode));

  // Prepare chart data
  const chartData = {
    labels: dates.map(date => dayjs(date).format('D')),
    datasets: [
      {
        label: 'Volume',
        data: percentages.map(p => p.volume),
        borderColor: '#36A2EB',
        backgroundColor: '#36A2EB',
        tension: 0.4
      },
      {
        label: 'Pitch',
        data: percentages.map(p => p.pitch),
        borderColor: '#FF9F40',
        backgroundColor: '#FF9F40',
        tension: 0.4
      },
      {
        label: 'Speed',
        data: percentages.map(p => p.speed),
        borderColor: '#4BC0C0',
        backgroundColor: '#4BC0C0',
        tension: 0.4
      }
    ]
  };

  const titles = {
    inRange: 'Percentage in Target Range',
    aboveRange: 'Percentage Above Target Range',
    belowRange: 'Percentage Below Target Range'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>{titles[displayMode]}</h2>
        <Radio.Group 
          value={displayMode} 
          onChange={(e) => setDisplayMode(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="inRange">Level</Radio.Button>
          <Radio.Button value="aboveRange">Above Range</Radio.Button>
          <Radio.Button value="belowRange">Below Range</Radio.Button>
        </Radio.Group>
      </div>
      <Line
        data={chartData}
        options={{
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            },
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Percentage (%)'
              }
            }
          },
          plugins: {
            legend: {
              position: 'top'
            }
          }
        }}
      />
    </div>
  );
};

GraphComponent.propTypes = {
  speechData: PropTypes.arrayOf(
    PropTypes.shape({
      date_recorded: PropTypes.string.isRequired,
      audio_notes: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ).isRequired,
  selectedDate: PropTypes.string
};

export default GraphComponent;
