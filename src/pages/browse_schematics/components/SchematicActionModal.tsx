import { Button, Group, Modal, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import "./schematic-action-modal.scss";

type SchematicActionMode = "delete" | "remove";

type SchematicActionModalProps = {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  mode: SchematicActionMode;
  isLoading?: boolean;
};

function SchematicActionModal({
  opened,
  onClose,
  onConfirm,
  mode,
  isLoading = false,
}: SchematicActionModalProps) {
  const isDeleteMode = mode === "delete";

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      radius="sm"
      withCloseButton={false}
      classNames={{
        content: "schematic-action-modal__content",
        body: "schematic-action-modal__body",
      }}
    >
      <Stack gap="md" align="center">
        <ThemeIcon
          size={54}
          radius="xl"
          variant="light"
          className="schematic-action-modal__icon-wrap"
        >
          <IconAlertTriangle
            size={30}
            className="schematic-action-modal__icon"
          />
        </ThemeIcon>

        <Text className="schematic-action-modal__title">
          {isDeleteMode ? "Delete Schematic" : "Remove From Collection"}
        </Text>

        <Text className="schematic-action-modal__text">
          {isDeleteMode
            ? "This will permanently delete the schematic. This action cannot be undone."
            : "This will only remove the schematic from the current collection."}
        </Text>

        <Group grow className="schematic-action-modal__actions">
          <Button
            radius="xs"
            variant="subtle"
            onClick={onClose}
            disabled={isLoading}
            className="schematic-action-modal__button schematic-action-modal__button--cancel"
          >
            Cancel
          </Button>
          <Button
            radius="xs"
            variant="subtle"
            onClick={onConfirm}
            loading={isLoading}
            className="schematic-action-modal__button schematic-action-modal__button--danger"
          >
            {isDeleteMode ? "Delete" : "Remove"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default SchematicActionModal;
