import { useEffect, useMemo, useState } from "react";
import { MultiSelect } from "@mantine/core";
import "./collections-picker.scss";

export type Collection = {
  collection_id: string;
  collection_name: string;
};

type CollectionsPickerProps = {
  collectionsData?: Collection[];
  currentCollectionsData?: Collection[];
  updateSchematicCollections: (collections: Collection[]) => void;
};

function uniqueByCollectionId(collections: Collection[]): Collection[] {
  return collections.filter(
    (collection, index, list) =>
      index ===
      list.findIndex((item) => item.collection_id === collection.collection_id),
  );
}

function normalizeCollection(input: unknown): Collection | null {
  if (!input || typeof input !== "object") return null;

  const record = input as Record<string, unknown>;
  const rawId = record.collection_id ?? record._id ?? record.id;
  if (rawId === null || rawId === undefined) return null;

  const collection_id = String(rawId).trim();
  if (!collection_id) return null;

  const rawName = record.collection_name ?? record.name ?? record.label;
  const collection_name =
    typeof rawName === "string" && rawName.trim()
      ? rawName.trim()
      : `Collection ${collection_id}`;

  return { collection_id, collection_name };
}

function sameIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((id, index) => id === b[index]);
}

function CollectionsPicker({
  collectionsData,
  currentCollectionsData,
  updateSchematicCollections,
}: CollectionsPickerProps) {
  const normalizedCollections = useMemo(
    () =>
      uniqueByCollectionId(
        (collectionsData ?? [])
          .map((collection) => normalizeCollection(collection))
          .filter((collection): collection is Collection =>
            Boolean(collection),
          ),
      ),
    [collectionsData],
  );

  const collectionById = useMemo(
    () =>
      new Map(
        normalizedCollections.map((collection) => [
          collection.collection_id,
          collection,
        ]),
      ),
    [normalizedCollections],
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const incomingIds = Array.from(
      new Set(
        (currentCollectionsData ?? [])
          .map((collection) => normalizeCollection(collection))
          .filter((collection): collection is Collection => Boolean(collection))
          .map((collection) => collection.collection_id),
      ),
    );

    setSelectedIds((prevSelectedIds) =>
      sameIds(prevSelectedIds, incomingIds) ? prevSelectedIds : incomingIds,
    );
  }, [currentCollectionsData]);

  useEffect(() => {
    const selectedCollections = selectedIds
      .map((collectionId) => collectionById.get(collectionId))
      .filter((collection): collection is Collection => Boolean(collection));

    updateSchematicCollections(selectedCollections);
  }, [selectedIds, collectionById, updateSchematicCollections]);

  const data = useMemo(
    () =>
      normalizedCollections.map((collection) => ({
        value: collection.collection_id,
        label: collection.collection_name,
      })),
    [normalizedCollections],
  );

  return (
    <div className="collections-picker">
      <MultiSelect
        label="Add / Remove from collections"
        placeholder="Search and select collections…"
        data={data}
        value={selectedIds}
        onChange={setSelectedIds}
        searchable
        hidePickedOptions
        clearable
        radius="sm"
        nothingFoundMessage="No collections found"
        classNames={{
          label: "collections-picker__label",
          input: "collections-picker__input",
          pillsList: "collections-picker__pills-list",
          inputField: "collections-picker__input-field",
          dropdown: "collections-picker__dropdown",
          option: "collections-picker__option",
          pill: "collections-picker__pill",
        }}
      />
    </div>
  );
}

export default CollectionsPicker;
