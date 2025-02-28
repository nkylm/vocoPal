import React, { useState } from 'react';
import { HomeOutlined, SettingOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Menu, Button } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';
import ShareModal from './ShareModal';

const TopNavBar = ({ onShareSuccess }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [shareModalVisible, setShareModalVisible] = useState(false);

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
    <div className="top-navbar">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%'
        }}
      >
        <Menu
          onClick={onClick}
          selectedKeys={[currentPath]}
          mode="horizontal"
          items={getMenuItems()}
          style={{ flex: 1 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button
            type="primary"
            icon={<ShareAltOutlined />}
            onClick={() => setShareModalVisible(true)}
            className="share-button"
          >
            Share
          </Button>
          <ProfileDropdown />
        </div>
      </div>

      <ShareModal
        open={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        onSuccess={onShareSuccess}
      />
    </div>
  );
};

export default TopNavBar;
