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
import utc from 'dayjs/plugin/utc';
import { Radio, Dropdown } from 'antd';

// Extend dayjs with required plugins
dayjs.extend(customParseFormat);
dayjs.extend(utc);

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const GraphComponent = ({ speechData, selectedDate, thresholds, granularity }) => {
  const [displayMode, setDisplayMode] = useState('inRange'); // 'inRange', 'aboveRange', 'belowRange'
  const [metricType, setMetricType] = useState('level'); // 'level', 'fluctuation'

  if (!selectedDate || !thresholds) {
    return <p>Please select a date to view the graph.</p>;
  }

  // Generate date labels based on granularity
  const getDateLabels = () => {
    const parsedDate = dayjs(selectedDate);

    switch (granularity) {
      case 'day':
        // Generate hours with AM/PM format for better readability
        return Array.from({ length: 24 }, (_, i) => {
          const hour = i;
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
          return `${displayHour}${ampm}`;
        });
      case 'week':
        return Array.from({ length: 7 }, (_, i) => parsedDate.add(i, 'day').format('ddd D'));
      case 'month':
        return Array.from({ length: parsedDate.daysInMonth() }, (_, i) => (i + 1).toString());
      case 'year':
        return Array.from({ length: 12 }, (_, i) => parsedDate.month(i).format('MMM'));
      default:
        return Array.from({ length: 7 }, (_, i) => parsedDate.add(i, 'day').format('D'));
    }
  };

  // Calculate percentages for a specific date label
  const calculatePercentages = (dateLabel, rangeType) => {
    // Filter data for the specific label
    const dataForLabel = speechData.filter((entry) => {
      const entryDate = dayjs(entry.date_recorded);
      switch (granularity) {
        case 'day': {
          // Parse the hour from the label (e.g., "1AM" -> 1, "3PM" -> 15)
          const match = dateLabel.match(/(\d+)([AP]M)/);
          if (!match) return false;

          let hour = parseInt(match[1], 10);
          if (match[2] === 'PM' && hour < 12) hour += 12;
          if (match[2] === 'AM' && hour === 12) hour = 0;

          return entryDate.hour() === hour;
        }
        case 'week':
          return entryDate.format('ddd D') === dateLabel;
        case 'month':
          return entryDate.format('D') === dateLabel;
        case 'year':
          return entryDate.format('MMM') === dateLabel;
        default:
          return entryDate.format('D') === dateLabel;
      }
    });

    // If no data for this label, return zeros
    if (dataForLabel.length === 0) {
      return metricType === 'level'
        ? { volume: 0, pitch: 0, speed: 0 }
        : { volume_fluctuation: 0, pitch_fluctuation: 0, speed_fluctuation: 0 };
    }

    if (metricType === 'level') {
      // Calculate level metrics
      const metrics = {
        volume: 0,
        pitch: 0,
        speed: 0
      };

      // Calculate percentage for each metric
      Object.keys(metrics).forEach((metric) => {
        const matchingEntries = dataForLabel.filter((entry) => {
          const value = entry.metrics[metric];
          const min = entry.thresholds[`${metric}_min`];
          const max = entry.thresholds[`${metric}_max`];

          if (rangeType === 'inRange') {
            return value >= min && value <= max;
          } else if (rangeType === 'aboveRange') {
            return value > max;
          } else if (rangeType === 'belowRange') {
            return value < min;
          }
          return false;
        }).length;

        metrics[metric] = (matchingEntries / dataForLabel.length) * 100;
      });

      return metrics;
    } else {
      // Calculate fluctuation metrics
      const metrics = {
        volume_fluctuation: 0,
        pitch_fluctuation: 0,
        speed_fluctuation: 0
      };

      // Calculate percentage for each fluctuation metric
      Object.keys(metrics).forEach((fullMetric) => {
        const baseMetric = fullMetric.split('_')[0]; // Extract base metric name
        const matchingEntries = dataForLabel.filter((entry) => {
          const value =
            entry.metrics[fullMetric] || entry.metrics[`${baseMetric}_fluctuation`] || 0;

          if (rangeType === 'inRange') {
            if (fullMetric === 'pitch_fluctuation') {
              const min = entry.thresholds.pitch_fluctuation_min;
              const max = entry.thresholds.pitch_fluctuation_max;
              return value >= min && value <= max;
            } else {
              const max = entry.thresholds[`${baseMetric}_fluctuation_max`];
              return value <= max;
            }
          } else if (rangeType === 'aboveRange') {
            if (fullMetric === 'pitch_fluctuation') {
              const max = entry.thresholds.pitch_fluctuation_max;
              return value > max;
            } else {
              const max = entry.thresholds[`${baseMetric}_fluctuation_max`];
              return value > max;
            }
          } else if (rangeType === 'belowRange') {
            // Only applicable to pitch (monotone)
            if (fullMetric === 'pitch_fluctuation') {
              const min = entry.thresholds.pitch_fluctuation_min;
              return value < min;
            }
            return false;
          }
          return false;
        }).length;

        metrics[fullMetric] = (matchingEntries / dataForLabel.length) * 100;
      });

      return metrics;
    }
  };

  // Generate tooltip labels
  const generateTooltipLabel = (metric) => {
    if (metricType === 'level') {
      return `${thresholds[`${metric}_min`]}-${thresholds[`${metric}_max`]} ${metric === 'volume' ? 'dB' : metric === 'pitch' ? 'Hz' : 'syll/sec'}`;
    } else {
      // Format for fluctuation metrics
      const fluctName = `${metric}_fluctuation`;
      if (fluctName === 'pitch_fluctuation') {
        return `${thresholds.pitch_fluctuation_min}-${thresholds.pitch_fluctuation_max} Hz`;
      } else {
        const fluctMetric = metric === 'volume' ? 'volume_fluctuation' : 'speed_fluctuation';
        return `Max: ${thresholds[`${fluctMetric}_max`]} ${metric === 'volume' ? 'dB' : 'syll/sec'}`;
      }
    }
  };

  // Prepare data for chart
  const labels = getDateLabels();
  const percentages = labels.map((label) => calculatePercentages(label, displayMode));

  // Prepare chart data
  const chartData = {
    labels: labels,
    datasets:
      metricType === 'level'
        ? [
            {
              label: 'Volume',
              data: percentages.map((p) => p.volume),
              borderColor: '#36A2EB',
              backgroundColor: '#36A2EB',
              tension: 0.4
            },
            {
              label: 'Pitch',
              data: percentages.map((p) => p.pitch),
              borderColor: '#FF9F40',
              backgroundColor: '#FF9F40',
              tension: 0.4
            },
            {
              label: 'Speed',
              data: percentages.map((p) => p.speed),
              borderColor: '#4BC0C0',
              backgroundColor: '#4BC0C0',
              tension: 0.4
            }
          ]
        : [
            {
              label: 'Volume Fluctuation',
              data: percentages.map((p) => p.volume_fluctuation),
              borderColor: '#36A2EB',
              backgroundColor: '#36A2EB',
              tension: 0.4
            },
            {
              label: 'Pitch Fluctuation',
              data: percentages.map((p) => p.pitch_fluctuation),
              borderColor: '#FF9F40',
              backgroundColor: '#FF9F40',
              tension: 0.4
            },
            {
              label: 'Speed Fluctuation',
              data: percentages.map((p) => p.speed_fluctuation),
              borderColor: '#4BC0C0',
              backgroundColor: '#4BC0C0',
              tension: 0.4
            }
          ]
  };

  // Display mode titles
  const titles = {
    inRange: 'Percentage in Target Range',
    aboveRange: 'Percentage Above Target Range',
    belowRange: 'Percentage Below Target Range'
  };

  // Dropdown menu items
  const dropdownItems = [
    { key: 'inRange', label: 'Percentage in Target Range' },
    { key: 'aboveRange', label: 'Percentage Above Target Range' },
    { key: 'belowRange', label: 'Percentage Below Target Range' }
  ];

  // Configure x-axis title based on granularity
  const getXAxisTitle = () => {
    switch (granularity) {
      case 'day':
        return 'Hour';
      case 'week':
        return 'Day';
      case 'month':
        return 'Date';
      case 'year':
        return 'Month';
      default:
        return 'Date';
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <h2>
          <Dropdown
            menu={{
              items: dropdownItems,
              onClick: (e) => setDisplayMode(e.key)
            }}
            trigger={['click']}
          >
            <a
              onClick={(e) => e.preventDefault()}
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              {titles[displayMode]} <span style={{ fontSize: '0.8em' }}>▼</span>
            </a>
          </Dropdown>
        </h2>
        <Radio.Group
          value={metricType}
          onChange={(e) => setMetricType(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="level">Level</Radio.Button>
          <Radio.Button value="fluctuation">Fluctuation</Radio.Button>
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
                text: getXAxisTitle()
              },
              ticks: {
                // Adjust x-axis tick rendering for better readability
                maxRotation: granularity === 'day' ? 0 : 45,
                autoSkip: true,
                maxTicksLimit: granularity === 'day' ? 12 : 20
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
            },
            tooltip: {
              callbacks: {
                title: function (context) {
                  // Customize tooltip title based on granularity
                  if (granularity === 'day') {
                    return `Time: ${context[0].label}`;
                  }
                  return context[0].label;
                },
                label: function (context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    const baseMetric = label.split(' ')[0].toLowerCase();
                    label += `: ${context.parsed.y.toFixed(1)}%`;
                    label += `\nTarget: ${generateTooltipLabel(baseMetric)}`;
                  }
                  return label;
                }
              }
            },
            title: {
              display: true,
              text: metricType === 'level' ? 'Voice Level Metrics' : 'Voice Fluctuation Metrics'
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
      metrics: PropTypes.shape({
        volume: PropTypes.number.isRequired,
        pitch: PropTypes.number.isRequired,
        speed: PropTypes.number.isRequired,
        pitch_fluctuation: PropTypes.number.isRequired,
        speed_fluctuation: PropTypes.number.isRequired
      }),
      thresholds: PropTypes.shape({
        volume_min: PropTypes.number.isRequired,
        volume_max: PropTypes.number.isRequired,
        pitch_min: PropTypes.number.isRequired,
        pitch_max: PropTypes.number.isRequired,
        speed_min: PropTypes.number.isRequired,
        speed_max: PropTypes.number.isRequired,
        volume_fluctuation_max: PropTypes.number.isRequired,
        pitch_fluctuation_min: PropTypes.number.isRequired,
        pitch_fluctuation_max: PropTypes.number.isRequired,
        speed_fluctuation_max: PropTypes.number.isRequired
      })
    })
  ).isRequired,
  thresholds: PropTypes.shape({
    volume_min: PropTypes.number.isRequired,
    volume_max: PropTypes.number.isRequired,
    pitch_min: PropTypes.number.isRequired,
    pitch_max: PropTypes.number.isRequired,
    speed_min: PropTypes.number.isRequired,
    speed_max: PropTypes.number.isRequired,
    volume_fluctuation_max: PropTypes.number.isRequired,
    pitch_fluctuation_min: PropTypes.number.isRequired,
    pitch_fluctuation_max: PropTypes.number.isRequired,
    speed_fluctuation_max: PropTypes.number.isRequired
  }),
  selectedDate: PropTypes.string,
  granularity: PropTypes.oneOf(['day', 'week', 'month', 'year']).isRequired
};

export default GraphComponent;
