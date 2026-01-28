import { createSlice, PayloadAction, isAnyOf } from "@reduxjs/toolkit";
import {
  requestVirtualCard,
  fetchVirtualCards,
  fetchVirtualCard,
  fundVirtualCard,
  withdrawVirtualCard,
  freezeVirtualCard,
  unfreezeVirtualCard,
  VirtualCard,
} from "../thunks/virtualCardsThunks";

interface VirtualCardsState {
  cards: VirtualCard[] | null;
  selectedCard: VirtualCard | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: VirtualCardsState = {
  cards: null,
  selectedCard: null,
  isLoading: false,
  error: null,
};

const virtualCardsSlice = createSlice({
  name: "virtualCards",
  initialState,
  reducers: {
    clearVirtualCardError: (state) => {
      state.error = null;
    },
    clearSelectedVirtualCard: (state) => {
      state.selectedCard = null;
    },
  },
  extraReducers: (builder) => {
    /** ---------------------------
     * DATA HANDLERS (addCase FIRST)
     * --------------------------- */
    builder
      .addCase(
        fetchVirtualCards.fulfilled,
        (state, action: PayloadAction<VirtualCard[]>) => {
          state.cards = action.payload;
        }
      )
      .addCase(
        fetchVirtualCard.fulfilled,
        (state, action: PayloadAction<VirtualCard>) => {
          state.selectedCard = action.payload;
        }
      )
      .addCase(
        requestVirtualCard.fulfilled,
        (state, action: PayloadAction<VirtualCard>) => {
          state.cards = state.cards
            ? [action.payload, ...state.cards]
            : [action.payload];
        }
      )
      .addCase(
        fundVirtualCard.fulfilled,
        (state, action: PayloadAction<VirtualCard>) => {
          state.selectedCard = action.payload;
        }
      )
      .addCase(
        withdrawVirtualCard.fulfilled,
        (state, action: PayloadAction<VirtualCard>) => {
          state.selectedCard = action.payload;
        }
      )
      .addCase(freezeVirtualCard.fulfilled, (state) => {
        if (state.selectedCard) {
          state.selectedCard.status = "Frozen";
        }
      })
      .addCase(unfreezeVirtualCard.fulfilled, (state) => {
        if (state.selectedCard) {
          state.selectedCard.status = "Active";
        }
      });

    /** ---------------------------
     * GLOBAL MATCHERS (AFTER)
     * --------------------------- */
    builder
      .addMatcher(
        isAnyOf(
          requestVirtualCard.pending,
          fetchVirtualCards.pending,
          fetchVirtualCard.pending,
          fundVirtualCard.pending,
          withdrawVirtualCard.pending,
          freezeVirtualCard.pending,
          unfreezeVirtualCard.pending
        ),
        (state) => {
          state.isLoading = true;
          state.error = null;
        }
      )
      .addMatcher(
        isAnyOf(
          requestVirtualCard.fulfilled,
          fetchVirtualCards.fulfilled,
          fetchVirtualCard.fulfilled,
          fundVirtualCard.fulfilled,
          withdrawVirtualCard.fulfilled,
          freezeVirtualCard.fulfilled,
          unfreezeVirtualCard.fulfilled
        ),
        (state) => {
          state.isLoading = false;
        }
      )
      .addMatcher(
        isAnyOf(
          requestVirtualCard.rejected,
          fetchVirtualCards.rejected,
          fetchVirtualCard.rejected,
          fundVirtualCard.rejected,
          withdrawVirtualCard.rejected,
          freezeVirtualCard.rejected,
          unfreezeVirtualCard.rejected
        ),
        (state, action) => {
          state.isLoading = false;
          state.error = action.payload as string;
        }
      );
  },
});

export const { clearVirtualCardError, clearSelectedVirtualCard } =
  virtualCardsSlice.actions;

export default virtualCardsSlice.reducer;
