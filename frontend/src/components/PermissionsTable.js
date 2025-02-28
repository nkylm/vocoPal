import React, { useState, useEffect } from 'react';
import { Table, Space, Switch, Select, Avatar, Button, message } from 'antd';
import { CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import './PermissionsTable.css';

const { Option } = Select;

const PermissionsTable = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  // Fetch permissions data
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/access/shared-with', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Transform the data to match our table structure
      const transformedData = response.data.sharedWith.map((item, index) => ({
        key: item.userId._id,
        name: item.userId.name,
        initials: item.userId.initials,
        color: item.userId.avatarColor,
        analytics: item.analytics,
        recordings: item.recordings,
        accessLevel: item.accessLevel,
        relation: item.userId.relation,
        email: item.userId.email
      }));

      setPermissions(transformedData);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      message.error('Failed to load permissions data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  // Update permission
  const updatePermission = async (userId, field, value) => {
    try {
      const permission = permissions.find((p) => p.key === userId);
      if (!permission) return;

      const updatedData = {
        ...permission,
        [field]: value
      };

      await axios.put(
        `http://localhost:8000/api/access/permissions/${userId}`,
        {
          analytics: updatedData.analytics,
          recordings: updatedData.recordings,
          accessLevel: updatedData.accessLevel
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      message.success('Permission updated successfully');

      // Update local state
      setPermissions((prevPermissions) =>
        prevPermissions.map((p) => (p.key === userId ? { ...p, [field]: value } : p))
      );
    } catch (error) {
      console.error('Error updating permission:', error);
      message.error('Failed to update permission');
      // Revert optimistic update
      fetchPermissions();
    }
  };

  // Remove permission
  const removePermission = async (userId) => {
    try {
      await axios.delete(`http://localhost:8000/api/access/permissions/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Access removed successfully');

      // Remove from local state
      setPermissions((prevPermissions) => prevPermissions.filter((p) => p.key !== userId));
    } catch (error) {
      console.error('Error removing permission:', error);
      message.error('Failed to remove access');
    }
  };

  const handleAccessLevelChange = (value, key) => {
    updatePermission(key, 'accessLevel', value);
  };

  const handleSwitchChange = (field, key, checked) => {
    updatePermission(key, field, checked);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar style={{ backgroundColor: record.color }}>{record.initials}</Avatar>
          <span>
            {text}
            {record.relation && ` (${record.relation})`}
          </span>
        </Space>
      )
    },
    {
      title: 'Analytics',
      dataIndex: 'analytics',
      key: 'analytics',
      align: 'center',
      render: (checked, record) => (
        <Switch
          checkedChildren={<CheckOutlined />}
          checked={checked}
          onChange={(checked) => handleSwitchChange('analytics', record.key, checked)}
        />
      )
    },
    {
      title: 'Recordings',
      dataIndex: 'recordings',
      key: 'recordings',
      align: 'center',
      render: (checked, record) => (
        <Switch
          checkedChildren={<CheckOutlined />}
          checked={checked}
          onChange={(checked) => handleSwitchChange('recordings', record.key, checked)}
        />
      )
    },
    {
      title: 'Settings',
      dataIndex: 'accessLevel',
      key: 'accessLevel',
      render: (text, record) => (
        <Select
          value={text}
          style={{ width: 120 }}
          onChange={(value) => handleAccessLevelChange(value, record.key)}
        >
          <Option value="Can edit">Can edit</Option>
          <Option value="Can view">Can view</Option>
          <Option value="No access">No access</Option>
        </Select>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removePermission(record.key)}
        />
      )
    }
  ];

  return (
    <div className="permissions-container">
      <Table
        dataSource={permissions}
        columns={columns}
        pagination={false}
        loading={loading}
        className="permissions-table"
      />
    </div>
  );
};

export default PermissionsTable;
