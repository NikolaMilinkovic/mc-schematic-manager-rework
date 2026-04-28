import { useEffect, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Drawer,
  FileButton,
  Group,
  Image,
  Pagination,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import {
  IconAdjustmentsHorizontal,
  IconArrowLeft,
  IconChevronLeft,
  IconChevronRight,
  IconDeviceFloppy,
  IconPhoto,
  IconSearch,
  IconTrash,
  IconX,
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
import Loading from "../../../../components/loading/Loading";

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
  const [sidebarOpened, { open: openSidebar, close: closeSidebar }] =
    useDisclosure(false);
  const isCompactLayout = useMediaQuery("(max-width: 980px)");
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

  useEffect(() => {
    if (!isCompactLayout) {
      closeSidebar();
    }
  }, [closeSidebar, isCompactLayout]);

  const collectionSchematics = activeCollection?.schematics ?? [];

  function renderEditorCard(collection: NonNullable<typeof activeCollection>) {
    return (
      <Card
        className={`collection-details__editor-card${
          isCompactLayout ? " collection-details__editor-card--sidebar" : ""
        }`}
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
              {collection.name}
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
            {collection.tags.length} tags
          </Badge>
        </Group>

        <form className="collection-details__form" onSubmit={handleSaveChanges}>
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
                          alt={`${collection.name} preview`}
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
                    input: "collection-details__field-input ui-input-template",
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
                    input: "collection-details__field-input ui-input-template",
                    inputField: "collection-details__field-input-field",
                    pillsList: "collection-details__tags-pills-list",
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
                    Save
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
                    Remove
                  </Button>
                </Group>
              </Stack>
            </div>
          </div>
        </form>
      </Card>
    );
  }

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
        <Loading />
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

  const collection = activeCollection;

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
            collection_id: collection._id,
            collection_name: collection.name,
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
        <Drawer
          opened={sidebarOpened}
          onClose={closeSidebar}
          position="left"
          size={380}
          withCloseButton={false}
          classNames={{
            content: "collection-details__drawer",
            body: "collection-details__drawer-body",
          }}
        >
          <div className="collection-details__drawer-header">
            <Text className="collection-details__drawer-title">
              Collection Details
            </Text>
            <ActionIcon
              variant="subtle"
              radius="sm"
              onClick={closeSidebar}
              className="collection-details__drawer-close"
              aria-label="Close collection details"
            >
              <IconX size={16} />
            </ActionIcon>
          </div>

          <div className="collection-details__drawer-content">
            {renderEditorCard(collection)}
          </div>
        </Drawer>

        <main className="collection-details__content">
          <div className="collection-details__layout">
            {!isCompactLayout && renderEditorCard(collection)}

            <Card
              className="collection-details__schematics-card"
              radius="sm"
              p="lg"
            >
              <div className="collection-details__schematics-header">
                {isCompactLayout && (
                  <div className="collection-details__schematics-title-wrap">
                    <Title
                      order={2}
                      className="collection-details__schematics-title"
                    >
                      {collection.name}
                    </Title>
                  </div>
                )}

                <div className="collection-details__schematics-toolbar">
                  <div className="collection-details__schematics-actions">
                    {isCompactLayout && (
                      <>
                        <ActionIcon
                          radius="sm"
                          variant="subtle"
                          aria-label="Back to collections"
                          onClick={() => navigate("/collections")}
                          className="ui-icon-button-template ui-icon-button-template--transparent collection-details__schematics-action collection-details__schematics-back-button"
                        >
                          <IconArrowLeft size={18} />
                        </ActionIcon>
                        <Button
                          radius="sm"
                          variant="subtle"
                          leftSection={<IconAdjustmentsHorizontal size={16} />}
                          onClick={openSidebar}
                          className="ui-button-template ui-button-template--surface collection-details__schematics-action collection-details__schematics-action--sidebar"
                        >
                          Details
                        </Button>
                      </>
                    )}
                    <Button
                      radius="sm"
                      variant="subtle"
                      onClick={() => setCreateSchematicOpen(true)}
                      className="ui-button-template ui-button-template--surface collection-details__schematics-action collection-details__schematics-action--upload"
                    >
                      Upload
                    </Button>
                    <Button
                      radius="sm"
                      variant="subtle"
                      onClick={() => setAddSchematicsOpen(true)}
                      className="ui-button-template ui-button-template--surface collection-details__schematics-action collection-details__schematics-action--manage"
                    >
                      Manage
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
                      input:
                        "collection-details__search-input ui-input-template ui-input-template--transparent",
                    }}
                  />

                  <Group
                    gap="xs"
                    wrap="nowrap"
                    className="collection-details__page-controls"
                  >
                    <ActionIcon
                      size="input-sm"
                      radius="sm"
                      variant="default"
                      aria-label="Previous page"
                      disabled={activeCollectionPage <= 1 || isDetailLoading}
                      onClick={() =>
                        setActiveCollectionPage(activeCollectionPage - 1)
                      }
                      className="collection-details__page-control"
                    >
                      <IconChevronLeft size={16} />
                    </ActionIcon>
                    <ActionIcon
                      size="input-sm"
                      radius="sm"
                      variant="default"
                      aria-label="Next page"
                      disabled={
                        activeCollectionPage >= totalPages || isDetailLoading
                      }
                      onClick={() =>
                        setActiveCollectionPage(activeCollectionPage + 1)
                      }
                      className="collection-details__page-control"
                    >
                      <IconChevronRight size={16} />
                    </ActionIcon>
                  </Group>
                </div>
              </div>

              <div className="collection-details__schematics-body">
                {collectionSchematics.length > 0 ? (
                  <div className="collection-details__schematics-grid">
                    {collectionSchematics.map((schematic) => (
                      <SchematicCard
                        key={schematic._id}
                        schematic={schematic}
                        collectionId={collection._id}
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
