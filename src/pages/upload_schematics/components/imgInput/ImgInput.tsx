import { useEffect, useRef, useState } from "react";
import { Collapse } from "@mantine/core";
import { IconChevronDown, IconPhoto, IconUpload } from "@tabler/icons-react";
import "./img-input.scss";

type ImgInputProps = {
  file: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  placeholder?: string;
};

function ImgInput({
  file,
  onChange,
  label = "Preview image",
  placeholder = "Click to upload image",
}: ImgInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      setPreviewOpen(false);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);
    setPreviewOpen(true);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [file]);

  // Derive display values from controlled prop
  const hasImage = file !== null;
  const displayText = file ? file.name : placeholder;

  function handleButtonClick() {
    inputRef.current?.click();
  }

  function processFile(f: File) {
    onChange(f);
  }

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const f = event.target.files?.[0];
    if (f) processFile(f);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    const f = event.dataTransfer.files[0];
    if (f) processFile(f);
  }

  return (
    <div className="img-input">
      <label className="img-input__label">{label}</label>
      <button
        type="button"
        className={`img-input__trigger${hasImage ? " img-input__trigger--has-image" : ""}`}
        onClick={handleButtonClick}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <span className="img-input__icon">
          {hasImage ? <IconPhoto size={16} /> : <IconUpload size={16} />}
        </span>
        <span
          className={`img-input__placeholder${hasImage ? " img-input__placeholder--has-file" : ""}`}
        >
          {displayText}
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          ref={inputRef}
          className="img-input__hidden"
        />
      </button>

      {hasImage && (
        <div className="img-input__preview-bar">
          <button
            type="button"
            className="img-input__toggle"
            onClick={() => setPreviewOpen(!previewOpen)}
          >
            <span>Preview</span>
            <IconChevronDown
              size={16}
              className={`img-input__chevron${previewOpen ? " img-input__chevron--open" : ""}`}
            />
          </button>

          <Collapse expanded={previewOpen}>
            <div className="img-input__preview">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Schematic preview"
                  className="img-input__preview-img"
                />
              )}
            </div>
          </Collapse>
        </div>
      )}
    </div>
  );
}

export default ImgInput;
