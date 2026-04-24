import type { Schematic } from "../../../../../store/schematic_store";

export function filterCollectionSchematics(
  schematics: Schematic[],
  searchValue: string,
): Schematic[] {
  const normalizedSearchValue = searchValue.trim().toLowerCase();

  if (!normalizedSearchValue) {
    return schematics;
  }

  return schematics.filter((schematic) => {
    const matchesName = schematic.name
      .toLowerCase()
      .includes(normalizedSearchValue);
    const matchesTags = schematic.tags.some((tag) =>
      tag.toLowerCase().includes(normalizedSearchValue),
    );

    return matchesName || matchesTags;
  });
}
