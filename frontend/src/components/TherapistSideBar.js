import React from 'react';
import { Layout, Typography, Button, Avatar, Badge } from 'antd';
import vocalpalLogo from '../util/vocopalLogo.svg';

const { Sider } = Layout;
const { Title } = Typography;

const TherapistSideBar = ({ patients, pendingRequests, selectedPatient, onPatientSelect, onRespondToRequest }) => {
  const acceptedPatients = patients?.filter(p => p.status === 'accepted');
  
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
        <div style={{ marginBottom: '24px' }}>
          <img src={vocalpalLogo} alt="VocoPal" style={{ height: '32px' }} />
        </div>
        
        {/* Requests Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <Title level={5} style={{ margin: 0, color: '#666' }}>
              REQUESTS
            </Title>
            {pendingRequests?.length > 0 && (
              <Badge count={pendingRequests?.length} style={{ marginLeft: '8px' }} />
            )}
          </div>
          {pendingRequests?.map(request => (
            <div
              key={request.userId._id}
              style={{
                padding: '12px',
                backgroundColor: '#fff1f0',
                borderRadius: '8px',
                marginBottom: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <Avatar
                  style={{
                    backgroundColor: request.userId.avatarColor,
                    marginRight: '8px'
                  }}
                >
                  {request.userId.initials}
                </Avatar>
                <span>{request.userId.email}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  size="small"
                  onClick={() => onRespondToRequest(request.userId._id, 'declined')}
                >
                  Decline
                </Button>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => onRespondToRequest(request.userId._id, 'accepted')}
                >
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Patients Section */}
        <div>
          <Title level={5} style={{ margin: '0 0 16px', color: '#666' }}>
            PATIENTS
          </Title>
          {acceptedPatients?.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666' }}>
              No patients yet
            </div>
          ) : (
            acceptedPatients?.map(patient => (
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
                <span>{patient.userId.name}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </Sider>
  );
};

export default TherapistSideBar;
