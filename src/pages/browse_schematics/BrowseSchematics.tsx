import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  Affix,
  Group,
  Loader,
  Pagination,
  Text,
  Transition,
} from "@mantine/core";
import { IconArrowUp } from "@tabler/icons-react";
import { useSchematicsStore } from "../../store/schematic_store";
import BrowseFilters from "./components/BrowseFilters";
import SchematicCard from "./components/SchematicCard";
import "./browse-schematics.scss";

function BrowseSchematics() {
  const contentRef = useRef<HTMLElement | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [visibleCardsCount, setVisibleCardsCount] = useState(0);
  const [draftSearchTerm, setDraftSearchTerm] = useState("");

  const schematics = useSchematicsStore((state) => state.schematics);
  const availableTags = useSchematicsStore((state) => state.availableTags);
  const searchTerm = useSchematicsStore((state) => state.searchTerm);
  const selectedTags = useSchematicsStore((state) => state.selectedTags);
  const isLoading = useSchematicsStore((state) => state.isLoading);
  const error = useSchematicsStore((state) => state.error);
  const currentPage = useSchematicsStore((state) => state.currentPage);
  const pageSize = useSchematicsStore((state) => state.pageSize);
  const totalCount = useSchematicsStore((state) => state.totalCount);
  const fetchSchematics = useSchematicsStore((state) => state.fetchSchematics);
  const setSearchTerm = useSchematicsStore((state) => state.setSearchTerm);
  const setSelectedTags = useSchematicsStore((state) => state.setSelectedTags);
  const clearFilters = useSchematicsStore((state) => state.clearFilters);
  const setPage = useSchematicsStore((state) => state.setPage);
  const removeSchematicLocal = useSchematicsStore(
    (state) => state.removeSchematicLocal,
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    setDraftSearchTerm(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    void fetchSchematics();
  }, [fetchSchematics]);

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

  const hasSchematics = schematics.length > 0;
  const visibleSchematics = useMemo(
    () => schematics.slice(0, visibleCardsCount),
    [schematics, visibleCardsCount],
  );
  const hasMoreCardsToRender = visibleCardsCount < schematics.length;

  return (
    <section className="browse-schematics page-fade-in">
      <BrowseFilters
        searchTerm={draftSearchTerm}
        selectedTags={selectedTags}
        availableTags={availableTags}
        onSearchTermChange={setDraftSearchTerm}
        onSelectedTagsChange={setSelectedTags}
        onClearFilters={clearFilters}
      />

      <main className="browse-schematics__content" ref={contentRef}>
        {error && (
          <Text
            className="browse-schematics__status browse-schematics__status--error"
            mb="md"
          >
            {error}
          </Text>
        )}

        {isLoading ? (
          <Group className="browse-schematics__loading-wrap" justify="center">
            <Loader size="sm" />
          </Group>
        ) : hasSchematics ? (
          <>
            <div className="browse-schematics__grid">
              {visibleSchematics.map((schematic) => (
                <SchematicCard
                  key={schematic._id}
                  schematic={schematic}
                  onRemoved={removeSchematicLocal}
                />
              ))}
            </div>

            {hasMoreCardsToRender && (
              <Group
                className="browse-schematics__loading-more"
                justify="center"
                mt="sm"
              >
                <Loader size="xs" />
              </Group>
            )}

            {totalPages > 1 && (
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
            )}
          </>
        ) : (
          <Group className="browse-schematics__empty-wrap" justify="center">
            <Text className="browse-schematics__status">
              No schematics match your current filters.
            </Text>
          </Group>
        )}
      </main>

      <Affix position={{ bottom: 24, right: 24 }}>
        <Transition transition="slide-up" mounted={showScrollTop}>
          {(transitionStyles) => (
            <ActionIcon
              aria-label="Scroll list to top"
              radius="xl"
              size="lg"
              variant="filled"
              style={transitionStyles}
              onClick={handleScrollListToTop}
            >
              <IconArrowUp size={18} />
            </ActionIcon>
          )}
        </Transition>
      </Affix>
    </section>
  );
}

export default BrowseSchematics;
