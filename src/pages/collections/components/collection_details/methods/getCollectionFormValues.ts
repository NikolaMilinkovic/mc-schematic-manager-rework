import type { CollectionDetail } from "../../../../../store/collections_store";

export type CollectionFormValues = {
  name: string;
  tags: string[];
  imagePreview: string;
};

export function getCollectionFormValues(
  collection: CollectionDetail | null,
): CollectionFormValues {
  return {
    name: collection?.name ?? "",
    tags: collection?.tags ?? [],
    imagePreview: collection?.image?.url ?? "",
  };
}
