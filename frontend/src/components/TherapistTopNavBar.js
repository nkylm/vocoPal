import React from 'react';
import { Layout, Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';

const { Header } = Layout;

const TherapistTopNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Header
      style={{
        background: '#fff',
        padding: '0 24px',
        height: '64px',
        lineHeight: '64px',
        borderBottom: '1px solid #f0f0f0'
      }}
    >
      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname === '/' ? 'dashboard' : 'settings']}
        style={{ border: 'none' }}
      >
        <Menu.Item key="dashboard" onClick={() => navigate('/')} style={{ margin: '0 24px' }}>
          Dashboard
        </Menu.Item>
        <Menu.Item
          key="settings"
          onClick={() => navigate('/settings')}
          style={{ margin: '0 24px' }}
        >
          Settings
        </Menu.Item>
      </Menu>
      <div style={{ padding: '0 16px' }}>
        <ProfileDropdown />
      </div>
    </Header>
  );
};

export default TherapistTopNavBar;
