import React from 'react';
import { HomeOutlined, SettingOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';

const TopNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // Define menu items based on current path
  const getMenuItems = () => {
    if (currentPath === '/') {
      return [
        {
          label: 'Home',
          key: '/',
          icon: <HomeOutlined />
        }
      ];
    }

    if (currentPath === '/settings') {
      return [
        {
          label: 'Settings',
          key: '/settings',
          icon: <SettingOutlined />
        }
      ];
    }

    return []; // Return empty array for any other paths
  };

  const onClick = (e) => {
    navigate(e.key);
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#fff',
        borderBottom: '1px solid #f0f0f0'
      }}
    >
      <Menu
        onClick={onClick}
        selectedKeys={[currentPath]}
        mode="horizontal"
        items={getMenuItems()}
        style={{ flex: 1 }}
      />
      <div style={{ padding: '0 16px' }}>
        <ProfileDropdown />
      </div>
    </div>
  );
};

export default TopNavBar;
