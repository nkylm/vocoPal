import React from 'react';
import SideBar from "../components/SideBar";
import TopNavBar from "../components/TopNavBar";
import './Dashboard.css';
import DatePickerDropdown from '../components/DatePickerDropdown';

const Dashboard = () => {
  return (
    <div className="dashboard-layout">
      <SideBar />
      <div className="right-content">
        <TopNavBar />
        <div className="content">
          <DatePickerDropdown />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;