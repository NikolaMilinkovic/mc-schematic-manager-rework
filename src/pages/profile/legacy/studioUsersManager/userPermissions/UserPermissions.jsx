import React, { useState } from 'react';
import Checkbox from '../../checkbox/Checkbox';
import './userPermissions.scss';

function UserPermissions({ user, updateUserInput, handleCheckboxChange }) {
  const [permissionsState, setPermissionsState] = useState('closed');
  const [arrowState, setArrowState] = useState('rotateX(0deg)');

  function togglePermissionsView() {
    setPermissionsState((prevState) => (prevState === 'closed' ? 'open' : 'closed'));
    setArrowState((prevState) => (prevState === 'rotateX(0deg)' ? 'rotateX(180deg)' : 'rotateX(0deg)'));
  }
  // function handleCheckboxChange() {

  // }

  return (
    <div className="permissions-section-container">
      <button
        type="button"
        onClick={togglePermissionsView}
        className="toggle-preview-btn"
      >
        <img
          className="toggle-preview-icon"
          style={{ transform: `${arrowState}` }}
          src="/icons/angle-down-solid.svg"
          alt="Toggle preview"
        />
        <h3>Permissions:</h3>
      </button>
      {permissionsState === 'open' && (
      <section className="permissions-section">
        {/* label, checked, customId, name, */}
        <div className="permissions-schematics-container">
          <h3>Schematics </h3>
          <Checkbox
            category="schematic"
            permission="get_schematic"
            handleCheckboxChange={(event, isChecked) => handleCheckboxChange(event, isChecked)}
            label="get_schematic:"
            checked={user.permissions.schematic.get_schematic}
            customId={user.custom_id}
          />
          <Checkbox
            category="schematic"
            permission="edit_schematic"
            handleCheckboxChange={(event, isChecked) => handleCheckboxChange(event, isChecked)}
            label="edit_schematic:"
            checked={user.permissions.schematic.edit_schematic}
            customId={user.custom_id}
          />
          <Checkbox
            category="schematic"
            permission="download_schematic"
            handleCheckboxChange={(event, isChecked) => handleCheckboxChange(event, isChecked)}
            label="download_schematic:"
            checked={user.permissions.schematic.download_schematic}
            customId={user.custom_id}
          />
          <Checkbox
            category="schematic"
            permission="remove_schematic"
            handleCheckboxChange={(event, isChecked) => handleCheckboxChange(event, isChecked)}
            label="remove_schematic:"
            checked={user.permissions.schematic.remove_schematic}
            customId={user.custom_id}
          />
        </div>
        <div className="permissions-collections-container">
          <h3>Collections</h3>
          <Checkbox
            category="collection"
            permission="add_collection"
            handleCheckboxChange={(event, isChecked) => handleCheckboxChange(event, isChecked)}
            label="add_collection:"
            checked={user.permissions.collection.add_collection}
            customId={user.custom_id}
          />
          <Checkbox
            category="collection"
            permission="remove_collection"
            handleCheckboxChange={(event, isChecked) => handleCheckboxChange(event, isChecked)}
            label="remove_collection:"
            checked={user.permissions.collection.remove_collection}
            customId={user.custom_id}
          />
          <Checkbox
            category="collection"
            permission="edit_collection"
            handleCheckboxChange={(event, isChecked) => handleCheckboxChange(event, isChecked)}
            label="edit_collection:"
            checked={user.permissions.collection.edit_collection}
            customId={user.custom_id}
          />
        </div>
        <div className="permissions-profile-container">
          <h3>Profile</h3>
          <Checkbox
            category="profile"
            permission="view_profile"
            handleCheckboxChange={(event, isChecked) => handleCheckboxChange(event, isChecked)}
            label="view_profile:"
            checked={user.permissions.profile.view_profile}
            customId={user.custom_id}
          />
          <Checkbox
            category="profile"
            permission="edit_profile"
            handleCheckboxChange={(event, isChecked) => handleCheckboxChange(event, isChecked)}
            label="edit_profile:"
            checked={user.permissions.profile.edit_profile}
            customId={user.custom_id}
          />
          <Checkbox
            category="profile"
            permission="studio_user_manager"
            handleCheckboxChange={(event, isChecked) => handleCheckboxChange(event, isChecked)}
            label="studio_user_manager:"
            checked={user.permissions.profile.studio_user_manager}
            customId={user.custom_id}
          />
          <Checkbox
            category="profile"
            permission="view_user_stats"
            handleCheckboxChange={(event, isChecked) => handleCheckboxChange(event, isChecked)}
            label="view_user_stats:"
            checked={user.permissions.profile.view_user_stats}
            customId={user.custom_id}
          />
        </div>
      </section>
      )}
    </div>
  );
}

export default UserPermissions;
