import React, { useContext } from 'react';
import { Dropdown, Avatar } from 'antd';
import { UserOutlined, PlusOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../util/AuthContext';

const ProfileDropdown = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Get initials from first and last name with null checks
  const getInitials = (name) => {
    if (!name) return '';

    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name[0] ? name[0].toUpperCase() : '';
  };

  // If user is null or user.name is undefined, don't render the dropdown
  if (!user || !user.name) {
    return null;
  }

  const initials = getInitials(user.name);

  const menuItems = [
    {
      key: 'user-info',
      label: (
        <div style={{ padding: '8px 16px' }}>
          <div style={{ fontWeight: 500 }}>{user.name}</div>
          <div style={{ fontSize: '14px', color: '#666' }}>{user.email}</div>
        </div>
      )
    },
    {
      type: 'divider'
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile')
    },
    {
      key: 'add-account',
      label: 'Add account',
      icon: <PlusOutlined />,
      onClick: () => navigate('/add-account')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: 'Log out',
      icon: <LogoutOutlined />,
      onClick: () => {
        logout();
      }
    }
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="bottomRight"
        arrow={{
          pointAtCenter: true
        }}
      >
        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Avatar
            style={{
              backgroundColor: '#F6E05E',
              color: '#000',
              cursor: 'pointer'
            }}
            size={32}
          >
            {initials}
          </Avatar>
        </div>
      </Dropdown>
    </div>
  );
};

export default ProfileDropdown;
