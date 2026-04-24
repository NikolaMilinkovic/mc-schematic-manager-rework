import { useEffect, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  FileButton,
  Group,
  Image,
  Loader,
  Pagination,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconPhoto,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router-dom";
import ActionConfirmModal from "../../../../components/actionConfirmModal/ActionConfirmModal";
import { popupMessage } from "../../../../lib/popupMessage";
import { useCollectionsStore } from "../../../../store/collections_store";
import SchematicCard from "../../../browse_schematics/components/SchematicCard";
import ManageSchematicsModal from "./ManageSchematicsModal";
import CreateSchematicModal from "./CreateSchematicModal";
import { buildCollectionUpdateFormData } from "./methods/buildCollectionUpdateFormData";
import { getCollectionFormValues } from "./methods/getCollectionFormValues";
import { validateCollectionForm } from "./methods/validateCollectionForm";
import "./collectionDetails.scss";

function CollectionDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const activeCollection = useCollectionsStore(
    (state) => state.activeCollection,
  );
  const isDetailLoading = useCollectionsStore((state) => state.isDetailLoading);
  const isSubmitting = useCollectionsStore((state) => state.isSubmitting);
  const detailError = useCollectionsStore((state) => state.detailError);
  const activeCollectionPage = useCollectionsStore(
    (state) => state.activeCollectionPage,
  );
  const activeCollectionPageSize = useCollectionsStore(
    (state) => state.activeCollectionPageSize,
  );
  const activeCollectionTotalCount = useCollectionsStore(
    (state) => state.activeCollectionTotalCount,
  );
  const fetchCollection = useCollectionsStore((state) => state.fetchCollection);
  const setActiveCollectionPage = useCollectionsStore(
    (state) => state.setActiveCollectionPage,
  );
  const updateCollection = useCollectionsStore(
    (state) => state.updateCollection,
  );
  const removeCollection = useCollectionsStore(
    (state) => state.removeCollection,
  );
  const clearActiveCollection = useCollectionsStore(
    (state) => state.clearActiveCollection,
  );
  const removeSchematicFromActiveCollection = useCollectionsStore(
    (state) => state.removeSchematicFromActiveCollection,
  );

  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [draftSearchValue, setDraftSearchValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [createSchematicOpen, setCreateSchematicOpen] = useState(false);
  const [addSchematicsOpen, setAddSchematicsOpen] = useState(false);
  const totalPages = Math.max(
    1,
    Math.ceil(activeCollectionTotalCount / activeCollectionPageSize),
  );

  useEffect(() => {
    if (!id) {
      navigate("/collections", { replace: true });
      return;
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!id) {
      return;
    }

    void fetchCollection(id, {
      page: activeCollectionPage,
      pageSize: activeCollectionPageSize,
      search: searchTerm,
    });
  }, [
    activeCollectionPage,
    activeCollectionPageSize,
    fetchCollection,
    id,
    searchTerm,
  ]);

  useEffect(() => {
    return () => {
      clearActiveCollection();
    };
  }, [clearActiveCollection]);

  useEffect(() => {
    const normalizedSearchTerm = draftSearchValue.trim();

    if (normalizedSearchTerm === searchTerm) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSearchTerm(normalizedSearchTerm);
      setActiveCollectionPage(1);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draftSearchValue, searchTerm, setActiveCollectionPage]);

  useEffect(() => {
    const values = getCollectionFormValues(activeCollection);
    setName(values.name);
    setTags(values.tags);
    setImagePreview(values.imagePreview);
    setImageFile(null);
  }, [activeCollection]);

  useEffect(() => {
    if (!imageFile) {
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(imageFile);
    setImagePreview(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [imageFile]);

  const collectionSchematics = activeCollection?.schematics ?? [];

  async function handleSaveChanges(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeCollection) {
      return;
    }

    const validatedForm = validateCollectionForm({ name, tags });
    setName(validatedForm.name);
    setTags(validatedForm.tags);

    if (validatedForm.error) {
      popupMessage(validatedForm.error, "error");
      return;
    }

    try {
      const formData = await buildCollectionUpdateFormData({
        name: validatedForm.name,
        tags: validatedForm.tags,
        imageFile,
      });

      const result = await updateCollection(activeCollection._id, formData);
      if (!result.success) {
        popupMessage(result.message, "error");
        return;
      }

      popupMessage(result.message, "success");
    } catch (error) {
      popupMessage(
        error instanceof Error ? error.message : "Failed to update collection.",
        "error",
      );
    }
  }

  async function handleRemoveCollection() {
    if (!activeCollection) {
      return;
    }

    const result = await removeCollection(activeCollection._id);
    if (!result.success) {
      popupMessage(result.message, "error");
      return;
    }

    popupMessage(result.message, "success");
    navigate("/collections", { replace: true });
  }

  if (isDetailLoading && !activeCollection) {
    return (
      <section className="collection-details">
        <div className="collection-details__background" aria-hidden="true">
          <div className="collection-details__glow collection-details__glow--right" />
          <div className="collection-details__glow collection-details__glow--left" />
        </div>
        <div className="collection-details__frame">
          <div className="collection-details__status-card">
            <Loader size="sm" />
            <Text className="collection-details__status-text">
              Loading collection...
            </Text>
          </div>
        </div>
      </section>
    );
  }

  if (!activeCollection) {
    return (
      <section className="collection-details">
        <div className="collection-details__background" aria-hidden="true">
          <div className="collection-details__glow collection-details__glow--right" />
          <div className="collection-details__glow collection-details__glow--left" />
        </div>
        <div className="collection-details__frame">
          <Card className="collection-details__status-card" radius="sm" p="lg">
            <Stack gap="sm" align="center">
              <Title order={3} className="collection-details__title">
                Collection unavailable
              </Title>
              <Text className="collection-details__status-text">
                {detailError ?? "This collection could not be loaded."}
              </Text>
              <Group>
                <Button radius="sm" onClick={() => navigate("/collections")}>
                  Back
                </Button>
                {id && (
                  <Button
                    radius="sm"
                    variant="default"
                    onClick={() => {
                      void fetchCollection(id, {
                        page: activeCollectionPage,
                        pageSize: activeCollectionPageSize,
                        search: searchTerm,
                      });
                    }}
                  >
                    Retry
                  </Button>
                )}
              </Group>
            </Stack>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="collection-details page-fade-in">
      <div className="collection-details__background" aria-hidden="true">
        <div className="collection-details__glow collection-details__glow--right" />
        <div className="collection-details__glow collection-details__glow--left" />
      </div>
      <div className="collection-details__frame">
        <ActionConfirmModal
          opened={removeConfirmOpen}
          onClose={() => setRemoveConfirmOpen(false)}
          onConfirm={() => {
            void handleRemoveCollection();
          }}
          title="Remove Collection"
          description="This will permanently remove the collection. This action cannot be undone."
          confirmLabel="Remove"
          isLoading={isSubmitting}
        />
        <CreateSchematicModal
          opened={createSchematicOpen}
          onClose={() => setCreateSchematicOpen(false)}
          onSuccess={() => {
            if (!id) {
              return;
            }

            void fetchCollection(id, {
              page: activeCollectionPage,
              pageSize: activeCollectionPageSize,
              search: searchTerm,
            });
          }}
          preselectedCollection={{
            collection_id: activeCollection._id,
            collection_name: activeCollection.name,
          }}
        />
        <ManageSchematicsModal
          opened={addSchematicsOpen}
          onClose={() => setAddSchematicsOpen(false)}
          onSuccess={() => {
            if (!id) {
              return;
            }

            void fetchCollection(id, {
              page: activeCollectionPage,
              pageSize: activeCollectionPageSize,
              search: searchTerm,
            });
          }}
          collectionId={activeCollection._id}
          collectionName={activeCollection.name}
          currentSchematicIds={activeCollection.schematics.map(
            (schematic) => schematic._id,
          )}
        />

        <main className="collection-details__content">
          <div className="collection-details__layout">
            <Card
              className="collection-details__editor-card"
              radius="sm"
              p="lg"
            >
              <div className="collection-details__editor-header">
                <ActionIcon
                  radius="sm"
                  variant="subtle"
                  aria-label="Back to collections"
                  className="collection-details__back-button"
                  onClick={() => navigate("/collections")}
                >
                  <IconArrowLeft size={18} />
                </ActionIcon>

                <div className="collection-details__editor-heading">
                  <Title order={1} className="collection-details__editor-title">
                    {activeCollection.name}
                  </Title>
                </div>
              </div>
              <Group gap="xs" className="collection-details__editor-meta">
                <Badge
                  radius="sm"
                  variant="light"
                  className="collection-details__badge"
                >
                  {activeCollectionTotalCount} schematics
                </Badge>
                <Badge
                  radius="sm"
                  variant="light"
                  className="collection-details__badge"
                >
                  {activeCollection.tags.length} tags
                </Badge>
              </Group>

              <form
                className="collection-details__form"
                onSubmit={handleSaveChanges}
              >
                <div className="collection-details__form-grid">
                  <div className="collection-details__preview-column">
                    <FileButton accept="image/*" onChange={setImageFile}>
                      {(buttonProps) => (
                        <button
                          type="button"
                          {...buttonProps}
                          className="collection-details__preview-trigger"
                          aria-label="Choose new image"
                        >
                          <div className="collection-details__preview-shell">
                            {imagePreview ? (
                              <Image
                                src={imagePreview}
                                alt={`${activeCollection.name} preview`}
                                className="collection-details__preview-image"
                                radius="sm"
                              />
                            ) : (
                              <div className="collection-details__preview-empty">
                                <IconPhoto size={28} />
                                <Text>No preview image</Text>
                              </div>
                            )}
                            <span className="collection-details__preview-caption">
                              Click to change image
                            </span>
                          </div>
                        </button>
                      )}
                    </FileButton>
                  </div>

                  <div className="collection-details__fields-column">
                    <Stack gap="md">
                      <TextInput
                        label="Collection name"
                        placeholder="Collection name"
                        value={name}
                        onChange={(event) => setName(event.currentTarget.value)}
                        radius="sm"
                        classNames={{
                          label: "collection-details__field-label",
                          input: "collection-details__field-input",
                        }}
                      />

                      <TagsInput
                        label="Tags"
                        placeholder="Add tags"
                        value={tags}
                        onChange={setTags}
                        radius="sm"
                        splitChars={[","]}
                        classNames={{
                          label: "collection-details__field-label",
                          input: "collection-details__field-input",
                          pill: "collection-details__tag-pill",
                          dropdown: "collection-details__field-dropdown",
                          option: "collection-details__field-option",
                        }}
                      />

                      {detailError && (
                        <Text className="collection-details__error-text">
                          {detailError}
                        </Text>
                      )}

                      <Group
                        grow
                        wrap="nowrap"
                        className="collection-details__form-actions"
                      >
                        <Button
                          type="submit"
                          radius="sm"
                          leftSection={<IconDeviceFloppy size={16} />}
                          loading={isSubmitting}
                          className="collection-details__action-button"
                        >
                          Save changes
                        </Button>
                        <Button
                          type="button"
                          radius="sm"
                          variant="default"
                          leftSection={<IconTrash size={16} />}
                          onClick={() => setRemoveConfirmOpen(true)}
                          disabled={isSubmitting}
                          className="collection-details__action-button collection-details__action-button--danger"
                        >
                          Remove collection
                        </Button>
                      </Group>
                    </Stack>
                  </div>
                </div>
              </form>
            </Card>

            <Card
              className="collection-details__schematics-card"
              radius="sm"
              p="lg"
            >
              <div className="collection-details__schematics-header">
                <div className="collection-details__schematics-actions">
                  <Button
                    radius="sm"
                    variant="default"
                    onClick={() => setCreateSchematicOpen(true)}
                    className="collection-details__schematics-action collection-details__schematics-action--upload"
                  >
                    Upload Schematic
                  </Button>
                  <Button
                    radius="sm"
                    variant="default"
                    onClick={() => setAddSchematicsOpen(true)}
                    className="collection-details__schematics-action collection-details__schematics-action--manage"
                  >
                    Manage Schematics
                  </Button>
                </div>

                <TextInput
                  value={draftSearchValue}
                  onChange={(event) =>
                    setDraftSearchValue(event.currentTarget.value)
                  }
                  placeholder="Search schematics or tags"
                  radius="sm"
                  leftSection={<IconSearch size={16} />}
                  className="collection-details__search-field"
                  classNames={{
                    input: "collection-details__search-input",
                  }}
                />

                <Group gap="xs" wrap="nowrap">
                  <ActionIcon
                    radius="sm"
                    variant="subtle"
                    aria-label="Previous page"
                    disabled={activeCollectionPage <= 1 || isDetailLoading}
                    onClick={() =>
                      setActiveCollectionPage(activeCollectionPage - 1)
                    }
                    className="collection-details__page-control"
                  >
                    {"<"}
                  </ActionIcon>
                  <ActionIcon
                    radius="sm"
                    variant="subtle"
                    aria-label="Next page"
                    disabled={
                      activeCollectionPage >= totalPages || isDetailLoading
                    }
                    onClick={() =>
                      setActiveCollectionPage(activeCollectionPage + 1)
                    }
                    className="collection-details__page-control"
                  >
                    {">"}
                  </ActionIcon>
                </Group>
              </div>

              <div className="collection-details__schematics-body">
                {collectionSchematics.length > 0 ? (
                  <div className="collection-details__schematics-grid">
                    {collectionSchematics.map((schematic) => (
                      <SchematicCard
                        key={schematic._id}
                        schematic={schematic}
                        collectionId={activeCollection._id}
                        onRemoved={removeSchematicFromActiveCollection}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="collection-details__empty-state">
                    <Text className="collection-details__status-text">
                      {draftSearchValue.trim()
                        ? "No schematics match current filter."
                        : "This collection is empty."}
                    </Text>
                  </div>
                )}

                {/* {totalPages > 1 && ( */}
                <Group
                  className="collection-details__pagination"
                  justify="center"
                >
                  <Pagination
                    total={totalPages}
                    value={activeCollectionPage}
                    onChange={setActiveCollectionPage}
                    size="sm"
                    radius="sm"
                  />
                </Group>
                {/* )} */}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </section>
  );
}

export default CollectionDetails;
