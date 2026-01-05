"use client";

import { Note } from "@/lib/types/note";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NoteForm } from "./note-form";

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: Note;
  onSubmit: (data: { title: string; content: string }) => void;
}

export function NoteDialog({
  open,
  onOpenChange,
  note,
  onSubmit,
}: NoteDialogProps) {
  const isEditMode = !!note;

  const handleSubmit = (data: { title: string; content: string }) => {
    onSubmit(data);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditMode ? "Edit Note" : "New Note"}
          </DialogTitle>
        </DialogHeader>

        <NoteForm
          note={note}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />

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
            type="submit"
            form="note-form"
            className="rounded-lg bg-accent hover:bg-accent/90 text-white"
          >
            {isEditMode ? "Save Changes" : "Create Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

