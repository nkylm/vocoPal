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
import timezone from 'dayjs/plugin/timezone';
import { Radio, Dropdown } from 'antd';

// Extend dayjs with required plugins
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const GraphComponent = ({ speechData, selectedDate, granularity }) => {
  const [displayMode, setDisplayMode] = useState('inRange'); // 'inRange', 'aboveRange', 'belowRange'
  const [metricType, setMetricType] = useState('level'); // 'level', 'fluctuation'

  // Get browser's timezone
  const browserTimezone = dayjs.tz.guess();

  if (!selectedDate || speechData.length === 0) {
    return <p>Please select a date to view the graph.</p>;
  }

  const getDateLabels = () => {
    // Convert selectedDate to browser timezone
    const parsedDate = dayjs(selectedDate).tz(browserTimezone);
    let dates = [];

    switch (granularity) {
      case 'day':
        dates = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
        break;
      case 'week':
        dates = Array.from({ length: 7 }, (_, i) => parsedDate.add(i, 'day').format('ddd D'));
        break;
      case 'month':
        dates = Array.from({ length: parsedDate.daysInMonth() }, (_, i) => (i + 1).toString());
        break;
      case 'year':
        dates = Array.from({ length: 12 }, (_, i) => parsedDate.month(i).format('MMM'));
        break;
      default:
        dates = Array.from({ length: 7 }, (_, i) => parsedDate.add(i, 'day').format('D'));
    }
    return dates;
  };

  // Helper function to get target threshold ranges for metrics
  const getTargetThresholds = (metric) => {
    // Initialize with default values
    const defaultThresholds = {
      volume: { min: 40, max: 70, unit: 'dB' },
      pitch: { min: 100, max: 200, unit: 'Hz' },
      speed: { min: 3.5, max: 6.5, unit: 'syll/sec' },
      volume_fluctuation: { max: 15, unit: 'dB/s' },
      pitch_fluctuation: { min: 20, max: 150, unit: 'Hz/s' },
      speed_fluctuation: { max: 2, unit: 'syll/sec²' }
    };

    // If we have threshold data in the first entry, use it
    if (speechData.length > 0 && speechData[0].thresholds) {
      const thresholds = speechData[0].thresholds;
      return {
        volume: {
          min: thresholds.volume_min,
          max: thresholds.volume_max,
          unit: 'dB'
        },
        pitch: {
          min: thresholds.pitch_min,
          max: thresholds.pitch_max,
          unit: 'Hz'
        },
        speed: {
          min: thresholds.speed_min,
          max: thresholds.speed_max,
          unit: 'syll/sec'
        },
        volume_fluctuation: {
          max: thresholds.volume_fluctuation_max,
          unit: 'dB/s'
        },
        pitch_fluctuation: {
          min: thresholds.pitch_fluctuation_min,
          max: thresholds.pitch_fluctuation_max,
          unit: 'Hz/s'
        },
        speed_fluctuation: {
          max: thresholds.speed_fluctuation_max,
          unit: 'syll/sec²'
        }
      };
    }
    return defaultThresholds;
  };

  // Helper function to calculate percentages for each range type
  const calculatePercentages = (dateLabel, rangeType) => {
    const getDataForPeriod = () => {
      switch (granularity) {
        case 'day':
          return speechData.filter((entry) => {
            // Convert entry date to browser timezone and compare hours
            const entryDate = dayjs(entry.date_recorded).tz(browserTimezone);
            return entryDate.format('HH') === dateLabel;
          });
        case 'week':
          return speechData.filter((entry) => {
            const entryDate = dayjs(entry.date_recorded).tz(browserTimezone);
            return entryDate.format('ddd D') === dateLabel;
          });
        case 'month':
          return speechData.filter((entry) => {
            const entryDate = dayjs(entry.date_recorded).tz(browserTimezone);
            return entryDate.format('D') === dateLabel;
          });
        case 'year':
          return speechData.filter((entry) => {
            const entryDate = dayjs(entry.date_recorded).tz(browserTimezone);
            return entryDate.format('MMM') === dateLabel;
          });
        default:
          return speechData.filter((entry) => {
            const entryDate = dayjs(entry.date_recorded).tz(browserTimezone);
            return entryDate.format('D') === dateLabel;
          });
      }
    };

    const dataForPeriod = getDataForPeriod();

    if (dataForPeriod.length === 0) {
      return metricType === 'level'
        ? { volume: 0, pitch: 0, speed: 0 }
        : { volume_fluctuation: 0, pitch_fluctuation: 0, speed_fluctuation: 0 };
    }

    if (metricType === 'level') {
      // Handle level metrics (volume, pitch, speed)
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

      Object.keys(metrics).forEach((metric) => {
        const matchingEntries = dataForPeriod.filter((entry) =>
          getMetricStatus(entry.audio_notes, metric)
        ).length;
        metrics[metric] = (matchingEntries / dataForPeriod.length) * 100;
      });

      return metrics;
    } else {
      // Handle fluctuation metrics
      const getFluctuationStatus = (notes, metric) => {
        const stableNote = `stable-${metric}`;
        const unstableNote = `unstable-${metric}`;
        const specialNotes = {
          pitch: 'monotone' // Special case for pitch
        };

        if (rangeType === 'inRange') {
          return (
            notes.includes(stableNote) || (metric === 'pitch' && notes.includes(specialNotes.pitch))
          );
        }
        if (rangeType === 'aboveRange') return notes.includes(unstableNote);
        if (rangeType === 'belowRange') return false; // Not applicable for fluctuations
        return false;
      };

      const metrics = {
        volume_fluctuation: 0,
        pitch_fluctuation: 0,
        speed_fluctuation: 0
      };

      Object.keys(metrics).forEach((fullMetric) => {
        const metric = fullMetric.split('_')[0]; // Extract base metric name
        const matchingEntries = dataForPeriod.filter((entry) =>
          getFluctuationStatus(entry.audio_notes, metric)
        ).length;
        metrics[fullMetric] = (matchingEntries / dataForPeriod.length) * 100;
      });

      return metrics;
    }
  };

  const labels = getDateLabels();
  const percentages = labels.map((label) => calculatePercentages(label, displayMode));
  const thresholds = getTargetThresholds();

  // Generate tooltip titles based on metric type
  const generateTooltipLabel = (metric) => {
    if (metricType === 'level') {
      // Format for level metrics
      const ranges = {
        volume: `${thresholds.volume.min}-${thresholds.volume.max} ${thresholds.volume.unit}`,
        pitch: `${thresholds.pitch.min}-${thresholds.pitch.max} ${thresholds.pitch.unit}`,
        speed: `${thresholds.speed.min}-${thresholds.speed.max} ${thresholds.speed.unit}`
      };
      return ranges[metric];
    } else {
      // Format for fluctuation metrics
      const fluctName = `${metric}_fluctuation`;
      if (fluctName === 'pitch_fluctuation') {
        return `${thresholds.pitch_fluctuation.min}-${thresholds.pitch_fluctuation.max} ${thresholds.pitch_fluctuation.unit}`;
      } else {
        const fluctMetric = metric === 'volume' ? 'volume_fluctuation' : 'speed_fluctuation';
        return `Max: ${thresholds[fluctMetric].max} ${thresholds[fluctMetric].unit}`;
      }
    }
  };

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

  const titles = {
    inRange: 'Percentage in Target Range',
    aboveRange: 'Percentage Above Target Range',
    belowRange: 'Percentage Below Target Range'
  };

  const dropdownItems = [
    {
      key: 'inRange',
      label: 'Percentage in Target Range'
    },
    {
      key: 'aboveRange',
      label: 'Percentage Above Target Range'
    },
    {
      key: 'belowRange',
      label: 'Percentage Below Target Range'
    }
  ];

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
            },
            tooltip: {
              callbacks: {
                title: function (context) {
                  return context[0].label;
                },
                label: function (context) {
                  let label = context.dataset.label || '';

                  if (label) {
                    const baseMetric = label.split(' ')[0].toLowerCase();
                    label += `: ${context.parsed.y.toFixed(1)}%`;

                    // Add target threshold information
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
  selectedDate: PropTypes.string,
  granularity: PropTypes.oneOf(['day', 'week', 'month', 'year']).isRequired
};

export default GraphComponent;
