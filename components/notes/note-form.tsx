"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Note } from "@/lib/types/note";
import { cn } from "@/lib/utils";

interface NoteFormProps {
  note?: Note;
  onSubmit: (data: { title: string; content: string }) => void;
  onCancel?: () => void;
  className?: string;
}

const TITLE_MAX_LENGTH = 100;
const CONTENT_MAX_LENGTH = 5000;

export function NoteForm({ note, onSubmit, onCancel, className }: NoteFormProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
    } else {
      setTitle("");
      setContent("");
    }
    setErrors({});
  }, [note]);

  const validate = (): boolean => {
    const newErrors: { title?: string; content?: string } = {};

    if (title.trim().length === 0) {
      newErrors.title = "Title is required";
    } else if (title.length > TITLE_MAX_LENGTH) {
      newErrors.title = `Title must be ${TITLE_MAX_LENGTH} characters or less`;
    }

    if (content.length > CONTENT_MAX_LENGTH) {
      newErrors.content = `Content must be ${CONTENT_MAX_LENGTH} characters or less`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ title: title.trim(), content: content.trim() });
    }
  };

  const titleRemaining = TITLE_MAX_LENGTH - title.length;
  const contentRemaining = CONTENT_MAX_LENGTH - content.length;

  return (
    <form id="note-form" onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="title" className="text-sm font-medium">
            Title
          </Label>
          <span
            className={cn(
              "text-xs text-muted-foreground",
              titleRemaining < 10 && "text-accent"
            )}
          >
            {titleRemaining} remaining
          </span>
        </div>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter note title..."
          maxLength={TITLE_MAX_LENGTH}
          className={cn(
            "rounded-lg",
            errors.title && "border-destructive focus-visible:ring-destructive"
          )}
          autoFocus
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="content" className="text-sm font-medium">
            Content
          </Label>
          <span
            className={cn(
              "text-xs text-muted-foreground",
              contentRemaining < 100 && "text-accent"
            )}
          >
            {contentRemaining} remaining
          </span>
        </div>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note content..."
          maxLength={CONTENT_MAX_LENGTH}
          rows={12}
          className={cn(
            "rounded-lg resize-none",
            errors.content && "border-destructive focus-visible:ring-destructive"
          )}
        />
        {errors.content && (
          <p className="text-xs text-destructive">{errors.content}</p>
        )}
      </div>
    </form>
  );
}

