import React from 'react';
import { HomeOutlined, SettingOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import vocalpalLogo from '../util/vocopalLogo.svg';
import './SideBar.css';

const items = [
  { key: '/', icon: <HomeOutlined />, label: 'Home', path: '/' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Settings', path: '/settings' }
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
    <div className="sidebar">
      <div
        style={{
          padding: '10px',
          display: 'flex',
          justifyContent: 'left',
          backgroundColor: '#ffffff' // Add this line
        }}
      >
        <img src={vocalpalLogo} alt="VocoPal" style={{ height: '32px' }} />
      </div>
      <Menu
        onClick={onClick}
        style={{
          width: '100%',
          flex: 1,
          border: 'none',
          backgroundColor: '#ffffff' // Add this line
        }}
        selectedKeys={[location.pathname]}
        mode="inline"
        items={items.map(({ key, icon, label }) => ({ key, icon, label }))}
      />
    </div>
  );
};

export default SideBar;
