import type { ReactNode } from "react";
import { ActionIcon, HoverCard, Text } from "@mantine/core";
import { IconQuestionMark } from "@tabler/icons-react";
import "./input-info-icon.scss";

// Example usage:

// Local inapp link
{
  /* <TextInput
  label="Studio Name"
  name="studioName"
  value={formData.studioName}
  onChange={onChange}
  autoComplete="organization"
  rightSection={
    <InputInfoIcon
      ariaLabel="Studio name information"
      content={
        <Text size="sm">
          Your public studio name. This will be visible to other users. If you
          want to learn more about studios{" "}
          <Anchor component={Link} to="/your-route-here">
            click here
          </Anchor>
          .
        </Text>
      }
    />
  }
  rightSectionPointerEvents="all"
  rightSectionWidth={36}
  classNames={{
    input: "register-page__input",
    label: "register-page__label",
  }}
/> */
}

// To an outside link
{
  /* <InputInfoIcon
  ariaLabel="Studio name information"
  content={
    <Text size="sm">
      Learn more about studios{" "}
      <Anchor href="https://example.com" target="_blank" rel="noreferrer">
        here
      </Anchor>
      .
    </Text>
  }
/> */
}

type InputInfoIconProps = {
  label?: string;
  content?: ReactNode;
  ariaLabel?: string;
};

function InputInfoIcon({ label, content, ariaLabel }: InputInfoIconProps) {
  const resolvedAriaLabel = ariaLabel ?? label ?? "Show field information";

  return (
    <HoverCard
      withArrow
      openDelay={120}
      closeDelay={140}
      shadow="md"
      width={260}
      position="top-end"
      withinPortal
    >
      <HoverCard.Target>
        <ActionIcon
          type="button"
          variant="subtle"
          radius="sm"
          size="sm"
          aria-label={resolvedAriaLabel}
          className="input-info-icon"
        >
          <IconQuestionMark size={14} stroke={2.4} />
        </ActionIcon>
      </HoverCard.Target>

      <HoverCard.Dropdown className="input-info-icon__dropdown">
        <div className="input-info-icon__content">
          {content ?? <Text size="sm">{label}</Text>}
        </div>
      </HoverCard.Dropdown>
    </HoverCard>
  );
}

export default InputInfoIcon;
