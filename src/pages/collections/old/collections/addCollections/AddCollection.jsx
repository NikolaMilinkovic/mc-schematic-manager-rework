import {
  useState, React, useEffect, useRef,
} from 'react';
import './addCollection.scss';
import { v4 as uuid } from 'uuid';
import FormInput from '../../../util-components/FormInput';
import { notifySuccess, notifyError, notifyInfo } from '../../../util-components/Notifications';
import ImgInputComponent from '../../../util-components/imgInputComponent/ImgInputComponent';
import TagsInput from '../../../util-components/TagsInput';
import imageCompressor from '../../../../util-methods/imageCompressor';
import customFetch from '../../../../fetchMethod';
import encodeImageToBlurHash from '../../../../util-methods/encodeToBlurHash';

function AddCollection({
  state, toggleState, renderer, scrollPosition,
}) {
  const imgInputRef = useRef(null);
  const [imgKey, setImgKey] = useState(null);
  const [tagAutocomplete, setTagAutocomplete] = useState([]);
  const [tags, setTags] = useState([]);
  const [collectionForm, setCollectionForm] = useState({
    collection_name: '',
    collection_tags: [],
  });
  const formRef = useRef(null);
  const outsideFormRef = useRef(null);

  useEffect(() => {
    setCollectionForm((prev) => ({
      ...prev,
      collection_tags: tags,
    }));
  }, [tags]);

  async function addCollection(event) {
    const imgInput = imgInputRef.current;
    event.preventDefault();

    if (collectionForm.collection_name === '') {
      return notifyError('Please provide a collection name.');
    }
    if (collectionForm.collection_tags.length === 0) {
      return notifyError('Please provide collections tags.');
    }

    // If all good continue
    notifyInfo('Updating collection...');
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

        const { blurHash, width, height } = await encodeImageToBlurHash(avatar);
        newFormData.append('blurHash', blurHash);
        newFormData.append('blurHashWidth', width);
        newFormData.append('blurHashHeight', height);
      }

      newFormData.append('collection_name', collectionForm.collection_name);
      newFormData.append('collection_tags', collectionForm.collection_tags);

      const response = await customFetch('/add-new-collection', 'POST', newFormData);

      if (response.status === 201 || response.status === 200) {
        notifySuccess('Collection added successfully!');
        renderer();
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

  // Closes the dropdown when clicked outside of it
  useEffect(() => {
    function handleClicks(event) {
      if (!formRef.current.contains(event.target)
      && outsideFormRef.current.contains(event.target)
      ) {
        toggleState();
      }
    }

    document.addEventListener('click', handleClicks);

    return () => {
      document.removeEventListener('click', handleClicks);
    };
  }, [toggleState]);
  // Handles user input
  function onInput(e) {
    const { value, name } = e.target;
    setCollectionForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Image Drag & Drop
  function handleDrop(event) {
    event.preventDefault();
    const { files } = event.dataTransfer;

    // File types for comparison
    const imgTypes = ['png', 'jpg', 'jpeg'];

    // Parse file extension
    const fileName = files[0].name;
    const extension = fileName.split('.');
    const ext = extension.slice(-1)[0];

    function updateInput(elementRef, file) {
      if (file) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        elementRef.current.files = dataTransfer.files;

        // Manually trigger the onChange event
        const changeEvent = new Event('change', { bubbles: true });
        elementRef.current.dispatchEvent(changeEvent);
      }
    }

    // Compare extension with image types
    imgTypes.forEach((type) => {
      if (ext === type) {
        updateInput(imgInputRef, files[0]);
      }
    });
  }

  // Clipboard paste
  const handlePaste = (event) => {
    // File types for comparison
    const imgTypes = ['png', 'jpg', 'jpeg'];
    function updateRef(elementRef, file) {
      if (file) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        elementRef.current.files = dataTransfer.files;

        // Manually trigger the onChange event
        const changeEvent = new Event('change', { bubbles: true });
        elementRef.current.dispatchEvent(changeEvent);
      }
    }

    // Get Clipboard file
    const { clipboardData } = event;
    const { files } = clipboardData;

    // Parse file extension
    const fileName = files[0].name;
    const extension = fileName.split('.');
    const ext = extension.slice(-1)[0];

    // Compare extension with image types
    imgTypes.forEach((type) => {
      if (ext === type) {
        updateRef(imgInputRef, files[0]);
      }
    });
  };
  return (
    <main
      className={`add-collection-main ${state ? 'showModal' : 'hideModal'}`}
      ref={outsideFormRef}
      onSubmit={addCollection}
      onDrop={handleDrop}
      onDragOver={(event) => event.preventDefault()}
      onPaste={handlePaste}
    >
      <form className="new-collection-form" ref={formRef} style={{ marginTop: `calc(${scrollPosition}px + 6rem)` }}>
        <h2 className="header">Add new Collection:</h2>
        <div className="name-img-inputs">

          <FormInput
            label="Collection name"
            id={uuid()}
            name="collection_name"
            type="text"
            placeholder="Name"
            onChange={(event) => onInput(event)}
            text={collectionForm.collection_name}
            required
            borderBottom="2px solid var(--borders)"
          />

          <ImgInputComponent
            reference={imgInputRef}
            rerenderkey={imgKey}
          />
        </div>

        <TagsInput
          tags={tags}
          setTags={setTags}
          autocomplete={tagAutocomplete}
          id="tags-input"
        />
        <button type="submit" className="submit-btn">Add Collection</button>
      </form>
    </main>
  );
}

export default AddCollection;
