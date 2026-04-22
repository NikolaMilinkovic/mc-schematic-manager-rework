import type { HTMLAttributes, ReactNode } from "react";
import "./authenticated-page-background.scss";

type AuthenticatedPageBackgroundProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

function AuthenticatedPageBackground({
  children,
  className,
  ...sectionProps
}: AuthenticatedPageBackgroundProps) {
  const rootClassName = className
    ? `authenticated-page-background ${className}`
    : "authenticated-page-background";

  return (
    <section className={rootClassName} {...sectionProps}>
      <div className="authenticated-page-background__glow authenticated-page-background__glow--right" />
      <div className="authenticated-page-background__glow authenticated-page-background__glow--left" />
      <div className="authenticated-page-background__content">{children}</div>
    </section>
  );
}

export default AuthenticatedPageBackground;
