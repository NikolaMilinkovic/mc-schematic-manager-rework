/* eslint-disable no-nested-ternary */
import React, { useState, useEffect } from 'react';
import './collectionsLanding.scss';
import { v4 as uuid } from 'uuid';
import Loading from '../../../components/loading/Loading';
import { notifyError } from '../../../util-components/Notifications';
import customFetch from '../../../../fetchMethod';
import DisplayCollection from '../displayCollection/DisplayCollection';

function CollectionsLanding({ collectionsFilter, renderer }) {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState([]);
  const [cachedCollections, setCachedCollections] = useState([]);

  async function fetchCollectionsData() {
    try {
      const collectionsData = await customFetch('/get-collections', 'GET');
      setCollections(collectionsData.data.collections);
      setCachedCollections(collectionsData.data.collections);
      if (collectionsData.status !== 200) {
        notifyError('There was an error fetching Collections Data.');
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchCollectionsData();
  }, [renderer]);

  // Filter Collections based on collectionsFilter
  useEffect(() => {
    if (collectionsFilter) {
      const filteredCollections = cachedCollections.filter((collection) => {
        const matchesName = collection.name.toLowerCase().includes(collectionsFilter.toLowerCase());
        const matchesTags = collection.tags.some((tag) => tag.toLowerCase().includes(collectionsFilter.toLowerCase()));
        return matchesName || matchesTags;
      });
      setCollections(filteredCollections);
    } else {
      setCollections(cachedCollections);
    }
  }, [collectionsFilter, cachedCollections]);

  // Removes the schematic from display
  function popCollection(event) {
    const collectionId = event.target.name;
    const newCollectionList = collections.filter((collection) => collection._id !== collectionId);
    setCollections(newCollectionList);
  }

  return (
    <div className="landing-content">
      <div className="collections-container">
        {loading ? (
          <Loading zIndex="1" />
        )
          : collections.length !== 0
            ? (
              collections.map((collection) => (
                <DisplayCollection
                  key={collection.name}
                  data={collection}
                  popCollection={(e) => popCollection(e)}
                />
              ))
            ) : (
              <Loading zIndex="1" text="Pedro stole all collections..." />
            )}
      </div>
    </div>
  );
}

export default CollectionsLanding;
