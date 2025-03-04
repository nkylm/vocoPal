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
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between' // Pushes elements to edges
      }}
    >
      {/* Left side: Menu */}
      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname === '/' ? 'dashboard' : 'settings']}
        style={{ border: 'none', flex: 1 }}
      >
        <Menu.Item key="dashboard" onClick={() => navigate('/')}>
          Dashboard
        </Menu.Item>
        <Menu.Item key="settings" onClick={() => navigate('/settings')}>
          Settings
        </Menu.Item>
      </Menu>

      {/* Right side: Profile Dropdown */}
      <div style={{ marginLeft: 'auto', paddingRight: '16px' }}>
        <ProfileDropdown />
      </div>
    </Header>
  );
};

export default TherapistTopNavBar;
