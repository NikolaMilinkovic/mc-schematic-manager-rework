import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Badge, Button, Group, Image, Skeleton, Text } from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { Blurhash } from "react-blurhash";
import { useNavigate } from "react-router-dom";
import ActionConfirmModal from "../../../../components/actionConfirmModal/ActionConfirmModal";
import { popupMessage } from "../../../../lib/popupMessage";
import {
  type Collection,
  useCollectionsStore,
} from "../../../../store/collections_store";
import "./collection-row.scss";

type CollectionRowProps = {
  collection: Collection;
  onRemove?: (collectionId: string) => void;
};

const IMAGE_REVEAL_DELAY_MS = 320;

function CollectionRow({ collection, onRemove }: CollectionRowProps) {
  const [imageVisible, setImageVisible] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const revealTimeoutRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const removeCollection = useCollectionsStore(
    (state) => state.removeCollection,
  );
  const isSubmitting = useCollectionsStore((state) => state.isSubmitting);

  const blurHash = collection.blur_hash?.hash?.trim() ?? "";
  const hasBlurHash = blurHash.length > 0;
  const blurWidth = collection.blur_hash?.width ?? 32;
  const blurHeight = collection.blur_hash?.height ?? 32;

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current !== null) {
        window.clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  function handleImageLoad() {
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
    }
    revealTimeoutRef.current = window.setTimeout(() => {
      setImageVisible(true);
      revealTimeoutRef.current = null;
    }, IMAGE_REVEAL_DELAY_MS);
  }

  function handleOpenCollection() {
    navigate(`/collections/${collection._id}`);
  }

  function handleRemove(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setConfirmOpen(true);
  }

  function handleEdit(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    navigate(`/collections/${collection._id}`);
  }

  async function handleConfirmRemove() {
    const result = await removeCollection(collection._id);
    if (!result.success) {
      popupMessage(result.message, "error");
      return;
    }

    setConfirmOpen(false);
    onRemove?.(collection._id);
    popupMessage(result.message, "success");
  }

  return (
    <>
      <ActionConfirmModal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmRemove}
        title="Remove Collection"
        description="This will permanently remove the collection. This action cannot be undone."
        confirmLabel="Remove"
        isLoading={isSubmitting}
      />

      <div
        className="collection-row"
        onClick={handleOpenCollection}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleOpenCollection();
          }
        }}
      >
        <div className="collection-row__image-wrap">
          {!imageVisible && hasBlurHash && (
            <div className="collection-row__blurhash" aria-hidden="true">
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
          {!imageVisible && !hasBlurHash && (
            <Skeleton className="collection-row__image-skeleton" />
          )}
          {collection.image?.url ? (
            <Image
              src={collection.image.url}
              alt={`${collection.name} preview`}
              className={`collection-row__image${imageVisible ? " collection-row__image--loaded" : ""}`}
              onLoad={handleImageLoad}
              radius="xs"
              loading="lazy"
            />
          ) : (
            <div className="collection-row__image-placeholder">No preview</div>
          )}
        </div>

        <Text className="collection-row__title">{collection.name}</Text>

        <Group gap={6} wrap="nowrap" className="collection-row__tags-wrap">
          {collection.tags?.slice(0, 4).map((tag) => (
            <Badge
              key={tag}
              className="collection-row__tag"
              variant="light"
              color="blue"
              size="xs"
            >
              {tag}
            </Badge>
          ))}
        </Group>

        <Group gap={8} wrap="nowrap" className="collection-row__actions">
          <Button
            radius="xs"
            variant="subtle"
            aria-label="Edit collection"
            onClick={handleEdit}
            className="collection-row__button collection-row__button--edit"
          >
            <IconEdit size={16} />
          </Button>
          <Button
            radius="xs"
            variant="subtle"
            aria-label="Remove collection"
            onClick={handleRemove}
            className="collection-row__button collection-row__button--danger"
          >
            <IconTrash size={16} />
          </Button>
        </Group>
      </div>
    </>
  );
}

export default CollectionRow;
