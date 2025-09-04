import { Button as ShadcnButton } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

export interface ButtonProps extends React.ComponentProps<typeof ShadcnButton> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ loading, children, disabled, ...props }, ref) => {
    return (
      <ShadcnButton
        ref={ref}
        disabled={loading || disabled}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </ShadcnButton>
    );
  }
);

Button.displayName = "Button";