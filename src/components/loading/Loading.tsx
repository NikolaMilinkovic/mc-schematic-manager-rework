import { Loader } from "@mantine/core";
import "./loading.scss";

function Loading() {
  return (
    <div
      className="loading"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <Loader className="loading__spinner" size="md" type="oval" />
    </div>
  );
}

export default Loading;
