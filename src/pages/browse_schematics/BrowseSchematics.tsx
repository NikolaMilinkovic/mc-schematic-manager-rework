import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  Affix,
  Button,
  Group,
  Loader,
  Pagination,
  Text,
  Transition,
} from "@mantine/core";
import {
  IconArrowUp,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { useMediaQuery } from "@mantine/hooks";
import { useSchematicsStore } from "../../store/schematic_store";
import { useCollectionsStore } from "../../store/collections_store";
import Loading from "../../components/loading/Loading";
import SchematicRendererModal from "../../components/schematicRendererModal/SchematicRendererModal";
import CreateSchematicModal from "../collections/components/collection_details/CreateSchematicModal";
import BrowseFilters from "./components/BrowseFilters";
import SchematicCard from "./components/SchematicCard";
import customFetch from "../../lib/custom_fetch";
import "./browse-schematics.scss";

function BrowseSchematics() {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [visibleCardsCount, setVisibleCardsCount] = useState(0);
  const [draftSearchTerm, setDraftSearchTerm] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoSchematicId, setDemoSchematicId] = useState<string | null>(null);
  const [demoSchematicName, setDemoSchematicName] = useState<string | null>(
    null,
  );
  const [resourcePackBlob, setResourcePackBlob] = useState<Blob | null>(null);

  const schematics = useSchematicsStore((state) => state.schematics);
  const searchTerm = useSchematicsStore((state) => state.searchTerm);
  const selectedTags = useSchematicsStore((state) => state.selectedTags);
  const selectedCollectionIds = useSchematicsStore(
    (state) => state.selectedCollectionIds,
  );
  const isLoading = useSchematicsStore((state) => state.isLoading);
  const error = useSchematicsStore((state) => state.error);
  const currentPage = useSchematicsStore((state) => state.currentPage);
  const pageSize = useSchematicsStore((state) => state.pageSize);
  const totalCount = useSchematicsStore((state) => state.totalCount);
  const fetchSchematics = useSchematicsStore((state) => state.fetchSchematics);
  const setSearchTerm = useSchematicsStore((state) => state.setSearchTerm);
  const setSelectedTags = useSchematicsStore((state) => state.setSelectedTags);
  const setSelectedCollectionIds = useSchematicsStore(
    (state) => state.setSelectedCollectionIds,
  );
  const clearFilters = useSchematicsStore((state) => state.clearFilters);
  const setPage = useSchematicsStore((state) => state.setPage);
  const removeSchematicLocal = useSchematicsStore(
    (state) => state.removeSchematicLocal,
  );
  const collectionOptions = useCollectionsStore(
    (state) => state.collectionOptions,
  );
  const fetchCollectionOptions = useCollectionsStore(
    (state) => state.fetchCollectionOptions,
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    setDraftSearchTerm(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    void fetchSchematics();
  }, [fetchSchematics]);

  useEffect(() => {
    void fetchCollectionOptions();
  }, [fetchCollectionOptions]);

  // Load resource pack once on mount
  useEffect(() => {
    let canceled = false;

    async function loadResourcePack() {
      try {
        const response = await fetch("/vendor/vanilla-resource-pack.zip");
        if (!response.ok) {
          throw new Error(
            `Failed to load resource pack (HTTP ${response.status})`,
          );
        }
        const blob = await response.blob();
        if (!canceled) {
          setResourcePackBlob(blob);
        }
      } catch (error) {
        console.error("Failed to load resource pack:", error);
      }
    }

    loadResourcePack();

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    if (draftSearchTerm === searchTerm) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSearchTerm(draftSearchTerm);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draftSearchTerm, searchTerm, setSearchTerm]);

  useEffect(() => {
    if (isLoading || schematics.length === 0) {
      setVisibleCardsCount(0);
      return;
    }

    const initialBatchSize = 14;
    const chunkSize = 24;
    let timeoutId: number | null = null;
    let cancelled = false;

    setVisibleCardsCount(Math.min(initialBatchSize, schematics.length));

    function renderNextChunk() {
      if (cancelled) {
        return;
      }

      setVisibleCardsCount((previous) => {
        if (previous >= schematics.length) {
          return previous;
        }

        const next = Math.min(previous + chunkSize, schematics.length);

        if (next < schematics.length) {
          timeoutId = window.setTimeout(renderNextChunk, 28);
        }

        return next;
      });
    }

    if (schematics.length > initialBatchSize) {
      timeoutId = window.setTimeout(renderNextChunk, 28);
    }

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isLoading, schematics]);

  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) {
      return;
    }

    function handleListScroll(event: Event) {
      const target = event.currentTarget as HTMLElement;
      const shouldShowButton = target.scrollTop > 140;
      setShowScrollTop((previous) =>
        previous === shouldShowButton ? previous : shouldShowButton,
      );
    }

    contentElement.addEventListener("scroll", handleListScroll, {
      passive: true,
    });

    return () => {
      contentElement.removeEventListener("scroll", handleListScroll);
    };
  }, []);

  function handleScrollListToTop() {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePageChange(page: number) {
    setPage(page);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePreviousPage() {
    if (currentPage <= 1) {
      return;
    }

    handlePageChange(currentPage - 1);
  }

  function handleNextPage() {
    if (currentPage >= totalPages) {
      return;
    }

    handlePageChange(currentPage + 1);
  }

  const handleOpenDemo = useCallback(
    (schematicId: string, schematicName: string) => {
      setDemoSchematicId(schematicId);
      setDemoSchematicName(schematicName);
      setDemoModalOpen(true);
    },
    [],
  );

  const loadSchematicArrayBuffer = useCallback(async () => {
    if (!demoSchematicId) {
      throw new Error("No schematic ID provided");
    }

    const response = await customFetch<Response>(
      `/get-schematic-file/${demoSchematicId}`,
      "GET",
    );

    if (!(response.data instanceof Response) || !response.data.ok) {
      throw new Error("Could not fetch schematic binary.");
    }

    return response.data.arrayBuffer();
  }, [demoSchematicId]);

  const hasSchematics = schematics.length > 0;
  const collectionFilterOptions = useMemo(
    () =>
      collectionOptions.map((collection) => ({
        value: collection.collection_id,
        label: collection.collection_name,
      })),
    [collectionOptions],
  );
  const visibleSchematics = useMemo(
    () => schematics.slice(0, visibleCardsCount),
    [schematics, visibleCardsCount],
  );
  const hasMoreCardsToRender = visibleCardsCount < schematics.length;
  const isCompactHeaderLayout = useMediaQuery("(max-width: 980px)");
  const filtersProps = {
    searchTerm: draftSearchTerm,
    selectedTags,
    selectedCollectionIds,
    collectionOptions: collectionFilterOptions,
    onSearchTermChange: setDraftSearchTerm,
    onSelectedTagsChange: setSelectedTags,
    onSelectedCollectionIdsChange: setSelectedCollectionIds,
    onClearFilters: clearFilters,
  };

  return (
    <section className="browse-schematics page-fade-in">
      {!isCompactHeaderLayout && <BrowseFilters {...filtersProps} />}

      <main className="browse-schematics__content">
        <div
          className={`browse-schematics__content-header${
            isCompactHeaderLayout
              ? " browse-schematics__content-header--compact"
              : ""
          }`}
        >
          {isCompactHeaderLayout && (
            <div className="browse-schematics__header-left">
              <BrowseFilters {...filtersProps} forceToggle />
            </div>
          )}

          <Text
            className={`browse-schematics__title${
              isCompactHeaderLayout ? " browse-schematics__title--compact" : ""
            }`}
          >
            Browse Schematics
          </Text>

          <Group
            gap="xs"
            className={`browse-schematics__header-actions${
              isCompactHeaderLayout
                ? " browse-schematics__header-actions--compact"
                : ""
            }`}
          >
            <Button
              variant="subtle"
              radius="sm"
              onClick={() => setUploadModalOpen(true)}
              className="ui-button-template ui-button-template--surface browse-schematics__upload-button"
            >
              Upload Schematic
            </Button>
            <ActionIcon
              variant="default"
              radius="sm"
              className="browse-schematics__page-nav-button"
              aria-label="Previous page"
              onClick={handlePreviousPage}
              disabled={isLoading || currentPage <= 1}
            >
              <IconChevronLeft size={16} />
            </ActionIcon>
            <ActionIcon
              variant="default"
              radius="sm"
              className="browse-schematics__page-nav-button"
              aria-label="Next page"
              onClick={handleNextPage}
              disabled={isLoading || currentPage >= totalPages}
            >
              <IconChevronRight size={16} />
            </ActionIcon>
          </Group>
        </div>

        <div className="browse-schematics__content-body" ref={contentRef}>
          {error && (
            <Text
              className="browse-schematics__status browse-schematics__status--error"
              mb="md"
            >
              {error}
            </Text>
          )}

          {isLoading ? (
            <Loading />
          ) : hasSchematics ? (
            <>
              <div className="browse-schematics__grid">
                {visibleSchematics.map((schematic) => (
                  <SchematicCard
                    key={schematic._id}
                    schematic={schematic}
                    onRemoved={removeSchematicLocal}
                    onOpenDemo={handleOpenDemo}
                  />
                ))}
              </div>

              {hasMoreCardsToRender && <Loading />}

              <Group
                className="browse-schematics__pagination"
                justify="center"
                mt="lg"
                pb="md"
              >
                <Pagination
                  total={totalPages}
                  value={currentPage}
                  onChange={handlePageChange}
                  size="sm"
                  radius="sm"
                />
              </Group>
            </>
          ) : (
            <Group className="browse-schematics__empty-wrap" justify="center">
              <Text className="browse-schematics__status">
                No schematics match your current filters.
              </Text>
            </Group>
          )}
        </div>
      </main>

      <CreateSchematicModal
        opened={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          void fetchSchematics(currentPage);
        }}
      />

      <Affix position={{ bottom: 24, right: 24 }}>
        <Transition transition="slide-up" mounted={showScrollTop}>
          {(transitionStyles) => (
            <div style={transitionStyles}>
              <ActionIcon
                aria-label="Scroll list to top"
                radius="xl"
                size="lg"
                variant="filled"
                className="browse-schematics__scroll-top-button"
                onClick={handleScrollListToTop}
              >
                <IconArrowUp size={18} />
              </ActionIcon>
            </div>
          )}
        </Transition>
      </Affix>

      <SchematicRendererModal
        opened={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        schematicName={demoSchematicName ?? "Schematic"}
        loadSchematicArrayBuffer={loadSchematicArrayBuffer}
        resourcePackBlob={resourcePackBlob}
      />
    </section>
  );
}

export default BrowseSchematics;
