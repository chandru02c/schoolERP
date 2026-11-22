import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'STUDENT' | 'CLASS' | 'ASSIGNMENT' | 'EVENT' | 'EXAM';
  metadata?: Record<string, any>;
}

export interface SearchState {
  query: string;
  categoryFilter: string;
  results: SearchResultItem[];
  recentSearches: string[];
}

const initialState: SearchState = {
  query: '',
  categoryFilter: 'ALL',
  results: [],
  recentSearches: ['Class 8-A', 'Mathematics Mid-Term', 'Rahul Sharma', 'Timetable'],
};

export const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setCategoryFilter: (state, action: PayloadAction<string>) => {
      state.categoryFilter = action.payload;
    },
    setSearchResults: (state, action: PayloadAction<SearchResultItem[]>) => {
      state.results = action.payload;
    },
    addRecentSearch: (state, action: PayloadAction<string>) => {
      const q = action.payload.trim();
      if (q && !state.recentSearches.includes(q)) {
        state.recentSearches.unshift(q);
        if (state.recentSearches.length > 8) {
          state.recentSearches.pop();
        }
      }
    },
    clearRecentSearches: (state) => {
      state.recentSearches = [];
    },
  },
});

export const {
  setSearchQuery,
  setCategoryFilter,
  setSearchResults,
  addRecentSearch,
  clearRecentSearches,
} = searchSlice.actions;

export default searchSlice.reducer;
