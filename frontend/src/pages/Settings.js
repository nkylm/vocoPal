import React from 'react';
import SideBar from "../components/SideBar";
import TopNavBar from "../components/TopNavBar";
import './Dashboard.css';
import ThresholdTable from '../components/ThresholdTable';

const Settings = () => {
  return (
    <div className="dashboard-layout">
      <SideBar />
      <div className="right-content">
        <TopNavBar />
        <div className="content">
          <h1>Settings</h1>
          <ThresholdTable />
        </div>
      </div>
    </div>
  );
};

export default Settings;