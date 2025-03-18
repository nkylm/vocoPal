import React, { useState } from 'react';
import { Modal, Input, Checkbox, Switch, Button, message } from 'antd';
import axios from 'axios';
import './ShareModal.css';

const ShareModal = ({ open, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [isTherapist, setIsTherapist] = useState(true);
  const [accessRecordings, setAccessRecordings] = useState(true);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  const resetForm = () => {
    setEmail('');
    setIsTherapist(true);
    setAccessRecordings(true);
  };

  const handleShare = async () => {
    if (!email) {
      message.error('Please enter an email address');
      return;
    }

    try {
      setLoading(true);

      console.log('handleShare: ', email, isTherapist, accessRecordings);
      await axios.post(
        'http://localhost:8000/api/access/share',
        {
          email,
          recordings: accessRecordings,
          accessLevel: 'Can edit', // Default access level
          relation: isTherapist ? 'Speech Therapist' : undefined
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      message.success(`Successfully shared metrics with ${email}`);
      resetForm();

      // If a success callback was provided, call it
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Error sharing metrics:', error);

      if (error.response && error.response.status === 404) {
        message.error(`No user found with email ${email}`);
      } else if (error.response && error.response.status === 400) {
        message.error('Metrics already shared with this user');
      } else {
        message.error('Failed to share metrics. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Share"
      onCancel={() => {
        resetForm();
        onClose();
      }}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="share"
          type="primary"
          onClick={handleShare}
          className="share-button"
          loading={loading}
        >
          Share
        </Button>
      ]}
      width={600}
    >
      <div className="share-modal-content">
        <p>Share your speech metrics with your speech therapist and the people who support you.</p>

        <div className="email-input-container">
          <Input
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="therapist-checkbox">
          <Checkbox checked={isTherapist} onChange={(e) => setIsTherapist(e.target.checked)}>
            <span className="checkbox-text">This is my speech therapist</span>
          </Checkbox>
        </div>

        <div className="recordings-access">
          <div className="recordings-label">Access to recordings</div>
          <Switch checked={accessRecordings} onChange={setAccessRecordings} />
        </div>
      </div>
    </Modal>
  );
};

export default ShareModal;
