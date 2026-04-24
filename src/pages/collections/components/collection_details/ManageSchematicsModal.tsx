import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Group,
  HoverCard,
  Image,
  Loader,
  Modal,
  Pagination,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { popupMessage } from "../../../../lib/popupMessage";
import { useCollectionsStore } from "../../../../store/collections_store";
import type { Schematic } from "../../../../store/schematic_store";
import "./manage-schematics-modal.scss";

type ManageSchematicsModalProps = {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  collectionId: string;
  collectionName: string;
  currentSchematicIds: string[];
};

function ManageSchematicsModal({
  opened,
  onClose,
  onSuccess,
  collectionId,
  collectionName,
  currentSchematicIds,
}: ManageSchematicsModalProps) {
  const fetchSchematicsForSelection = useCollectionsStore(
    (state) => state.fetchSchematicsForSelection,
  );
  const replaceCollectionSchematics = useCollectionsStore(
    (state) => state.replaceCollectionSchematics,
  );
  const isSubmitting = useCollectionsStore((state) => state.isSubmitting);

  const [schematics, setSchematics] = useState<Schematic[]>([]);
  const [selectedSchematicIds, setSelectedSchematicIds] = useState<string[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [totalCount, setTotalCount] = useState(0);
  const [draftSearch, setDraftSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const requestIdRef = useRef(0);
  const initialSelectedIds = useMemo(
    () => Array.from(new Set(currentSchematicIds)),
    [currentSchematicIds],
  );
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    if (!opened) {
      return;
    }

    setSelectedSchematicIds(initialSelectedIds);
    setDraftSearch("");
    setSearchTerm("");
    setPage(1);
    setError(null);
  }, [initialSelectedIds, opened]);

  useEffect(() => {
    if (!opened) {
      return;
    }

    const normalizedSearch = draftSearch.trim();
    if (normalizedSearch === searchTerm) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSearchTerm(normalizedSearch);
      setPage(1);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draftSearch, opened, searchTerm]);

  useEffect(() => {
    if (!opened) {
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    void (async () => {
      const response = await fetchSchematicsForSelection({
        page,
        pageSize,
        search: searchTerm,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!response) {
        setSchematics([]);
        setTotalCount(0);
        setIsLoading(false);
        setError("Failed to load schematics. Please try again.");
        return;
      }

      setSchematics(response.schematics);
      setTotalCount(response.totalCount);
      setPageSize(response.pageSize);
      setIsLoading(false);
      setError(null);
    })();
  }, [fetchSchematicsForSelection, opened, page, pageSize, searchTerm]);

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    onClose();
  }

  function toggleSchematicSelection(schematicId: string) {
    setSelectedSchematicIds((currentIds) =>
      currentIds.includes(schematicId)
        ? currentIds.filter((id) => id !== schematicId)
        : [...currentIds, schematicId],
    );
  }

  async function handleSubmit() {
    const result = await replaceCollectionSchematics({
      collectionId,
      schematicIds: selectedSchematicIds,
    });

    if (!result.success) {
      popupMessage(result.message, "error");
      return;
    }

    popupMessage(result.message, "success");
    onClose();
    onSuccess?.();
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      centered
      size="xl"
      radius="sm"
      title={
        <Title order={3} className="manage-schematics-modal__title">
          Manage - {collectionName}
        </Title>
      }
      classNames={{
        content: "manage-schematics-modal__content",
        header: "manage-schematics-modal__header",
        body: "manage-schematics-modal__body",
      }}
      closeButtonProps={{ disabled: isSubmitting }}
    >
      <div className="manage-schematics-modal__filters">
        <div className="manage-schematics-modal__search-row">
          <TextInput
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.currentTarget.value)}
            placeholder="Search schematics"
            radius="sm"
            leftSection={<IconSearch size={16} />}
            className="manage-schematics-modal__search-field"
            classNames={{
              input: "manage-schematics-modal__search-input",
            }}
          />

          <Group gap="xs" wrap="nowrap">
            <ActionIcon
              radius="sm"
              variant="subtle"
              aria-label="Previous page"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage(page - 1)}
              className="manage-schematics-modal__page-control"
            >
              {"<"}
            </ActionIcon>
            <ActionIcon
              radius="sm"
              variant="subtle"
              aria-label="Next page"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage(page + 1)}
              className="manage-schematics-modal__page-control"
            >
              {">"}
            </ActionIcon>
          </Group>
        </div>
      </div>

      <div className="manage-schematics-modal__body-content">
        {error && (
          <Text className="manage-schematics-modal__error-text">{error}</Text>
        )}

        {isLoading ? (
          <Group
            className="manage-schematics-modal__loading-wrap"
            justify="center"
          >
            <Loader size="sm" />
          </Group>
        ) : schematics.length > 0 ? (
          <Stack gap="xs" className="manage-schematics-modal__list">
            {schematics.map((schematic) => {
              const isSelected = selectedSchematicIds.includes(schematic._id);
              return (
                <button
                  key={schematic._id}
                  type="button"
                  className={`manage-schematics-modal__item${isSelected ? " manage-schematics-modal__item--selected" : ""}`}
                  onClick={() => toggleSchematicSelection(schematic._id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleSchematicSelection(schematic._id)}
                    onClick={(event) => event.stopPropagation()}
                    radius="sm"
                    className="manage-schematics-modal__checkbox"
                    tabIndex={-1}
                  />
                  <HoverCard openDelay={120} closeDelay={80} shadow="md">
                    <HoverCard.Target>
                      <div className="manage-schematics-modal__thumb-wrap">
                        {schematic.image?.url ? (
                          <img
                            src={schematic.image.url}
                            alt={`${schematic.name} preview`}
                            className="manage-schematics-modal__thumb"
                            loading="lazy"
                          />
                        ) : (
                          <div className="manage-schematics-modal__thumb-placeholder">
                            No image
                          </div>
                        )}
                      </div>
                    </HoverCard.Target>

                    <HoverCard.Dropdown className="manage-schematics-modal__hover-preview">
                      {schematic.image?.url ? (
                        <Image
                          src={schematic.image.url}
                          alt={`${schematic.name} enlarged preview`}
                          className="manage-schematics-modal__hover-image"
                          radius="sm"
                        />
                      ) : (
                        <Text className="manage-schematics-modal__hover-empty">
                          No preview image
                        </Text>
                      )}
                    </HoverCard.Dropdown>
                  </HoverCard>

                  <div className="manage-schematics-modal__item-body">
                    <Text className="manage-schematics-modal__item-title">
                      {schematic.name}
                    </Text>
                    <Group gap={6} className="manage-schematics-modal__tags">
                      {schematic.tags.map((tag) => (
                        <Badge
                          key={`${schematic._id}-${tag}`}
                          size="xs"
                          radius="sm"
                          variant="light"
                          className="manage-schematics-modal__tag"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </Group>
                  </div>
                </button>
              );
            })}
          </Stack>
        ) : (
          <Group
            className="manage-schematics-modal__empty-wrap"
            justify="center"
          >
            <Text className="manage-schematics-modal__status-text">
              {searchTerm
                ? "No schematics match current search."
                : "No schematics available to manage."}
            </Text>
          </Group>
        )}

        <Group className="manage-schematics-modal__pagination" justify="center">
          <Pagination
            total={totalPages}
            value={page}
            onChange={setPage}
            size="sm"
            radius="sm"
          />
        </Group>

        <Group
          justify="space-between"
          className="manage-schematics-modal__actions"
        >
          <Text className="manage-schematics-modal__selected-text">
            {selectedSchematicIds.length} selected (replacement set)
          </Text>
          <Group gap="sm">
            <Button
              variant="default"
              radius="sm"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button radius="sm" onClick={handleSubmit} loading={isSubmitting}>
              Save Selection
            </Button>
          </Group>
        </Group>
      </div>
    </Modal>
  );
}

export default ManageSchematicsModal;
