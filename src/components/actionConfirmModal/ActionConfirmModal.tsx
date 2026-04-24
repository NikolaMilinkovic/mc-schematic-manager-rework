import { Button, Group, Modal, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import "./action-confirm-modal.scss";

type ActionConfirmModalProps = {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isLoading?: boolean;
};

function ActionConfirmModal({
  opened,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  isLoading = false,
}: ActionConfirmModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      radius="sm"
      withCloseButton={false}
      classNames={{
        content: "action-confirm-modal__content",
        body: "action-confirm-modal__body",
      }}
    >
      <Stack gap="md" align="center">
        <ThemeIcon
          size={54}
          radius="xl"
          variant="light"
          className="action-confirm-modal__icon-wrap"
        >
          <IconAlertTriangle size={30} className="action-confirm-modal__icon" />
        </ThemeIcon>

        <Text className="action-confirm-modal__title">{title}</Text>

        <Text className="action-confirm-modal__text">{description}</Text>

        <Group grow className="action-confirm-modal__actions">
          <Button
            radius="xs"
            variant="subtle"
            onClick={onClose}
            disabled={isLoading}
            className="action-confirm-modal__button action-confirm-modal__button--cancel"
          >
            {cancelLabel}
          </Button>
          <Button
            radius="xs"
            variant="subtle"
            onClick={onConfirm}
            loading={isLoading}
            className="action-confirm-modal__button action-confirm-modal__button--danger"
          >
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default ActionConfirmModal;
