import { Button } from "./ui/button";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumberStepperProps {
  value: string;
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  max?: number;
  label: string;
  disabled?: boolean;
  className?: string;
}

export const NumberStepper = ({
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  label,
  disabled = false,
  className
}: NumberStepperProps) => {
  const numValue = parseFloat(value) || 0;

  const increment = () => {
    const newValue = numValue + step;
    if (!max || newValue <= max) {
      onChange(newValue.toString());
    }
  };

  const decrement = () => {
    const newValue = numValue - step;
    if (newValue >= min) {
      onChange(newValue.toString());
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={decrement}
          disabled={disabled || numValue <= min}
          className="h-10 w-10 shrink-0"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center">
          <div className="h-10 flex items-center justify-center font-semibold text-lg border rounded-md bg-background">
            {numValue.toFixed(step < 1 ? 3 : step < 10 ? 2 : 0)}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={increment}
          disabled={disabled || (max !== undefined && numValue >= max)}
          className="h-10 w-10 shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
