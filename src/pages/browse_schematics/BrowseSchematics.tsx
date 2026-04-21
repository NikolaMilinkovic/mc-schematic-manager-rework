import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Affix,
  Group,
  Loader,
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
  const [listScrollY, setListScrollY] = useState(0);

  const schematics = useSchematicsStore((state) => state.schematics);
  const availableTags = useSchematicsStore((state) => state.availableTags);
  const searchTerm = useSchematicsStore((state) => state.searchTerm);
  const selectedTags = useSchematicsStore((state) => state.selectedTags);
  const isLoading = useSchematicsStore((state) => state.isLoading);
  const error = useSchematicsStore((state) => state.error);
  const fetchSchematics = useSchematicsStore((state) => state.fetchSchematics);
  const setSearchTerm = useSchematicsStore((state) => state.setSearchTerm);
  const setSelectedTags = useSchematicsStore((state) => state.setSelectedTags);
  const clearFilters = useSchematicsStore((state) => state.clearFilters);
  const removeSchematicLocal = useSchematicsStore(
    (state) => state.removeSchematicLocal,
  );

  useEffect(() => {
    void fetchSchematics();
  }, [fetchSchematics]);

  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) {
      return;
    }

    function handleListScroll(event: Event) {
      const target = event.currentTarget as HTMLElement;
      setListScrollY(target.scrollTop);
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

  const hasSchematics = schematics.length > 0;

  return (
    <section className="browse-schematics page-fade-in">
      <BrowseFilters
        searchTerm={searchTerm}
        selectedTags={selectedTags}
        availableTags={availableTags}
        onSearchTermChange={setSearchTerm}
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
          <div className="browse-schematics__grid">
            {schematics.map((schematic) => (
              <SchematicCard
                key={schematic._id}
                schematic={schematic}
                onRemoved={removeSchematicLocal}
              />
            ))}
          </div>
        ) : (
          <Group className="browse-schematics__empty-wrap" justify="center">
            <Text className="browse-schematics__status">
              No schematics match your current filters.
            </Text>
          </Group>
        )}
      </main>

      <Affix position={{ bottom: 24, right: 24 }}>
        <Transition transition="slide-up" mounted={listScrollY > 140}>
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
