import { useCallback, useState } from "react";
import customFetch from "../../../src/lib/custom_fetch";
import SchematicRendererDemoModal from "./SchematicRendererDemoModal";

type SchematicRendererDemoLauncherProps = {
  schematicId: string;
  schematicName: string;
};

function SchematicRendererDemoLauncher({
  schematicId,
  schematicName,
}: SchematicRendererDemoLauncherProps) {
  const [opened, setOpened] = useState(false);

  const loadSchematicArrayBuffer = useCallback(async () => {
    const response = await customFetch<Response>(
      `/get-schematic-file/${schematicId}`,
      "GET",
    );

    if (!(response.data instanceof Response) || !response.data.ok) {
      throw new Error("Could not fetch schematic binary.");
    }

    return response.data.arrayBuffer();
  }, [schematicId]);

  return (
    <>
      <button type="button" onClick={() => setOpened(true)}>
        Open 3D demo
      </button>

      <SchematicRendererDemoModal
        opened={opened}
        onClose={() => setOpened(false)}
        schematicName={schematicName}
        loadSchematicArrayBuffer={loadSchematicArrayBuffer}
      />
    </>
  );
}

export default SchematicRendererDemoLauncher;
