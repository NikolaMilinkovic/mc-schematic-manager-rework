type ValidateCollectionFormArgs = {
  name: string;
  tags: string[];
};

type ValidateCollectionFormResult = {
  name: string;
  tags: string[];
  error: string | null;
};

export function validateCollectionForm({
  name,
  tags,
}: ValidateCollectionFormArgs): ValidateCollectionFormResult {
  const normalizedName = name.trim();
  const normalizedTags = Array.from(
    new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
  );

  if (!normalizedName) {
    return {
      name: normalizedName,
      tags: normalizedTags,
      error: "Collection must have a name.",
    };
  }

  if (normalizedTags.length === 0) {
    return {
      name: normalizedName,
      tags: normalizedTags,
      error: "Collection must have at least one tag.",
    };
  }

  return {
    name: normalizedName,
    tags: normalizedTags,
    error: null,
  };
}
