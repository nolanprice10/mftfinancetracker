import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InfoButtonProps {
  title: string;
  content: string | React.ReactNode;
  className?: string;
}

/**
 * InfoButton - A reusable component that displays an info icon with a tooltip
 * Helps explain confusing financial concepts in simple terms
 */
export const InfoButton = ({ title, content, className = "" }: InfoButtonProps) => {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-5 w-5 p-0 hover:bg-primary/10 ${className}`}
            type="button"
          >
            <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
          </Button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs p-4 bg-popover border-border shadow-xl"
          sideOffset={5}
        >
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-foreground">{title}</h4>
            <div className="text-xs text-muted-foreground leading-relaxed">
              {content}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
