import React, { useState, useContext } from 'react';
import './studioUserInput.scss';
import { v4 as uuid } from 'uuid';
import FormInput from '../../FormInput';
import Checkbox from '../../checkbox/Checkbox';
import UserPermissions from '../userPermissions/UserPermissions';
import UserInputDisplay from './UserInputDisplay';
import { UserContext } from '../../../../UserContext';

function StudioUserInput({
  users, parentId, updateUserInput, removeUser, handleCheckboxChange,
}) {
  const { activeUser, handleSetActiveUser } = useContext(UserContext);

  // const [currentUser, setcurrentUser] = useState(activeUser || '');
  // console.log(activeUser);
  return (
    <div>
      {users && users.map((user) => (
        user.username !== activeUser.username && (
          <UserInputDisplay
            key={user.custom_id}
            user={user}
            updateUserInput={updateUserInput}
            removeUser={removeUser}
            handleCheckboxChange={handleCheckboxChange}
          />
        )
      ))}
    </div>
  );
}

export default StudioUserInput;
