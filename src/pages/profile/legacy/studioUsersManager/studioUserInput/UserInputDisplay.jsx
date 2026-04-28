import React, { useEffect, useState } from 'react';
import './studioUserInput.scss';
import { v4 as uuid } from 'uuid';
import FormInput from '../../FormInput';
import Checkbox from '../../checkbox/Checkbox';
import UserPermissions from '../userPermissions/UserPermissions';
import StudioUserInput from './StudioUserInput';

function UserInputDisplay({
  user, updateUserInput, removeUser, handleCheckboxChange,
}) {
  const [permissionsState, setPermissionsState] = useState('closed');
  const [arrowState, setArrowState] = useState('rotateX(0deg)');

  function toggleUserInformationView() {
    setPermissionsState((prevState) => (prevState === 'closed' ? 'open' : 'closed'));
    setArrowState((prevState) => (prevState === 'rotateX(0deg)' ? 'rotateX(180deg)' : 'rotateX(0deg)'));
  }

  useEffect(() => {
    if (user && user.password) {
      user.password = '';
    }
  }, []);

  return (
    <div key={user.custom_id} className="user-container">
      <div className="buttons-container">
        <button
          type="button"
          onClick={toggleUserInformationView}
          className="toggle-preview-btn"
        >
          <img
            className="toggle-preview-icon"
            style={{ transform: `${arrowState}` }}
            src="/icons/angle-down-solid.svg"
            alt="Toggle preview"
          />
          <h3>
            {user.username}
          </h3>
        </button>
        <button
          className="remove-user-button"
          onClick={(e) => removeUser(e)}
          type="button"
          data-custom-id={user.custom_id}
        >
          DELETE
        </button>
      </div>
      {permissionsState === 'open' && (
        <div>
          <div className="password-username-inputs-container">
            <FormInput
              label="Username"
              id={uuid()}
              name="username"
              type="text"
              customId={user.custom_id}
              placeholder="Username"
              onChange={updateUserInput}
              text={user.username}
              required
              borderBottom="2px solid var(--borders)"
              labelColor={{ color: 'var(--text-grayed)' }}
            />
            <FormInput
              label="Password"
              id={uuid()}
              name="password"
              type="text"
              customId={user.custom_id}
              placeholder="Password"
              onChange={updateUserInput}
              text={user.password}
              required
              borderBottom="2px solid var(--borders)"
              labelColor={{ color: 'var(--text-grayed)' }}
            />
          </div>
          <UserPermissions
            user={user}
            handleCheckboxChange={handleCheckboxChange}
          />
        </div>
      )}
    </div>
  );
}

export default UserInputDisplay;
