'use client';

import { useMemo, useState, useCallback } from 'react';
import type { Note } from '@/lib/types/note';

export function useNoteSearch(notes: Note[]) {
  const [searchQuery, setSearchQuery] = useState('');

  const filterNotes = useCallback((query: string, notesToSearch: Note[]): Note[] => {
    if (!query.trim()) {
      return notesToSearch;
    }

    const lowerQuery = query.toLowerCase().trim();
    
    return notesToSearch.filter((note) => {
      const titleMatch = note.title.toLowerCase().includes(lowerQuery);
      const contentMatch = note.content.toLowerCase().includes(lowerQuery);
      return titleMatch || contentMatch;
    });
  }, []);

  const highlightMatches = useCallback((text: string, query: string): Array<{ text: string; isMatch: boolean }> => {
    if (!query.trim()) {
      return [{ text, isMatch: false }];
    }

    const lowerQuery = query.toLowerCase().trim();
    const lowerText = text.toLowerCase();
    const segments: Array<{ text: string; isMatch: boolean }> = [];
    let lastIndex = 0;

    let index = lowerText.indexOf(lowerQuery, lastIndex);
    while (index !== -1) {
      if (index > lastIndex) {
        segments.push({
          text: text.substring(lastIndex, index),
          isMatch: false,
        });
      }
      
      segments.push({
        text: text.substring(index, index + query.length),
        isMatch: true,
      });
      
      lastIndex = index + query.length;
      index = lowerText.indexOf(lowerQuery, lastIndex);
    }

    if (lastIndex < text.length) {
      segments.push({
        text: text.substring(lastIndex),
        isMatch: false,
      });
    }

    return segments.length > 0 ? segments : [{ text, isMatch: false }];
  }, []);

  const filteredNotes = useMemo(() => {
    return filterNotes(searchQuery, notes);
  }, [searchQuery, notes, filterNotes]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filteredNotes,
    highlightMatches,
    clearSearch,
    hasSearchQuery: searchQuery.trim().length > 0,
    resultCount: filteredNotes.length,
  };
}

