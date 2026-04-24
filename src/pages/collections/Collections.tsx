import { useEffect, useRef } from "react";
import { Loader, Group, Text } from "@mantine/core";
import CollectionCard from "./components/card/CollectionCard";
import "./collections.scss";
import { useCollectionsStore } from "../../store/collections_store";

const Collections: React.FC = () => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const collections = useCollectionsStore((s) => s.collections);
  const isLoading = useCollectionsStore((s) => s.isLoading);
  const error = useCollectionsStore((s) => s.error);
  const fetchCollections = useCollectionsStore((s) => s.fetchCollections);

  useEffect(() => {
    void fetchCollections();
  }, [fetchCollections]);

  return (
    <section className="collections-page page-fade-in">
      <div className="collections-page__background" />
      <main className="collections-page__content" ref={contentRef}>
        {error && (
          <Text
            className="collections-page__status collections-page__status--error"
            mb="md"
          >
            {error}
          </Text>
        )}
        {isLoading ? (
          <Group className="collections-page__loading-wrap" justify="center">
            <Loader size="sm" />
          </Group>
        ) : collections.length > 0 ? (
          <div className="collections-page__grid">
            {collections.map((collection) => (
              <CollectionCard key={collection._id} collection={collection} />
            ))}
          </div>
        ) : (
          <Group className="collections-page__empty-wrap" justify="center">
            <Text className="collections-page__status">
              No collections found.
            </Text>
          </Group>
        )}
      </main>
    </section>
  );
};

export default Collections;
