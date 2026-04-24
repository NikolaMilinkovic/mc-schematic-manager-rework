import { useState, useRef, useEffect } from "react";
import type { MouseEvent } from "react";
import {
  Button,
  Card,
  Group,
  Badge,
  Image,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { Blurhash } from "react-blurhash";
import "./collection-card.scss";
import ActionConfirmModal from "../../../../components/actionConfirmModal/ActionConfirmModal";
import type { Collection } from "../../../../store/collections_store";
import { useNavigate } from "react-router-dom";

type CollectionCardProps = {
  collection: Collection;
  onRemove?: (collectionId: string) => void;
};

const IMAGE_REVEAL_DELAY_MS = 320;

function CollectionCard({ collection, onRemove }: CollectionCardProps) {
  const [imageVisible, setImageVisible] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const revealTimeoutRef = useRef<number | null>(null);
  const navigate = useNavigate();

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

  function handleRemove(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setConfirmOpen(true);
  }

  function handleConfirmRemove() {
    setConfirmOpen(false);
    onRemove?.(collection._id);
  }

  function handleCancelRemove() {
    setConfirmOpen(false);
  }

  return (
    <>
      <ActionConfirmModal
        opened={confirmOpen}
        onClose={handleCancelRemove}
        onConfirm={handleConfirmRemove}
        title="Remove Collection"
        description="This will permanently remove the collection. This action cannot be undone."
        confirmLabel="Remove"
      />

      <Card
        className="collection-card"
        radius="sm"
        p="md"
        onClick={() => navigate(`/collections/${collection._id}`)}
      >
        <Text className="collection-card__title">{collection.name}</Text>

        <div className="collection-card__image-wrap">
          {!imageVisible && hasBlurHash && (
            <div className="collection-card__blurhash" aria-hidden="true">
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
            <Skeleton className="collection-card__image-skeleton" />
          )}
          {collection.image?.url ? (
            <Image
              src={collection.image.url}
              alt={`${collection.name} preview`}
              className={`collection-card__image${imageVisible ? " collection-card__image--loaded" : ""}`}
              onLoad={handleImageLoad}
              radius="xs"
              loading="lazy"
            />
          ) : (
            <div className="collection-card__image-placeholder">
              No preview image
            </div>
          )}
        </div>

        <Stack gap={8} mt="sm" className="collection-card__actions">
          <Group
            gap={8}
            justify="center"
            className="collection-card__tags-wrap"
          >
            {collection.tags?.map((tag) => (
              <Badge
                key={tag}
                className="collection-card__tag"
                variant="light"
                color="blue"
                size="sm"
              >
                {tag}
              </Badge>
            ))}
          </Group>
          <Button
            radius="xs"
            variant="subtle"
            color="red"
            leftSection={<IconTrash size={15} />}
            onClick={handleRemove}
            className="collection-card__button collection-card__button--danger"
          >
            Remove
          </Button>
        </Stack>
      </Card>
    </>
  );
}

export default CollectionCard;
