import { useEffect, useState } from "react";
import { Button, Stack, Text, TextInput, Title } from "@mantine/core";
import customFetch from "../../lib/custom_fetch";
import { popupMessage } from "../../lib/popupMessage";
import { compressImage, encodeToBlurHash } from "../../lib/imageUtils";
import FileInput from "./components/fileInput/FileInput";
import ImgInput from "./components/imgInput/ImgInput";
import TagsInput from "./components/tagsInput/TagsInput";
import AuthenticatedPageBackground from "../../components/authenticatedPageBackground/AuthenticatedPageBackground";
import CollectionsPicker, {
  type Collection,
} from "./components/collectionsPicker/CollectionsPicker";
import { useCollectionsStore } from "../../store/collections_store";
import "./upload-schematic.scss";

type TagsResponse = Array<{ tags: string[] }>;

const IMG_TYPES = new Set(["png", "jpg", "jpeg"]);
const SCHEM_TYPES = new Set(["schematic", "schem"]);

function fileExt(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function uniqueTags(tags: string[]): string[] {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
}

function UploadSchematic() {
  const [isPageEntering, setIsPageEntering] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [schematicName, setSchematicName] = useState("");
  const [tagAutocomplete, setTagAutocomplete] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Collection[]>(
    [],
  );
  const [schematicFile, setSchematicFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const collectionsList = useCollectionsStore(
    (state) => state.collectionOptions,
  );
  const fetchCollectionOptions = useCollectionsStore(
    (state) => state.fetchCollectionOptions,
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsPageEntering(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "page-scroll-lock",
      isPageEntering,
    );
    document.body.classList.toggle("page-scroll-lock", isPageEntering);

    return () => {
      document.documentElement.classList.remove("page-scroll-lock");
      document.body.classList.remove("page-scroll-lock");
    };
  }, [isPageEntering]);

  useEffect(() => {
    void fetchCollectionOptions();
  }, [fetchCollectionOptions]);

  useEffect(() => {
    async function fetchTags() {
      const res = await customFetch<TagsResponse>("/get-tags", "GET");
      const firstEntry = res.data[0];
      if (firstEntry?.tags) {
        setTagAutocomplete(uniqueTags(firstEntry.tags));
      }
    }
    fetchTags();
  }, []);

  function resetForm() {
    setTags([]);
    setSchematicName("");
    setSchematicFile(null);
    setImageFile(null);
    setSelectedCollections([]);
  }

  async function submitSchematic(event: React.FormEvent) {
    event.preventDefault();

    if (!schematicName.trim()) {
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
    if (tags.length < 1) {
      popupMessage("Please add at least one tag to continue.", "error");
      return;
    }

    setIsSubmitting(true);
    popupMessage("Schematic is being processed...", "info");

    try {
      const formData = new FormData();

      const compressedImage = await compressImage(imageFile);

      const toBase64 = (blob: Blob): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
        });

      const imageBase64 = await toBase64(compressedImage);
      formData.append("image", imageBase64);

      const { blurHash, width, height } =
        await encodeToBlurHash(compressedImage);
      formData.append("blurHash", blurHash);
      formData.append("blurHashWidth", String(width));
      formData.append("blurHashHeight", String(height));

      formData.append("schematicFile", schematicFile);
      formData.append("tags", tags.join(","));
      formData.append("schematicName", schematicName);
      formData.append("collectionsList", JSON.stringify(selectedCollections));

      const response = await customFetch<unknown>(
        "/upload-schematic",
        "POST",
        formData,
      );

      if (response.status === 201) {
        resetForm();
        popupMessage("Schematic uploaded successfully!", "success");
      } else if (response.status === 400) {
        popupMessage(
          "This schematic already exists on your profile - canceling upload.",
          "error",
        );
      } else {
        popupMessage("Error uploading the schematic.", "error");
      }
    } catch (err) {
      console.error(err);
      popupMessage("Unexpected error during upload.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function routeDroppedFile(files: FileList) {
    const file = files[0];
    if (!file) return;
    const ext = fileExt(file);
    if (IMG_TYPES.has(ext)) setImageFile(file);
    if (SCHEM_TYPES.has(ext)) setSchematicFile(file);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    routeDroppedFile(event.dataTransfer.files);
  }

  function handlePaste(event: React.ClipboardEvent) {
    routeDroppedFile(event.clipboardData.files);
  }

  return (
    <AuthenticatedPageBackground
      className={`upload-schematic${isPageEntering ? " page-fade-in" : ""}`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onPaste={handlePaste}
      onAnimationEnd={(event) => {
        if (event.animationName === "page-fade-in") {
          setIsPageEntering(false);
        }
      }}
    >
      <div className="upload-schematic__content">
        <form
          className="upload-schematic__form"
          onSubmit={submitSchematic}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
        >
          <Title order={2} className="upload-schematic__title">
            Upload Schematic
          </Title>

          <Text className="upload-schematic__hint" size="sm">
            Drag and drop files anywhere on the page, or paste from clipboard.
          </Text>

          <Stack gap="md">
            <TextInput
              label="Name"
              placeholder="Enter a name..."
              value={schematicName}
              onChange={(e) => setSchematicName(e.target.value)}
              required
              withAsterisk={false}
              classNames={{
                label: "upload-schematic__field-label",
                input: "upload-schematic__field-input",
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
              updateSchematicCollections={setSelectedCollections}
            />

            <Button
              type="submit"
              fullWidth
              loading={isSubmitting}
              className="upload-schematic__submit"
            >
              Upload Schematic
            </Button>
          </Stack>
        </form>
      </div>
    </AuthenticatedPageBackground>
  );
}

export default UploadSchematic;
