import { memo, useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Group,
  Image,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
import { IconDownload, IconEdit, IconTrash } from "@tabler/icons-react";
import { Blurhash } from "react-blurhash";
import { Link } from "react-router-dom";
import type { Schematic } from "../../../store/schematic_store";
import { selectActiveUser, useUserStore } from "../../../store/user_store";
import SchematicActionModal from "./SchematicActionModal";
import {
  copySchematicStringAction,
  deleteSchematicAction,
  downloadSchematicAction,
  removeSchematicFromCollectionAction,
} from "./methods/schematic-card-methods";
import "./schematic-card.scss";

type SchematicPermissionKey =
  | "get_schematic"
  | "edit_schematic"
  | "download_schematic"
  | "remove_schematic";

type PermissionShape = {
  permissions?: {
    schematic?: Partial<Record<SchematicPermissionKey, boolean>>;
  };
};

type SchematicCardProps = {
  schematic: Schematic;
  onRemoved?: (schematicId: string) => void;
  collectionId?: string;
};

const IMAGE_REVEAL_DELAY_MS = 320;

function hasSchematicPermission(
  activeUser: unknown,
  permission: SchematicPermissionKey,
): boolean {
  if (!activeUser || typeof activeUser !== "object") {
    return false;
  }

  const permissions = (activeUser as PermissionShape).permissions;
  return Boolean(permissions?.schematic?.[permission]);
}

function SchematicCard({
  schematic,
  onRemoved,
  collectionId,
}: SchematicCardProps) {
  const activeUser = useUserStore(selectActiveUser);
  const [copied, setCopied] = useState(false);
  const [imageVisible, setImageVisible] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"delete" | "remove">("delete");
  const [isBusy, setIsBusy] = useState(false);
  const revealTimeoutRef = useRef<number | null>(null);

  const blurHash = schematic.blur_hash?.hash?.trim() ?? "";
  const hasBlurHash = blurHash.length > 0;
  const blurWidth = schematic.blur_hash?.width ?? 32;
  const blurHeight = schematic.blur_hash?.height ?? 32;

  const canGetSchematic = hasSchematicPermission(activeUser, "get_schematic");
  const canEditSchematic = hasSchematicPermission(activeUser, "edit_schematic");
  const canDownloadSchematic = hasSchematicPermission(
    activeUser,
    "download_schematic",
  );
  const canRemoveSchematic = hasSchematicPermission(
    activeUser,
    "remove_schematic",
  );

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current !== null) {
        window.clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  function openConfirm(mode: "delete" | "remove") {
    setConfirmMode(mode);
    setConfirmOpen(true);
  }

  async function handleDownload() {
    setIsBusy(true);
    try {
      await downloadSchematicAction({
        schematicId: schematic._id,
        schematicName: schematic.name,
        originalFileName: schematic.original_file_name,
      });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCopySchematicString() {
    setIsBusy(true);
    try {
      const copiedSchematic = await copySchematicStringAction(schematic._id);
      if (copiedSchematic) {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 900);
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDeleteSchematic() {
    setIsBusy(true);
    try {
      const deleted = await deleteSchematicAction(schematic._id);
      if (deleted) {
        onRemoved?.(schematic._id);
        setConfirmOpen(false);
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRemoveFromCollection() {
    if (!collectionId) {
      return;
    }

    setIsBusy(true);
    try {
      const removedFromCollection = await removeSchematicFromCollectionAction(
        schematic._id,
        collectionId,
      );
      if (removedFromCollection) {
        onRemoved?.(schematic._id);
        setConfirmOpen(false);
      }
    } finally {
      setIsBusy(false);
    }
  }

  function handleConfirmAction() {
    if (confirmMode === "delete") {
      void handleDeleteSchematic();
      return;
    }

    void handleRemoveFromCollection();
  }

  function handleImageLoad() {
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
    }

    revealTimeoutRef.current = window.setTimeout(() => {
      setImageVisible(true);
      revealTimeoutRef.current = null;
    }, IMAGE_REVEAL_DELAY_MS);
  }

  return (
    <Card className="schematic-card" radius="sm" p="md">
      {confirmOpen && (
        <SchematicActionModal
          opened={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirmAction}
          mode={confirmMode}
          isLoading={isBusy}
        />
      )}

      <Text className="schematic-card__title">{schematic.name}</Text>

      <div className="schematic-card__image-wrap">
        {!imageVisible && hasBlurHash && (
          <div className="schematic-card__blurhash" aria-hidden="true">
            <Blurhash
              hash={blurHash}
              width={blurWidth}
              height={blurHeight}
              resolutionX={32}
              resolutionY={32}
              punch={1}
            />
          </div>
        )}
        {!imageVisible && !hasBlurHash && (
          <Skeleton className="schematic-card__image-skeleton" />
        )}
        {schematic.image?.url ? (
          <Image
            src={schematic.image.url}
            alt={`${schematic.name} preview`}
            className={`schematic-card__image${imageVisible ? " schematic-card__image--loaded" : ""}`}
            onLoad={handleImageLoad}
            radius="xs"
            loading="lazy"
          />
        ) : (
          <div className="schematic-card__image-placeholder">
            No preview image
          </div>
        )}
      </div>

      <Stack gap={8} mt="sm" className="schematic-card__actions">
        {canGetSchematic && (
          <Button
            radius="xs"
            variant="subtle"
            onClick={handleCopySchematicString}
            loading={isBusy}
            className="schematic-card__button schematic-card__button--get"
          >
            {copied ? "Copied to clipboard" : "Get schematic"}
          </Button>
        )}

        <Group grow gap={8}>
          {canEditSchematic && (
            <Button
              radius="xs"
              variant="subtle"
              component={Link}
              to={`/edit-schematic/${schematic._id}`}
              className="schematic-card__button schematic-card__button--muted"
            >
              <IconEdit size={15} />
            </Button>
          )}
          {canDownloadSchematic && (
            <Button
              radius="xs"
              variant="subtle"
              onClick={handleDownload}
              loading={isBusy}
              className="schematic-card__button schematic-card__button--muted"
            >
              <IconDownload size={15} />
            </Button>
          )}
          {canRemoveSchematic && (
            <Button
              radius="xs"
              variant="subtle"
              color="red"
              onClick={() => openConfirm("delete")}
              disabled={isBusy}
              className="schematic-card__button schematic-card__button--danger"
            >
              <IconTrash size={15} />
            </Button>
          )}
        </Group>

        {collectionId && canRemoveSchematic && (
          <Button
            radius="xs"
            variant="subtle"
            color="red"
            leftSection={<IconTrash size={15} />}
            onClick={() => openConfirm("remove")}
            disabled={isBusy}
            className="schematic-card__button schematic-card__button--danger"
          >
            Remove from collection
          </Button>
        )}
      </Stack>
    </Card>
  );
}

export default memo(SchematicCard);
