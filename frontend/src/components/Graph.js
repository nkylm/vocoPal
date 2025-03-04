import React from 'react';
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

// Extend dayjs with the customParseFormat plugin
dayjs.extend(customParseFormat);

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const GraphComponent = ({ speechData, selectedDate, thresholds }) => {
  if (!selectedDate || speechData.length === 0) {
    return <p>Please select a date to view the graph.</p>;
  }
  console.log('speechData: ', speechData);
  console.log('thresholds: ', thresholds);
  console.log('selectedDate: ', selectedDate);

  const parsedDate = dayjs(selectedDate, 'MMMM Do, YYYY');

  const dates = Array.from({ length: 7 }, (_, i) => parsedDate.add(i, 'day').format('YYYY-MM-DD'));

  console.log('dates: ', dates);

  // Helper function to calculate percentages within range for a specific metric and date
  const calculatePercentageForMetric = (metric, date) => {
    console.log('date: ', date);
    const dataForDate = speechData.filter((entry) =>
      // console.log(entry)
      dayjs(entry.date_recorded).isSame(date, 'day')
    );

    if (dataForDate.length === 0) return 0;

    console.log('dataForDate: ', dataForDate);

    const withinRangeCount = dataForDate.filter(
      (entry) =>
        entry.metrics[metric] >= thresholds[`${metric}_min`] &&
        entry.metrics[metric] <= thresholds[`${metric}_max`]
    ).length;

    return (withinRangeCount / dataForDate.length) * 100;
  };

  // Calculate percentages for each metric over the week
  const metrics = ['volume', 'pitch', 'speed'];
  const percentages = metrics.map((metric) =>
    dates.map((date) => calculatePercentageForMetric(metric, date))
  );

  // Prepare chart data
  const chartData = {
    labels: dates.map((date) => dayjs(date).format('MMM D, YYYY')), // Format dates for the x-axis
    datasets: [
      {
        label: '% Volume Within Target Range',
        data: percentages[0], // Volume percentages
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderWidth: 2,
        fill: false
      },
      {
        label: '% Pitch Within Target Range',
        data: percentages[1], // Pitch percentages
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderWidth: 2,
        fill: false
      },
      {
        label: '% Speed Within Target Range',
        data: percentages[2], // Speed percentages
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        fill: false
      }
    ]
  };

  return (
    <div>
      <h2>Speech Metrics Analysis</h2>
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
                text: 'Percentage Within Target Range (%)'
              }
            }
          }
        }}
      />
    </div>
  );
};

export default GraphComponent;
