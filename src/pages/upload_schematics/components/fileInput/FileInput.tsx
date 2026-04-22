import { FileInput as MantineFileInput } from "@mantine/core";
import { IconFile, IconUpload } from "@tabler/icons-react";
import "./file-input.scss";

type FileInputProps = {
  file: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  placeholder?: string;
};

function FileInput({
  file,
  onChange,
  label = "File",
  placeholder = "Click to upload (.schematic / .schem / .zip)",
}: FileInputProps) {
  return (
    <div className="file-input">
      <MantineFileInput
        label={label}
        placeholder={placeholder}
        value={file}
        onChange={onChange}
        accept=".schematic,.schem,.zip"
        clearable
        leftSection={
          <span className="file-input__icon">
            {file ? <IconFile size={16} /> : <IconUpload size={16} />}
          </span>
        }
        classNames={{
          label: "file-input__label",
          input: "file-input__input",
        }}
      />
    </div>
  );
}

export default FileInput;
