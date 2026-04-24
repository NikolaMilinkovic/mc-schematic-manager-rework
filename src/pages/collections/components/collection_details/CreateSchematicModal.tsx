import { useEffect, useState } from "react";
import { Button, Modal, Stack, Text, TextInput, Title } from "@mantine/core";
import customFetch from "../../../../lib/custom_fetch";
import { compressImage, encodeToBlurHash } from "../../../../lib/imageUtils";
import { popupMessage } from "../../../../lib/popupMessage";
import { useCollectionsStore } from "../../../../store/collections_store";
import CollectionsPicker, {
  type Collection as PickerCollection,
} from "../../../upload_schematics/components/collectionsPicker/CollectionsPicker";
import FileInput from "../../../upload_schematics/components/fileInput/FileInput";
import ImgInput from "../../../upload_schematics/components/imgInput/ImgInput";
import TagsInput from "../../../upload_schematics/components/tagsInput/TagsInput";
import "./create-schematic-modal.scss";

type TagsResponse = Array<{ tags: string[] }>;

type CreateSchematicModalProps = {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedCollection?: PickerCollection;
};

const IMG_TYPES = new Set(["png", "jpg", "jpeg"]);
const SCHEM_TYPES = new Set(["schematic", "schem"]);

function fileExt(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function uniqueTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
}

async function toBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

function CreateSchematicModal({
  opened,
  onClose,
  onSuccess,
  preselectedCollection,
}: CreateSchematicModalProps) {
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
  >(preselectedCollection ? [preselectedCollection] : []);
  const [schematicFile, setSchematicFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!opened) {
      return;
    }

    void fetchCollectionOptions();
  }, [fetchCollectionOptions, opened]);

  useEffect(() => {
    async function fetchTags() {
      const res = await customFetch<TagsResponse>("/get-tags", "GET");
      const firstEntry = res.data[0];
      if (firstEntry?.tags) {
        setTagAutocomplete(uniqueTags(firstEntry.tags));
      }
    }

    void fetchTags();
  }, []);

  function resetForm() {
    setTags([]);
    setSchematicName("");
    setSchematicFile(null);
    setImageFile(null);
    setSelectedCollections(
      preselectedCollection ? [preselectedCollection] : [],
    );
  }

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose();
  }

  function routeDroppedFile(files: FileList) {
    const file = files[0];
    if (!file) return;

    const ext = fileExt(file);
    if (IMG_TYPES.has(ext)) setImageFile(file);
    if (SCHEM_TYPES.has(ext)) setSchematicFile(file);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedName = schematicName.trim();
    const normalizedTags = uniqueTags(tags);
    setSchematicName(normalizedName);
    setTags(normalizedTags);

    if (!normalizedName) {
      popupMessage("Please enter a schematic name to continue.", "error");
      return;
    }
    if (!schematicFile) {
      popupMessage("Please select a schematic file to continue.", "error");
      return;
    }
    if (!imageFile) {
      popupMessage("Please select a preview image to continue.", "error");
      return;
    }
    if (normalizedTags.length < 1) {
      popupMessage("Please add at least one tag to continue.", "error");
      return;
    }

    setIsSubmitting(true);
    popupMessage("Schematic is being processed...", "info");

    try {
      const formData = new FormData();
      const compressedImage = await compressImage(imageFile);
      const imageBase64 = await toBase64(compressedImage);

      formData.append("image", imageBase64);

      const { blurHash, width, height } =
        await encodeToBlurHash(compressedImage);
      formData.append("blurHash", blurHash);
      formData.append("blurHashWidth", String(width));
      formData.append("blurHashHeight", String(height));

      formData.append("schematicFile", schematicFile);
      formData.append("tags", normalizedTags.join(","));
      formData.append("schematicName", normalizedName);
      formData.append("collectionsList", JSON.stringify(selectedCollections));

      const response = await customFetch<unknown>(
        "/upload-schematic",
        "POST",
        formData,
      );

      if (response.status === 201) {
        popupMessage("Schematic uploaded successfully!", "success");
        resetForm();
        onClose();
        onSuccess?.();
        return;
      }

      if (response.status === 400) {
        popupMessage(
          "This schematic already exists on your profile - canceling upload.",
          "error",
        );
        return;
      }

      popupMessage("Error uploading the schematic.", "error");
    } catch (error) {
      console.error(error);
      popupMessage("Unexpected error during upload.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      centered
      size="lg"
      radius="sm"
      title={
        <div className="create-schematic-modal__title-wrap">
          <Title order={3} className="create-schematic-modal__title">
            Upload New Schematic
          </Title>
        </div>
      }
      classNames={{
        content: "create-schematic-modal__content",
        header: "create-schematic-modal__header",
        title: "create-schematic-modal__title-slot",
        body: "create-schematic-modal__body",
      }}
      closeButtonProps={{
        disabled: isSubmitting,
        className: "create-schematic-modal__close-button",
      }}
    >
      <form
        className="create-schematic-modal__form"
        onSubmit={handleSubmit}
        onDrop={(event) => {
          event.preventDefault();
          routeDroppedFile(event.dataTransfer.files);
        }}
        onDragOver={(event) => event.preventDefault()}
        onPaste={(event) => routeDroppedFile(event.clipboardData.files)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
          }
        }}
      >
        <Stack gap="md">
          <Text className="create-schematic-modal__hint" size="sm">
            Drag and drop files into the modal, or paste from clipboard.
          </Text>

          <TextInput
            label="Name"
            placeholder="Enter a name..."
            value={schematicName}
            onChange={(event) => setSchematicName(event.currentTarget.value)}
            required
            withAsterisk={false}
            radius="sm"
            classNames={{
              label: "create-schematic-modal__field-label",
              input: "create-schematic-modal__field-input",
            }}
          />

          <FileInput file={schematicFile} onChange={setSchematicFile} />

          <ImgInput file={imageFile} onChange={setImageFile} />

          <TagsInput
            tags={tags}
            setTags={setTags}
            autocomplete={tagAutocomplete}
          />

          <CollectionsPicker
            collectionsData={collectionsList}
            currentCollectionsData={
              preselectedCollection ? [preselectedCollection] : undefined
            }
            updateSchematicCollections={setSelectedCollections}
          />

          <Button
            type="submit"
            radius="sm"
            loading={isSubmitting}
            className="create-schematic-modal__submit"
          >
            Upload
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}

export default CreateSchematicModal;
