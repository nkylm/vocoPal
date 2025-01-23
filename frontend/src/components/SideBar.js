import React from 'react';
import { HomeOutlined, SettingOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';

const items = [
  { key: '/', icon: <HomeOutlined />, label: 'Home', path: '/' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Settings', path: '/settings' },
];

const SideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const onClick = (e) => {
    const selectedItem = items.find((item) => item.key === e.key);
    if (selectedItem && selectedItem.path) {
      navigate(selectedItem.path);
    }
  };

  return (
    <Menu
      onClick={onClick}
      style={{
        width: 256,
        height: '100vh',
      }}
      selectedKeys={[location.pathname]}
      mode="inline"
      items={items.map(({ key, icon, label }) => ({ key, icon, label }))}
    />
  );
};

export default SideBar;