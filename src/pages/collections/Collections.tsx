import { useEffect, useState } from "react";
import {
  ActionIcon,
  Card,
  Group,
  Loader,
  Pagination,
  Text,
  TextInput,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import CollectionCard from "./components/card/CollectionCard";
import AddCollection from "./components/add_collection/AddCollection";
import "./collections.scss";
import { useCollectionsStore } from "../../store/collections_store";

const Collections: React.FC = () => {
  const collections = useCollectionsStore((s) => s.collections);
  const isLoading = useCollectionsStore((s) => s.isLoading);
  const error = useCollectionsStore((s) => s.error);
  const fetchCollections = useCollectionsStore((s) => s.fetchCollections);
  const collectionsPage = useCollectionsStore((s) => s.collectionsPage);
  const collectionsPageSize = useCollectionsStore((s) => s.collectionsPageSize);
  const collectionsTotalCount = useCollectionsStore(
    (s) => s.collectionsTotalCount,
  );
  const setCollectionsPage = useCollectionsStore((s) => s.setCollectionsPage);

  const [draftSearch, setDraftSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const totalPages = Math.max(
    1,
    Math.ceil(collectionsTotalCount / collectionsPageSize),
  );

  useEffect(() => {
    void fetchCollections({ page: collectionsPage, search: searchTerm });
  }, [collectionsPage, fetchCollections, searchTerm]);

  useEffect(() => {
    const normalized = draftSearch.trim();
    if (normalized === searchTerm) return;
    const id = window.setTimeout(() => {
      setSearchTerm(normalized);
      setCollectionsPage(1);
    }, 350);
    return () => window.clearTimeout(id);
  }, [draftSearch, searchTerm, setCollectionsPage]);

  return (
    <section className="collections-page page-fade-in">
      <div className="collections-page__background" />
      <main className="collections-page__content">
        <div className="collections-page__layout">
          <Card className="collections-page__sidebar-card" radius="sm" p="lg">
            <AddCollection
              onSuccess={() =>
                void fetchCollections({ page: 1, search: searchTerm })
              }
            />
          </Card>

          <Card
            className="collections-page__collections-card"
            radius="sm"
            p="lg"
          >
            <div className="collections-page__collections-header">
              <TextInput
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.currentTarget.value)}
                placeholder="Search by name or tags"
                radius="sm"
                leftSection={<IconSearch size={16} />}
                className="collections-page__search-field"
                classNames={{ input: "collections-page__search-input" }}
              />
              <Group gap="xs" wrap="nowrap">
                <ActionIcon
                  radius="sm"
                  variant="subtle"
                  aria-label="Previous page"
                  disabled={collectionsPage <= 1 || isLoading}
                  onClick={() => setCollectionsPage(collectionsPage - 1)}
                  className="collections-page__page-control"
                >
                  {"<"}
                </ActionIcon>
                <ActionIcon
                  radius="sm"
                  variant="subtle"
                  aria-label="Next page"
                  disabled={collectionsPage >= totalPages || isLoading}
                  onClick={() => setCollectionsPage(collectionsPage + 1)}
                  className="collections-page__page-control"
                >
                  {">"}
                </ActionIcon>
              </Group>
            </div>

            <div className="collections-page__collections-body">
              {error && (
                <Text
                  className="collections-page__status collections-page__status--error"
                  mb="md"
                >
                  {error}
                </Text>
              )}
              {isLoading ? (
                <Group
                  className="collections-page__loading-wrap"
                  justify="center"
                >
                  <Loader size="sm" />
                </Group>
              ) : collections.length > 0 ? (
                <div className="collections-page__grid">
                  {collections.map((collection) => (
                    <CollectionCard
                      key={collection._id}
                      collection={collection}
                    />
                  ))}
                </div>
              ) : (
                <Group
                  className="collections-page__empty-wrap"
                  justify="center"
                >
                  <Text className="collections-page__status">
                    {draftSearch.trim()
                      ? "No collections match your search."
                      : "No collections found."}
                  </Text>
                </Group>
              )}

              <Group className="collections-page__pagination" justify="center">
                <Pagination
                  total={totalPages}
                  value={collectionsPage}
                  onChange={setCollectionsPage}
                  size="sm"
                  radius="sm"
                />
              </Group>
            </div>
          </Card>
        </div>
      </main>
    </section>
  );
};

export default Collections;
