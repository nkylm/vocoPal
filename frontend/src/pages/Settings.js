import React from 'react';
import SideBar from "../components/SideBar";
import TopNavBar from "../components/TopNavBar";
import './Dashboard.css';

const Settings = () => {
  return (
    <div className="dashboard-layout">
      <SideBar />
      <div className="right-content">
        <TopNavBar />
        <div className="content">
          <h1>Welcome to the Settings</h1>
          <p>This is where your main content will go.</p>
          <p>Scroll to see how the layout adjusts dynamically.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;