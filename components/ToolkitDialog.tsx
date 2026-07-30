import { Wrench } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocCalc } from "@/components/DocCalc";

interface ToolkitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** 工具箱弹窗 */
export function ToolkitDialog({ open, onOpenChange }: ToolkitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Wrench className="h-5 w-5" strokeWidth={2.5} />
            <span>工具箱</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto neo-scroll -mr-2 pr-2">
          <DocCalc />
        </div>
      </DialogContent>
    </Dialog>
  );
}
