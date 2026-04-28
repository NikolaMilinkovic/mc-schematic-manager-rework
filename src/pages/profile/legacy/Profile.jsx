/* eslint-disable no-restricted-syntax */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, {
  useState, useEffect, useContext, useRef,
} from 'react';
import { v4 as uuid } from 'uuid';
import { useNavigate, Link } from 'react-router-dom';
import Cookies from 'universal-cookie';
import FormInput from '../../util-components/FormInput';
import './profile.scss';
import { UserContext } from '../../../UserContext';
import customFetch from '../../../fetchMethod';
import { notifySuccess, notifyError, notifyInfo } from '../../util-components/Notifications';
import imageCompressor from '../../../util-methods/imageCompressor';
import Checkbox from '../../util-components/checkbox/Checkbox';
import StudioUsersManager from '../../util-components/studioUsersManager/StudioUsersManager';

const apiUrl = import.meta.env.VITE_BACKEND_URL;

function Profile() {
  const { activeUser, handleSetActiveUser } = useContext(UserContext);
  const [joinedAt, setJoinedAt] = useState();
  const [studioOwner, setStudioOwner] = useState(activeUser);
  const [studioName, setStudioName] = useState('');
  const imgInputRef = useRef(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    studio_name: '',
    old_password: '',
    new_password: '',
    repeat_new_password: '',
  });

  async function getStudioOwner() {
    if (activeUser && activeUser.role === 'studio_user') {
      const response = await customFetch('/get-studio-owner-data', 'GET');
      if (response && response.data && response.data.ownerData) {
        setStudioOwner(response.data.ownerData);
      }
    }
  }

  function onChange(event) {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await customFetch('/get-user-data', 'GET');
        handleSetActiveUser(userData.data);
        getStudioOwner();

        if (userData.status !== 200) {
          notifyError('There was an error fetching User Data.');
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    setFormData({
      id: activeUser._id || '',
      username: activeUser.username || '',
      email: activeUser.email || '',
      password: activeUser.password || '',
      studio_name: activeUser.studio ? activeUser.studio.name : '',
      avatar_url: activeUser.avatar ? activeUser.avatar.url : '',
      old_password: '',
      new_password: '',
      repeat_new_password: '',
    });
    const dateString = activeUser.created_at;
    const date = new Date(dateString);

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    // Extract day, month, and year
    const day = date.getDate().toString().padStart(2, '0');
    const monthAbbreviation = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const formattedDate = `${day}/${monthAbbreviation}/${year}`;
    setJoinedAt(formattedDate);
  }, [activeUser]);

  function handleImageUpload(event) {
    const avatar = event.target.files[0];
    if (avatar) {
      if (avatar.type === 'image/png' || avatar.type === 'image/jpg' || avatar.type === 'image/jpeg') {
        setFormData((prev) => ({
          ...prev,
          avatar_url: URL.createObjectURL(avatar),
        }));
      } else {
        notifyError('Please select a valid image.');
      }
    }
  }
  function handleImageClick() {
    imgInputRef.current.click();
  }

  async function updateProfile(event) {
    const imgInput = imgInputRef.current;
    event.preventDefault();

    // Check for bad input
    if (formData.studio_name.trim() === '') {
      setFormData((prev) => ({ ...prev, studio_name: 'Set studio name here!' }));
    }

    if (formData.username.trim() === '') {
      return notifyError('Please enter a valid username to continue.');
    }
    if (formData.email.trim() === '' && activeUser.role !== 'studio_user') {
      return notifyError('Please enter a valid email to continue.');
    }
    if (formData.studio_name.trim() === '' && activeUser.role !== 'studio_user') {
      return notifyError('Please enter a valid studio name.');
    }
    if (formData.new_password.trim() || formData.repeat_new_password.trim()) {
      if (formData.new_password.trim() !== formData.repeat_new_password.trim()) {
        return notifyError('New Password and Repeat New Password do not match.');
      }
    }

    // If all good continue
    notifyInfo('Updating profile...');
    const newFormData = new FormData();
    const setFileToBase64 = (imgFile) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(imgFile);
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
    });

    try {
      let avatar;
      if (imgInput.files[0]) {
        avatar = await imageCompressor(imgInput.files[0]);
        const imageBase64 = await setFileToBase64(avatar);
        newFormData.append('avatar', imageBase64);
      }

      newFormData.append('id', formData.id);
      newFormData.append('username', formData.username);
      newFormData.append('email', formData.email);
      newFormData.append('old_password', formData.old_password);
      newFormData.append('studio_name', formData.studio_name);
      newFormData.append('new_password', formData.new_password);

      const response = await customFetch('/update-profile', 'POST', newFormData);

      if (response.status === 201 || response.status === 200) {
        notifySuccess('Profile updated successfully!');
      } else if (response.status === 304) {
        notifyError('Profile updated successfully!');
      } else {
        console.log('');
        if (response.data.message) {
          notifyError(response.data.message);
        } else {
          notifyError(`Error: ${response.data.message}`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <main className="profile-content">

      {/* PROFILE CARD */}
      <article className="user-profile-section">
        <h2>Profile Section:</h2>
        <div className="avatar-information-section">
          <div className="profile-avatar-container">
            <img
              src={formData.avatar_url ? formData.avatar_url : ''}
              alt="profile avatar"
              onClick={handleImageClick}
            />
            <label htmlFor="avatar" id="avatar-label">Update Avatar</label>
            <input
              type="file"
              accept="image/*"
              name="avatar"
              id="avatar"
              onChange={handleImageUpload}
              ref={imgInputRef}
            />
          </div>
          <div className="profile-information-container">
            <FormInput
              label="Username"
              id={uuid()}
              name="username"
              type="text"
              placeholder="Username"
              onChange={(e) => onChange(e)}
              text={formData.username ? formData.username : ''}
              required
              borderBottom="2px solid var(--borders)"
              labelColor={{ color: 'var(--text-grayed)' }}
            />

            {activeUser && activeUser.role === 'owner' && (
              <>
                <FormInput
                  label="Email"
                  id={uuid()}
                  name="email"
                  type="email"
                  placeholder="Email"
                  onChange={(e) => onChange(e)}
                  text={formData.email ? formData.email : ''}
                  required
                  borderBottom="2px solid var(--borders)"
                  labelColor={{ color: 'var(--text-grayed)' }}
                />
                <FormInput
                  label="Studio Name"
                  id={uuid()}
                  name="studio_name"
                  type="text"
                  placeholder="Studio"
                  onChange={(e) => onChange(e)}
                  text={formData.studio_name ? formData.studio_name : ''}
                  required
                  borderBottom="2px solid var(--borders)"
                  labelColor={{ color: 'var(--text-grayed)' }}
                />
              </>
            )}
            {/* PASSWORDS */}
            <div className="passwords-container">
              <FormInput
                label="Old Password"
                id={uuid()}
                name="old_password"
                type="password"
                placeholder="Old password"
                onChange={(e) => onChange(e)}
                text={formData.old_password ? formData.old_password : ''}
                required
                borderBottom="2px solid var(--borders)"
                labelColor={{ color: 'var(--text-grayed)' }}
              />
              <FormInput
                label="New Password"
                id={uuid()}
                name="new_password"
                type="password"
                placeholder="New Password"
                onChange={(e) => onChange(e)}
                text={formData.new_password ? formData.new_password : ''}
                required
                borderBottom="2px solid var(--borders)"
                labelColor={{ color: 'var(--text-grayed)' }}
              />
              <FormInput
                label="Repeat New Password"
                id={uuid()}
                name="repeat_new_password"
                type="password"
                placeholder="New Password"
                onChange={(e) => onChange(e)}
                text={formData.repeat_new_password ? formData.repeat_new_password : ''}
                required
                borderBottom="2px solid var(--borders)"
                labelColor={{ color: 'var(--text-grayed)' }}
              />
            </div>
          </div>
        </div>
        <div className="button-container">
          <button type="button" onClick={(e) => updateProfile(e)}>Update Profile</button>
        </div>
      </article>

      {/* STUDIO CARD */}
      {activeUser.permissions && activeUser.permissions.profile && activeUser.permissions.profile.studio_user_manager && (
      <article className="studio-section">

        <h2>
          {/* STUDIO NAME: */}
          {activeUser && activeUser.role === 'owner' && (activeUser.studio.name) }
          {studioOwner && studioOwner.studio && studioOwner.studio.name && activeUser.role !== 'owner' && (studioOwner.studio.name) }
          {' '}
          user manager
        </h2>
        <StudioUsersManager />
      </article>
      )}

      {/* STATISTICS CARD */}
      {activeUser && activeUser.permissions.profile.view_user_stats ? (
        <article className="stats-section">
          <h2>
            User Statistics:
          </h2>
          <section className="user-stats">
            <div className="left">
              <div className="labels-first">
                <p>Joined at:</p>
                <p>Studio name:</p>
              </div>
              <div className="data-first">
                {/* JOINED AT: */}
                {activeUser && <p>{joinedAt}</p>}
                {/* STUDIO NAME: */}
                {activeUser && activeUser.role === 'owner' && (<p>{activeUser.studio.name}</p>) }
                {studioOwner && studioOwner.studio && studioOwner.studio.name && activeUser.role !== 'owner' && (<p>{studioOwner.studio.name}</p>) }
              </div>
            </div>

            <div className="right">
              <div className="labels-second">
                <p>Schematics:</p>
                <p>Collections:</p>
                {activeUser && activeUser.role !== 'studio_user' && (<p>Studio users:</p>)}
              </div>
              <div className="data-second">
                {/* SCHEMATICS: */}
                {activeUser.schematics && activeUser.role === 'owner' && (
                <p>
                  {activeUser.schematics.length}
                </p>
                )}
                {studioOwner && studioOwner.studio && studioOwner.studio.name && activeUser.role !== 'owner' && (
                <p>
                  {studioOwner.schematics.length}
                </p>
                )}
                {/* COLLECTIONS: */}
                {activeUser.collections && (
                <p>
                  {activeUser.collections.length}
                </p>
                )}
                {studioOwner && studioOwner.collections && studioOwner && activeUser.role !== 'owner' && (
                <p>
                  {studioOwner.collections.length}
                </p>
                )}
                {/* STUDIO USERS */}
                {activeUser && activeUser.role !== 'studio_user' && (
                <p>
                  {activeUser.studio.users.length}
                </p>
                )}
              </div>
            </div>
          </section>
        </article>
      ) : '' }

      <div className="background-overlay" />
    </main>
  );
}

export default Profile;
