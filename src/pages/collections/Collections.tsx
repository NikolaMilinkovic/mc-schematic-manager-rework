import { useEffect, useState } from "react";
import {
  ActionIcon,
  Button,
  Card,
  Drawer,
  Group,
  Pagination,
  Text,
  TextInput,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import {
  IconChevronLeft,
  IconChevronRight,
  IconLayoutGrid,
  IconLayoutRows,
  IconPlus,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import CollectionCard from "./components/card/CollectionCard";
import CollectionRow from "./components/list/CollectionRow";
import AddCollection from "./components/add_collection/AddCollection";
import "./collections.scss";
import { useCollectionsStore } from "../../store/collections_store";
import Loading from "../../components/loading/Loading";

const LAYOUT_MODE_STORAGE_KEY = "collection-layout-mode";

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
  const [displayMode, setDisplayMode] = useState<"cards" | "rows">(() => {
    const saved = localStorage.getItem(LAYOUT_MODE_STORAGE_KEY);
    return saved === "rows" ? "rows" : "cards";
  });
  const isCompactLayout = useMediaQuery("(max-width: 980px)");
  const [isAddDrawerOpened, { open: openAddDrawer, close: closeAddDrawer }] =
    useDisclosure(false);

  const totalPages = Math.max(
    1,
    Math.ceil(collectionsTotalCount / collectionsPageSize),
  );

  useEffect(() => {
    void fetchCollections({ page: collectionsPage, search: searchTerm });
  }, [collectionsPage, fetchCollections, searchTerm]);

  useEffect(() => {
    localStorage.setItem(LAYOUT_MODE_STORAGE_KEY, displayMode);
  }, [displayMode]);

  useEffect(() => {
    const normalized = draftSearch.trim();
    if (normalized === searchTerm) return;
    const id = window.setTimeout(() => {
      setSearchTerm(normalized);
      setCollectionsPage(1);
    }, 350);
    return () => window.clearTimeout(id);
  }, [draftSearch, searchTerm, setCollectionsPage]);

  useEffect(() => {
    if (!isCompactLayout) {
      closeAddDrawer();
    }
  }, [closeAddDrawer, isCompactLayout]);

  function handleAddCollectionSuccess() {
    void fetchCollections({ page: 1, search: searchTerm });
    if (isCompactLayout) {
      closeAddDrawer();
    }
  }

  return (
    <section className="collections-page page-fade-in">
      <div className="collections-page__background" />
      <main className="collections-page__content">
        <div className="collections-page__layout">
          {!isCompactLayout && (
            <Card className="collections-page__sidebar-card" radius="sm" p="lg">
              <AddCollection onSuccess={handleAddCollectionSuccess} />
            </Card>
          )}

          <Card
            className="collections-page__collections-card"
            radius="sm"
            p="lg"
          >
            <div className="collections-page__collections-header">
              <Text className="collections-page__title">
                Browse Collections
              </Text>

              <div className="collections-page__header-right">
                <div className="collections-page__search-actions">
                  <TextInput
                    value={draftSearch}
                    onChange={(e) => setDraftSearch(e.currentTarget.value)}
                    placeholder="Search by name or tags"
                    radius="sm"
                    leftSection={<IconSearch size={16} />}
                    className="collections-page__search-field"
                    classNames={{
                      input:
                        "collections-page__search-input ui-input-template ui-input-template--transparent ",
                    }}
                  />
                  {isCompactLayout && (
                    <Button
                      variant="subtle"
                      radius="xs"
                      leftSection={<IconPlus size={16} />}
                      onClick={openAddDrawer}
                      className="ui-button-template ui-button-template--surface collections-page__add-toggle"
                    >
                      Add
                    </Button>
                  )}
                </div>

                <Group
                  gap={4}
                  wrap="nowrap"
                  className="collections-page__layout-toggle"
                >
                  <ActionIcon
                    variant="default"
                    radius="sm"
                    aria-label="Show collections as cards"
                    aria-pressed={displayMode === "cards"}
                    className={`collections-page__view-toggle-btn${
                      displayMode === "cards"
                        ? " collections-page__view-toggle-btn--active"
                        : ""
                    }`}
                    onClick={() => setDisplayMode("cards")}
                  >
                    <IconLayoutGrid size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="default"
                    radius="sm"
                    aria-label="Show collections as rows"
                    aria-pressed={displayMode === "rows"}
                    className={`collections-page__view-toggle-btn${
                      displayMode === "rows"
                        ? " collections-page__view-toggle-btn--active"
                        : ""
                    }`}
                    onClick={() => setDisplayMode("rows")}
                  >
                    <IconLayoutRows size={16} />
                  </ActionIcon>
                </Group>

                <Group
                  gap="xs"
                  wrap="nowrap"
                  className="collections-page__page-controls"
                >
                  <ActionIcon
                    radius="sm"
                    variant="subtle"
                    aria-label="Previous page"
                    disabled={collectionsPage <= 1 || isLoading}
                    onClick={() => setCollectionsPage(collectionsPage - 1)}
                    className="ui-icon-button-template ui-icon-button-template--surface collections-page__page-control"
                  >
                    <IconChevronLeft size={16} />
                  </ActionIcon>
                  <ActionIcon
                    radius="sm"
                    variant="subtle"
                    aria-label="Next page"
                    disabled={collectionsPage >= totalPages || isLoading}
                    onClick={() => setCollectionsPage(collectionsPage + 1)}
                    className="ui-icon-button-template ui-icon-button-template--surface collections-page__page-control"
                  >
                    <IconChevronRight size={16} />
                  </ActionIcon>
                </Group>
              </div>
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
                <Loading />
              ) : collections.length > 0 ? (
                displayMode === "cards" ? (
                  <div className="collections-page__grid">
                    {collections.map((collection) => (
                      <CollectionCard
                        key={collection._id}
                        collection={collection}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="collections-page__list">
                    {collections.map((collection) => (
                      <CollectionRow
                        key={collection._id}
                        collection={collection}
                      />
                    ))}
                  </div>
                )
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

      <Drawer
        opened={isAddDrawerOpened}
        onClose={closeAddDrawer}
        position="left"
        size={360}
        withCloseButton={false}
        classNames={{
          content: "collections-page__drawer",
          body: "collections-page__drawer-body",
        }}
      >
        <div className="collections-page__drawer-header">
          <Text className="collections-page__drawer-title">Add Collection</Text>
          <ActionIcon
            variant="subtle"
            radius="xs"
            onClick={closeAddDrawer}
            className="collections-page__drawer-close"
          >
            <IconX size={16} />
          </ActionIcon>
        </div>

        <div className="collections-page__drawer-content">
          <Card className="collections-page__drawer-panel" radius="sm" p="md">
            <AddCollection onSuccess={handleAddCollectionSuccess} />
          </Card>
        </div>
      </Drawer>
    </section>
  );
};

export default Collections;
