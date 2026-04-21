import {
  ActionIcon,
  Button,
  Checkbox,
  Drawer,
  Paper,
  Stack,
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
  availableTags: string[];
  onSearchTermChange: (value: string) => void;
  onSelectedTagsChange: (tags: string[]) => void;
  onClearFilters: () => void;
};

function BrowseFilters({
  searchTerm,
  selectedTags,
  availableTags,
  onSearchTermChange,
  onSelectedTagsChange,
  onClearFilters,
}: BrowseFiltersProps) {
  const isSmallScreen = useMediaQuery("(max-width: 980px)");
  const [opened, { open, close }] = useDisclosure(false);

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
            classNames={{ input: "browse-schematics__search-input" }}
          />
        </div>

        <div>
          <Text className="browse-schematics__filters-label" mb={8}>
            Tags
          </Text>

          {availableTags.length > 0 ? (
            <Checkbox.Group
              value={selectedTags}
              onChange={onSelectedTagsChange}
              className="browse-schematics__tags-list"
            >
              <Stack gap={8}>
                {availableTags.map((tag) => (
                  <Checkbox
                    key={tag}
                    value={tag}
                    label={tag}
                    radius="sm"
                    classNames={{ label: "browse-schematics__tag-label" }}
                  />
                ))}
              </Stack>
            </Checkbox.Group>
          ) : (
            <Text className="browse-schematics__status">
              No tags available yet.
            </Text>
          )}
        </div>

        <Button
          radius="sm"
          variant="subtle"
          onClick={onClearFilters}
          className="browse-schematics__clear-button"
        >
          Clear filters
        </Button>
      </Stack>
    </Paper>
  );

  if (isSmallScreen) {
    return (
      <div className="browse-filters">
        <Button
          variant="subtle"
          radius="xs"
          className="browse-filters__toggle"
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
              radius="xs"
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
