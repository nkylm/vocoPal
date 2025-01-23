import React from 'react';
import { HomeOutlined, SettingOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

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
          icon: <HomeOutlined />,
        }
      ];
    }
    
    if (currentPath === '/settings') {
      return [
        {
          label: 'Settings',
          key: '/settings',
          icon: <SettingOutlined />,
        }
      ];
    }

    return []; // Return empty array for any other paths
  };

  const onClick = (e) => {
    navigate(e.key);
  };

  return (
    <Menu 
      onClick={onClick} 
      selectedKeys={[currentPath]}
      mode="horizontal" 
      items={getMenuItems()} 
    />
  );
};

export default TopNavBar;