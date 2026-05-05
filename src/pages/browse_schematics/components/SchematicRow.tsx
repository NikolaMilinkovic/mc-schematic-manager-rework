import {
  memo,
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useState,
} from "react";
import { Button, Group, Text } from "@mantine/core";
import {
  IconDownload,
  IconEdit,
  IconTrash,
  IconCube,
} from "@tabler/icons-react";
import { Blurhash } from "react-blurhash";
import { Link } from "react-router-dom";
import ActionConfirmModal from "../../../components/actionConfirmModal/ActionConfirmModal";
import SchematicImage from "../../../components/schematicImage/SchematicImage";
import type { Schematic } from "../../../store/schematic_store";
import { selectActiveUser, useUserStore } from "../../../store/user_store";
import {
  copySchematicStringAction,
  deleteSchematicAction,
  downloadSchematicAction,
  removeSchematicFromCollectionAction,
} from "./methods/schematic-card-methods";
import "./schematic-row.scss";

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

type SchematicRowProps = {
  schematic: Schematic;
  onRemoved?: (schematicId: string) => void;
  collectionId?: string;
  onOpenDemo?: (schematicId: string, schematicName: string) => void;
  onEdit?: (schematic: Schematic) => void;
};

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

function SchematicRow({
  schematic,
  onRemoved,
  collectionId,
  onOpenDemo,
  onEdit,
}: SchematicRowProps) {
  const activeUser = useUserStore(selectActiveUser);
  const [copied, setCopied] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"delete" | "remove">("delete");
  const [isBusy, setIsBusy] = useState(false);

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
  const isDeleteMode = confirmMode === "delete";

  useEffect(() => {
    setIsImageLoaded(false);
  }, [schematic.image?.url]);

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

  async function handleGetSchematic() {
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

  function handleRowClick(event: MouseEvent<HTMLDivElement>) {
    if (!canGetSchematic || isBusy) {
      return;
    }

    const target = event.target;
    if (target instanceof Element && target.closest("button, a")) {
      return;
    }

    void handleGetSchematic();
  }

  function handleRowKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!canGetSchematic || isBusy) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    void handleGetSchematic();
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

  return (
    <>
      <ActionConfirmModal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmAction}
        title={isDeleteMode ? "Delete Schematic" : "Remove From Collection"}
        description={
          isDeleteMode
            ? "This will permanently delete the schematic. This action cannot be undone."
            : "This will only remove the schematic from the current collection."
        }
        confirmLabel={isDeleteMode ? "Delete" : "Remove"}
        isLoading={isBusy}
      />
      <div
        className={`schematic-row${canGetSchematic ? " schematic-row--clickable" : ""}`}
        onClick={handleRowClick}
        onKeyDown={handleRowKeyDown}
        role={canGetSchematic ? "button" : undefined}
        tabIndex={canGetSchematic ? 0 : undefined}
      >
        <div className="schematic-row__image-wrap">
          {!isImageLoaded && hasBlurHash && (
            <div className="schematic-row__blurhash" aria-hidden="true">
              <Blurhash
                hash={blurHash}
                width={blurWidth}
                height={blurHeight}
                resolutionX={16}
                resolutionY={16}
                punch={1}
              />
            </div>
          )}
          {schematic.image?.url ? (
            <SchematicImage
              schematicId={schematic._id}
              imageUrl={schematic.image.url}
              alt={`${schematic.name} preview`}
              className="schematic-row__image"
              onLoad={() => setIsImageLoaded(true)}
              onError={() => setIsImageLoaded(false)}
              loading="lazy"
            />
          ) : (
            <div className="schematic-row__image-placeholder">
              <IconCube size={20} />
            </div>
          )}
          {onOpenDemo && (
            <button
              type="button"
              className="schematic-row__demo-button"
              onClick={(event) => {
                event.stopPropagation();
                onOpenDemo(schematic._id, schematic.name);
              }}
              aria-label="Open 3D demo"
              title="Open 3D demo"
            >
              <IconCube size={14} />
            </button>
          )}
        </div>

        <Text className="schematic-row__title">{schematic.name}</Text>

        <Group gap={6} className="schematic-row__actions" wrap="nowrap">
          {canGetSchematic && (
            <Button
              radius="xs"
              variant="subtle"
              size="xs"
              onClick={(event) => {
                event.stopPropagation();
                void handleGetSchematic();
              }}
              loading={isBusy}
              className="schematic-row__button schematic-row__button--get"
            >
              {copied ? "Copied!" : "Get"}
            </Button>
          )}

          {canEditSchematic &&
            (onEdit ? (
              <Button
                radius="xs"
                variant="subtle"
                size="xs"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(schematic);
                }}
                className="schematic-row__button schematic-row__button--muted"
              >
                <IconEdit size={14} />
              </Button>
            ) : (
              <Button
                radius="xs"
                variant="subtle"
                size="xs"
                component={Link}
                to={`/edit-schematic/${schematic._id}`}
                onClick={(event) => {
                  event.stopPropagation();
                }}
                className="schematic-row__button schematic-row__button--muted"
              >
                <IconEdit size={14} />
              </Button>
            ))}

          {canDownloadSchematic && (
            <Button
              radius="xs"
              variant="subtle"
              size="xs"
              onClick={(event) => {
                event.stopPropagation();
                void handleDownload();
              }}
              loading={isBusy}
              className="schematic-row__button schematic-row__button--muted"
            >
              <IconDownload size={14} />
            </Button>
          )}

          {canRemoveSchematic && (
            <Button
              radius="xs"
              variant="subtle"
              size="xs"
              onClick={(event) => {
                event.stopPropagation();
                openConfirm("delete");
              }}
              disabled={isBusy}
              className="schematic-row__button schematic-row__button--danger"
            >
              <IconTrash size={14} />
            </Button>
          )}

          {collectionId && canRemoveSchematic && (
            <Button
              radius="xs"
              variant="subtle"
              size="xs"
              leftSection={<IconTrash size={14} />}
              onClick={(event) => {
                event.stopPropagation();
                openConfirm("remove");
              }}
              disabled={isBusy}
              className="schematic-row__button schematic-row__button--danger"
            >
              Remove
            </Button>
          )}
        </Group>
      </div>
    </>
  );
}

export default memo(SchematicRow);
