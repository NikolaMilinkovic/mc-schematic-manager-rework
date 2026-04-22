import { TagsInput as MantineTagsInput } from "@mantine/core";
import "./tags-input.scss";

type TagsInputProps = {
  tags: string[];
  setTags: (tags: string[]) => void;
  autocomplete?: string[];
};

function TagsInput({ tags, setTags, autocomplete = [] }: TagsInputProps) {
  const safeAutocomplete = Array.from(
    new Set(autocomplete.map((tag) => tag.trim()).filter(Boolean)),
  );
  const safeTags = Array.from(
    new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
  );

  return (
    <div className="tags-input">
      <MantineTagsInput
        label="Tags"
        placeholder="Type a tag and press Enter"
        data={safeAutocomplete}
        value={safeTags}
        onChange={(nextTags) => {
          setTags(
            Array.from(
              new Set(nextTags.map((tag) => tag.trim()).filter(Boolean)),
            ),
          );
        }}
        classNames={{
          label: "tags-input__label",
          input: "tags-input__input",
          inputField: "tags-input__input-field",
          pillsList: "tags-input__pills-list",
          dropdown: "tags-input__dropdown",
          option: "tags-input__option",
          pill: "tags-input__pill",
        }}
      />
    </div>
  );
}

export default TagsInput;
