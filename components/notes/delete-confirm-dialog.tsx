"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteTitle: string;
  onConfirm: () => void;
  isPermanent?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  noteTitle,
  onConfirm,
  isPermanent = false,
}: DeleteConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {isPermanent ? 'Delete Note Permanently' : 'Move to Trash'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {isPermanent ? 'This action cannot be undone.' : 'You can restore it from trash later.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-foreground">
            {isPermanent ? (
              <>
                Are you sure you want to permanently delete{" "}
                <span className="font-medium">"{noteTitle}"</span>? This action cannot be undone.
              </>
            ) : (
              <>
                Move <span className="font-medium">"{noteTitle}"</span> to trash? You can restore it later.
              </>
            )}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="rounded-lg"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            className="rounded-lg"
          >
            {isPermanent ? 'Delete Permanently' : 'Move to Trash'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

