import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, Select } from 'antd';
import TherapistSideBar from '../components/TherapistSideBar';
import TherapistTopNavBar from '../components/TherapistTopNavBar';
import ThresholdTable from '../components/ThresholdTable';
import axios from 'axios';

const { Option } = Select;

const TherapistSettings = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/access/has-access-to', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(response.data.hasAccessTo || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: ['userId', 'name'],
      key: 'name',
      render: (text, record) => (
        <Space>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: record.userId.avatarColor }}
          >
            {record.userId.initials}
          </div>
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: 'Analytics Access',
      dataIndex: 'analytics',
      key: 'analytics',
      render: (hasAccess) => (
        <Tag color={hasAccess ? 'green' : 'red'}>{hasAccess ? 'Yes' : 'No'}</Tag>
      )
    },
    {
      title: 'Recordings Access',
      dataIndex: 'recordings',
      key: 'recordings',
      render: (hasAccess) => (
        <Tag color={hasAccess ? 'green' : 'red'}>{hasAccess ? 'Yes' : 'No'}</Tag>
      )
    },
    {
      title: 'Relation',
      dataIndex: ['userId', 'relation'],
      key: 'relation'
    },
    {
      title: 'Target Range Access',
      dataIndex: 'accessLevel',
      key: 'accessLevel',
      render: (level) => (
        <Tag color={level === 'Can edit' ? 'blue' : 'orange'}>
          {level === 'Can edit' ? 'Can Edit' : 'Can View'}
        </Tag>
      )
    }
  ];

  return (
    <div className="dashboard-layout">
      <TherapistSideBar />
      <div className="right-content">
        <TherapistTopNavBar />
        <div className="content settings-content">
          <div className="settings-header">
            <h1>Patient Access</h1>
          </div>

          <Table
            dataSource={patients}
            columns={columns}
            rowKey={(record) => record.userId._id}
            onRow={(record) => ({
              onClick: () => setSelectedPatient(record.userId._id)
            })}
          />

          {selectedPatient && (
            <>
              <h2 className="threshold-title mt-8">Target Range Tolerance</h2>
              <ThresholdTable
                patientId={selectedPatient}
                readOnly={
                  patients.find((p) => p.userId._id === selectedPatient)?.accessLevel !== 'Can edit'
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TherapistSettings;
