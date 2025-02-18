import React, { useState } from 'react';
import SideBar from '../components/SideBar';
import TopNavBar from '../components/TopNavBar';
import './Dashboard.css';
import ThresholdTable from '../components/ThresholdTable';
import PermissionsTable from '../components/PermissionsTable';
import ShareModal from '../components/ShareModal';
import { Button } from 'antd';
import { ShareAltOutlined } from '@ant-design/icons';
import './Settings.css';

const Settings = () => {
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [permissionsKey, setPermissionsKey] = useState(0); // Used to force re-render of PermissionsTable

  const handleShareSuccess = () => {
    // Force re-render of PermissionsTable to show updated data
    setPermissionsKey((prevKey) => prevKey + 1);
  };

  return (
    <div className="dashboard-layout">
      <SideBar />
      <div className="right-content">
        <TopNavBar />
        <div className="content settings-content">
          <div className="settings-header">
            <h1>Settings</h1>
            <Button
              type="primary"
              icon={<ShareAltOutlined />}
              onClick={() => setShareModalVisible(true)}
              className="share-button"
            >
              Share
            </Button>
          </div>

          <PermissionsTable key={permissionsKey} />

          <h2 className="threshold-title">Target Range Tolerance</h2>
          <ThresholdTable />

          <ShareModal
            open={shareModalVisible}
            onClose={() => setShareModalVisible(false)}
            onSuccess={handleShareSuccess}
          />
        </div>
      </div>
    </div>
  );
};

export default Settings;
