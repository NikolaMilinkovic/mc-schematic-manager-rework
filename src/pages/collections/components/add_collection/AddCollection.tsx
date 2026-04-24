import { useEffect, useState } from "react";
import { Button, Stack, Text, TextInput, Title } from "@mantine/core";
import { popupMessage } from "../../../../lib/popupMessage";
import customFetch from "../../../../lib/custom_fetch";
import { compressImage, encodeToBlurHash } from "../../../../lib/imageUtils";
import { useCollectionsStore } from "../../../../store/collections_store";
import ImgInput from "../../../upload_schematics/components/imgInput/ImgInput";
import TagsInput from "../../../upload_schematics/components/tagsInput/TagsInput";
import "./add-collection.scss";

type AddCollectionProps = {
  onSuccess?: () => void;
};

type TagsResponse = Array<{ tags: string[] }>;

function uniqueTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
}

function fileExt(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

async function toBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

function AddCollection({ onSuccess }: AddCollectionProps) {
  const createCollection = useCollectionsStore(
    (state) => state.createCollection,
  );
  const isSubmitting = useCollectionsStore((state) => state.isSubmitting);
  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagAutocomplete, setTagAutocomplete] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

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
    setName("");
    setTags([]);
    setImageFile(null);
  }

  function routeDroppedFile(files: FileList) {
    const file = files[0];
    if (!file) {
      return;
    }

    const ext = fileExt(file);
    if (["png", "jpg", "jpeg", "webp"].includes(ext)) {
      setImageFile(file);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedName = name.trim();
    const normalizedTags = uniqueTags(tags);
    setName(normalizedName);
    setTags(normalizedTags);

    if (!normalizedName) {
      popupMessage("Please provide a collection name.", "error");
      return;
    }

    if (normalizedTags.length < 1) {
      popupMessage("Please provide at least one collection tag.", "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("collection_name", normalizedName);
      formData.append("collection_tags", normalizedTags.join(","));

      if (imageFile) {
        const compressedImage = await compressImage(imageFile);
        const imageBase64 = await toBase64(compressedImage);
        formData.append("avatar", imageBase64);

        const { blurHash, width, height } =
          await encodeToBlurHash(compressedImage);
        formData.append("blurHash", blurHash);
        formData.append("blurHashWidth", String(width));
        formData.append("blurHashHeight", String(height));
      }

      const result = await createCollection(formData);
      if (!result.success) {
        popupMessage(result.message, "error");
        return;
      }

      popupMessage(result.message, "success");
      resetForm();
      onSuccess?.();
    } catch (error) {
      popupMessage(
        error instanceof Error
          ? error.message
          : "Failed to add collection. Please try again.",
        "error",
      );
    }
  }

  return (
    <div className="add-collection-panel">
      <Title order={3} className="add-collection-panel__title">
        Add New Collection
      </Title>
      <form
        className="add-collection-panel__form"
        onSubmit={handleSubmit}
        onDrop={(event) => {
          event.preventDefault();
          routeDroppedFile(event.dataTransfer.files);
        }}
        onDragOver={(event) => event.preventDefault()}
        onPaste={(event) => routeDroppedFile(event.clipboardData.files)}
      >
        <Stack gap="md">
          <Text className="add-collection-panel__hint" size="sm">
            Drag and drop an image file, or paste from clipboard.
          </Text>

          <TextInput
            label="Collection name"
            placeholder="Enter collection name"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            required
            withAsterisk={false}
            radius="sm"
            classNames={{
              label: "add-collection-panel__field-label",
              input: "add-collection-panel__field-input",
            }}
          />

          <ImgInput
            file={imageFile}
            onChange={setImageFile}
            label="Collection image"
            placeholder="Click to upload image"
          />

          <TagsInput
            tags={tags}
            setTags={setTags}
            autocomplete={tagAutocomplete}
          />

          <Button
            type="submit"
            radius="xs"
            loading={isSubmitting}
            className="add-collection-panel__button"
          >
            Add Collection
          </Button>
        </Stack>
      </form>
    </div>
  );
}

export default AddCollection;
