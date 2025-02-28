import React from 'react';
import { Layout, Typography, Button, Avatar } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import vocalpalLogo from '../util/vocopalLogo.svg';

const { Sider } = Layout;
const { Title } = Typography;

const TherapistSideBar = ({ patients, selectedPatient, onPatientSelect }) => {
  return (
    <Sider
      width={240}
      style={{
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0
      }}
    >
      <div style={{ padding: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}
        >
          <img src={vocalpalLogo} alt="VocoPal" style={{ height: '32px' }} />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}
        >
          <Title level={5} style={{ margin: 0, color: '#666' }}>
            PATIENTS
          </Title>
          <Button type="text" icon={<PlusOutlined />} style={{ border: 'none', padding: '4px' }} />
        </div>
      </div>
      <div style={{ padding: '0 8px' }}>
        {patients?.map((patient) => (
          <div
            key={patient.userId._id}
            onClick={() => onPatientSelect(patient.userId._id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 8px',
              cursor: 'pointer',
              borderRadius: '8px',
              backgroundColor: selectedPatient === patient.userId._id ? '#f0f0f0' : 'transparent',
              marginBottom: '4px'
            }}
          >
            <Avatar
              style={{
                backgroundColor: patient.userId.avatarColor,
                marginRight: '12px'
              }}
            >
              {patient.userId.initials}
            </Avatar>
            <span style={{ color: '#333' }}>{patient.userId.name}</span>
          </div>
        ))}
      </div>
    </Sider>
  );
};

export default TherapistSideBar;
