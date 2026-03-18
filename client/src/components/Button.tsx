import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { Link, type LinkProps } from "react-router-dom";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

function classes(...values: Array<string | false | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      {...props}
      className={classes("btn", `btn-${variant}`, `btn-${size}`, fullWidth && "btn-full", className)}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "secondary",
  size = "md",
  fullWidth,
  className,
  children,
  ...props
}: PropsWithChildren<ButtonLinkProps>) {
  return (
    <Link
      {...props}
      className={classes("btn", `btn-${variant}`, `btn-${size}`, fullWidth && "btn-full", className)}
    >
      {children}
    </Link>
  );
}
