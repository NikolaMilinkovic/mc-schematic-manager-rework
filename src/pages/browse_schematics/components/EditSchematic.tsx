import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Drawer,
  Loader,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import customFetch from "../../../lib/custom_fetch";
import { compressImage, encodeToBlurHash } from "../../../lib/imageUtils";
import { popupMessage } from "../../../lib/popupMessage";
import type { Schematic } from "../../../store/schematic_store";
import { useCollectionsStore } from "../../../store/collections_store";
import SchematicImage from "../../../components/schematicImage/SchematicImage";
import CollectionsPicker, {
  type Collection as PickerCollection,
} from "../../upload_schematics/components/collectionsPicker/CollectionsPicker";
import FileInput from "../../upload_schematics/components/fileInput/FileInput";
import ImgInput from "../../upload_schematics/components/imgInput/ImgInput";
import TagsInput from "../../upload_schematics/components/tagsInput/TagsInput";
import "./editSchematic.scss";

type TagsResponse = Array<{ tags: string[] }>;

type SchematicCollectionsResponse = {
  currentCollections: Array<{
    collection_id: string;
    collection_name: string;
  }>;
};

type EditSchematicProps = {
  opened: boolean;
  schematic: Schematic | null;
  onClose: () => void;
  onUpdated?: (payload: {
    schematicId: string;
    schematicName: string;
    tags: string[];
    imageBase64?: string;
    blurHash?: {
      hash: string;
      width: number;
      height: number;
    };
    originalFileName?: string;
  }) => void;
};

type CollectionRecord = {
  collection_id: string;
  collection_name: string;
};

function uniqueTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
}

function normalizeCollection(input: unknown): CollectionRecord | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const record = input as Record<string, unknown>;
  const rawId = record.collection_id ?? record._id ?? record.id;
  if (rawId === null || rawId === undefined) {
    return null;
  }

  const collection_id = String(rawId).trim();
  if (!collection_id) {
    return null;
  }

  const rawName = record.collection_name ?? record.name ?? record.label;
  const collection_name =
    typeof rawName === "string" && rawName.trim()
      ? rawName.trim()
      : `Collection ${collection_id}`;

  return { collection_id, collection_name };
}

async function fetchSchematicCollections(
  schematicId: string,
): Promise<CollectionRecord[]> {
  const response = await customFetch<SchematicCollectionsResponse>(
    `/schematics/${schematicId}/collections`,
    "GET",
  );

  if (response.status >= 400 || !response.data?.currentCollections) {
    return [];
  }

  return response.data.currentCollections
    .map((entry) => normalizeCollection(entry))
    .filter((entry): entry is CollectionRecord => Boolean(entry));
}

async function toBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

function buildCollectionDiff(
  initialCollections: CollectionRecord[],
  nextCollections: PickerCollection[],
): {
  updatedCollections: Array<{ collection_id: string }>;
  removedCollections: Array<{ collection_id: string }>;
} {
  const initialIds = new Set(
    initialCollections.map((item) => item.collection_id),
  );
  const nextIds = new Set(nextCollections.map((item) => item.collection_id));

  const updatedCollections = nextCollections
    .filter((collection) => !initialIds.has(collection.collection_id))
    .map((collection) => ({ collection_id: collection.collection_id }));

  const removedCollections = initialCollections
    .filter((collection) => !nextIds.has(collection.collection_id))
    .map((collection) => ({ collection_id: collection.collection_id }));

  return { updatedCollections, removedCollections };
}

function EditSchematic({
  opened,
  schematic,
  onClose,
  onUpdated,
}: EditSchematicProps) {
  const collectionsList = useCollectionsStore(
    (state) => state.collectionOptions,
  );
  const fetchCollectionOptions = useCollectionsStore(
    (state) => state.fetchCollectionOptions,
  );

  const [tags, setTags] = useState<string[]>([]);
  const [schematicName, setSchematicName] = useState("");
  const [tagAutocomplete, setTagAutocomplete] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<
    PickerCollection[]
  >([]);
  const [initialCollections, setInitialCollections] = useState<
    CollectionRecord[]
  >([]);
  const [schematicFile, setSchematicFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingCollections, setIsFetchingCollections] = useState(false);

  useEffect(() => {
    if (!opened || !schematic) {
      return;
    }

    void fetchCollectionOptions();
  }, [fetchCollectionOptions, opened, schematic]);

  useEffect(() => {
    async function fetchTags() {
      const res = await customFetch<TagsResponse>("/schematics/tags", "GET");
      const firstEntry = res.data[0];
      if (firstEntry?.tags) {
        setTagAutocomplete(uniqueTags(firstEntry.tags));
      }
    }

    void fetchTags();
  }, []);

  useEffect(() => {
    if (!opened || !schematic) {
      return;
    }

    setSchematicName(schematic.name ?? "");
    setTags(uniqueTags(schematic.tags ?? []));
    setInitialCollections([]);
    setSelectedCollections([]);
    setSchematicFile(null);
    setImageFile(null);

    let canceled = false;

    async function loadCollections() {
      setIsFetchingCollections(true);
      try {
        const fetched = await fetchSchematicCollections(schematic!._id);
        if (!canceled) {
          setInitialCollections(fetched);
          setSelectedCollections(fetched);
        }
      } finally {
        if (!canceled) {
          setIsFetchingCollections(false);
        }
      }
    }

    loadCollections();

    return () => {
      canceled = true;
    };
  }, [opened, schematic]);

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    onClose();
  }

  const currentImageUrl = useMemo(() => {
    if (!schematic?.image?.url) {
      return "";
    }

    return schematic.image.url;
  }, [schematic?.image?.url]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!schematic?._id) {
      popupMessage("Schematic not found.", "error");
      return;
    }

    const normalizedName = schematicName.trim();
    const normalizedTags = uniqueTags(tags);
    setSchematicName(normalizedName);
    setTags(normalizedTags);

    if (!normalizedName) {
      popupMessage("Please enter a schematic name.", "error");
      return;
    }

    if (normalizedTags.length < 1) {
      popupMessage("Please add at least one tag.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      const { updatedCollections, removedCollections } = buildCollectionDiff(
        initialCollections,
        selectedCollections,
      );

      formData.append("tags", normalizedTags.join(","));
      formData.append("schematicName", normalizedName);
      formData.append("updatedCollections", JSON.stringify(updatedCollections));
      formData.append("removedCollections", JSON.stringify(removedCollections));

      if (schematicFile) {
        formData.append("schematicFile", schematicFile);
      }

      let imageBase64: string | undefined;
      let blurHashPayload:
        | {
            hash: string;
            width: number;
            height: number;
          }
        | undefined;

      if (imageFile) {
        const compressedImage = await compressImage(imageFile);
        imageBase64 = await toBase64(compressedImage);

        const { blurHash, width, height } =
          await encodeToBlurHash(compressedImage);

        formData.append("image", imageBase64);
        formData.append("blurHash", blurHash);
        formData.append("blurHashWidth", String(width));
        formData.append("blurHashHeight", String(height));

        blurHashPayload = {
          hash: blurHash,
          width,
          height,
        };
      }

      const response = await customFetch<unknown>(
        `/schematics/${schematic._id}`,
        "PATCH",
        formData,
      );

      if (response.status !== 200 && response.status !== 201) {
        popupMessage("Failed to update schematic.", "error");
        return;
      }

      onUpdated?.({
        schematicId: schematic._id,
        schematicName: normalizedName,
        tags: normalizedTags,
        imageBase64,
        blurHash: blurHashPayload,
        originalFileName: schematicFile?.name,
      });

      popupMessage("Schematic updated successfully.", "success");
      onClose();
    } catch (error) {
      console.error(error);
      popupMessage("Unexpected error while updating schematic.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Drawer
      opened={opened}
      onClose={handleClose}
      position="right"
      size="clamp(360px, 62vw, 1080px)"
      radius="sm"
      title={
        <div className="edit-schematic__title-wrap">
          <Title order={3} className="edit-schematic__title">
            Edit Schematic
          </Title>
          <Text size="sm" className="edit-schematic__subtitle">
            Update metadata, files, and collection assignment.
          </Text>
        </div>
      }
      classNames={{
        content: "edit-schematic__content",
        header: "edit-schematic__header",
        title: "edit-schematic__title-slot",
        body: "edit-schematic__body",
      }}
      closeButtonProps={{
        disabled: isSubmitting,
        className: "edit-schematic__close-button",
      }}
    >
      <form className="edit-schematic__form" onSubmit={handleSubmit}>
        <Stack gap="md" className="edit-schematic__fields">
          <TextInput
            label="Name"
            placeholder="Enter a name..."
            value={schematicName}
            onChange={(event) => setSchematicName(event.currentTarget.value)}
            required
            withAsterisk={false}
            radius="sm"
            classNames={{
              label: "edit-schematic__field-label",
              input: "edit-schematic__field-input",
            }}
          />

          <TagsInput
            tags={tags}
            setTags={setTags}
            autocomplete={tagAutocomplete}
          />

          {isFetchingCollections ? (
            <div className="edit-schematic__collections-loading">
              <Loader size="xs" />
              <Text
                size="xs"
                className="edit-schematic__collections-loading-text"
              >
                Loading collections…
              </Text>
            </div>
          ) : (
            <CollectionsPicker
              collectionsData={collectionsList}
              currentCollectionsData={initialCollections}
              updateSchematicCollections={setSelectedCollections}
            />
          )}

          <FileInput
            file={schematicFile}
            onChange={setSchematicFile}
            label="Replace schematic file (optional)"
          />

          <ImgInput
            file={imageFile}
            onChange={setImageFile}
            label="Replace preview image (optional)"
          />

          {currentImageUrl && !imageFile && schematic ? (
            <div className="edit-schematic__current-image-wrap">
              <Text size="xs" className="edit-schematic__current-image-label">
                Current preview image
              </Text>
              <SchematicImage
                schematicId={schematic._id}
                imageUrl={currentImageUrl}
                alt={`${schematic.name} preview`}
                className="edit-schematic__current-image"
                loading="lazy"
              />
            </div>
          ) : null}

          <Button
            type="submit"
            radius="sm"
            loading={isSubmitting}
            disabled={isFetchingCollections}
            className="edit-schematic__submit"
          >
            Save Changes
          </Button>
        </Stack>
      </form>
    </Drawer>
  );
}

export default EditSchematic;
