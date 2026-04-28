import {
  ActionIcon,
  Button,
  Drawer,
  MultiSelect,
  Paper,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import {
  IconAdjustmentsHorizontal,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import "./browseFilters.scss";

type BrowseFiltersProps = {
  searchTerm: string;
  selectedTags: string[];
  selectedCollectionIds: string[];
  collectionOptions: Array<{ value: string; label: string }>;
  onSearchTermChange: (value: string) => void;
  onSelectedTagsChange: (tags: string[]) => void;
  onSelectedCollectionIdsChange: (collectionIds: string[]) => void;
  onClearFilters: () => void;
  forceToggle?: boolean;
};

function BrowseFilters({
  searchTerm,
  selectedTags,
  selectedCollectionIds,
  collectionOptions,
  onSearchTermChange,
  onSelectedTagsChange,
  onSelectedCollectionIdsChange,
  onClearFilters,
  forceToggle,
}: BrowseFiltersProps) {
  const isSmallScreen = useMediaQuery("(max-width: 980px)");
  const showToggle = forceToggle ?? isSmallScreen;
  const [opened, { open, close }] = useDisclosure(false);
  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    selectedTags.length > 0 ||
    selectedCollectionIds.length > 0;

  const filtersContent = (
    <Paper className="browse-schematics__filters-panel" radius="sm" p="md">
      <Stack gap="md">
        <Title order={3} className="browse-schematics__filters-title">
          Filters
        </Title>

        <div>
          <Text className="browse-schematics__filters-label" mb={6}>
            Search
          </Text>
          <TextInput
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.currentTarget.value)}
            placeholder="Search name or tags"
            radius="sm"
            leftSection={<IconSearch size={16} />}
            classNames={{
              input: "ui-input-template browse-schematics__search-input",
            }}
          />
        </div>

        <div>
          <Text className="browse-schematics__filters-label" mb={8}>
            Tags
          </Text>
          <TagsInput
            value={selectedTags}
            onChange={onSelectedTagsChange}
            placeholder="Add tags and press Enter"
            radius="sm"
            splitChars={[","]}
            clearable
            classNames={{
              input: "ui-input-template browse-schematics__search-input",
              pill: "browse-schematics__tag-pill",
            }}
          />
        </div>

        <div>
          <Text className="browse-schematics__filters-label" mb={8}>
            Collections
          </Text>
          <MultiSelect
            data={collectionOptions}
            value={selectedCollectionIds}
            onChange={onSelectedCollectionIdsChange}
            placeholder="Select collections"
            searchable
            clearable
            hidePickedOptions
            radius="sm"
            nothingFoundMessage="No collections found"
            classNames={{
              input: "ui-input-template browse-schematics__search-input",
              pill: "browse-schematics__tag-pill",
              dropdown: "browse-schematics__collections-dropdown",
              option: "browse-schematics__collections-option",
              empty: "browse-schematics__collections-empty",
            }}
          />
        </div>

        <Button
          radius="sm"
          variant="subtle"
          onClick={() => {
            if (!hasActiveFilters) {
              return;
            }
            onClearFilters();
          }}
          disabled={!hasActiveFilters}
          className="browse-schematics__clear-button"
        >
          Clear filters
        </Button>
      </Stack>
    </Paper>
  );

  if (showToggle) {
    return (
      <div className="browse-filters">
        <Button
          variant="subtle"
          radius="sm"
          className="ui-button-template ui-button-template--surface browse-filters__toggle"
          leftSection={<IconAdjustmentsHorizontal size={16} />}
          onClick={open}
        >
          Filters
        </Button>

        <Drawer
          opened={opened}
          onClose={close}
          position="left"
          size={300}
          withCloseButton={false}
          classNames={{
            content: "browse-filters__drawer",
            body: "browse-filters__drawer-body",
          }}
        >
          <div className="browse-filters__drawer-header">
            <Text className="browse-filters__drawer-title">Filters</Text>
            <ActionIcon
              variant="subtle"
              radius="sm"
              onClick={close}
              className="browse-filters__drawer-close"
            >
              <IconX size={16} />
            </ActionIcon>
          </div>

          <div className="browse-filters__drawer-content">{filtersContent}</div>
        </Drawer>
      </div>
    );
  }

  return <aside className="browse-schematics__filters">{filtersContent}</aside>;
}

export default BrowseFilters;
