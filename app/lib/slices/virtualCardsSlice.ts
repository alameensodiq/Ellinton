import { createSlice, PayloadAction, isAnyOf } from "@reduxjs/toolkit";
import {
  requestVirtualCard,
  fetchVirtualCards,
  fetchVirtualCard,
  fundVirtualCard,
  withdrawVirtualCard,
  freezeVirtualCard,
  unfreezeVirtualCard,
  VirtualCardListItem,
  VirtualCardDetails,
} from "../thunks/virtualCardsThunks";

/* =========================
   STATE
========================= */

interface VirtualCardsState {
  cards: VirtualCardListItem[] | null; // from /customer/all
  selectedCard: VirtualCardDetails | null; // from /customer/card/{id}
  isLoading: boolean;
  error: string | null;
}

const initialState: VirtualCardsState = {
  cards: null,
  selectedCard: null,
  isLoading: false,
  error: null,
};

/* =========================
   SLICE
========================= */

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
    /* -------------------------
       DATA HANDLERS (FIRST)
    -------------------------- */

    builder
      // Fetch all cards
      .addCase(
        fetchVirtualCards.fulfilled,
        (state, action: PayloadAction<VirtualCardListItem[]>) => {
          state.cards = action.payload;
        }
      )

      // Fetch single card details
      .addCase(
        fetchVirtualCard.fulfilled,
        (state, action: PayloadAction<VirtualCardDetails>) => {
          state.selectedCard = action.payload;
        }
      )

      // Request new card → refresh list optimistically
      .addCase(
        requestVirtualCard.fulfilled,
        (state, action: PayloadAction<VirtualCardDetails>) => {
          if (state.cards) {
            state.cards.unshift({
              id: action.payload.id,
              identifier: action.payload.id,
              card_pan: action.payload.masked_pan,
              card_type: action.payload.issuer,
              status: "Active",
              has_debited_fee: false,
              has_debited_vat: false,
              customer_id: 0,
              created_at: action.payload.created_at,
              updated_at: action.payload.updated_at,
            });
          }
        }
      )

      // Fund card → updates selected card
      .addCase(
        fundVirtualCard.fulfilled,
        (state, action: PayloadAction<VirtualCardDetails>) => {
          state.selectedCard = action.payload;
        }
      )

      // Withdraw card → updates selected card
      .addCase(
        withdrawVirtualCard.fulfilled,
        (state, action: PayloadAction<VirtualCardDetails>) => {
          state.selectedCard = action.payload;
        }
      )

      // Freeze card
      .addCase(freezeVirtualCard.fulfilled, (state) => {
        if (state.selectedCard) {
          state.selectedCard.status = "DISABLED";
        }
      })

      // Unfreeze card
      .addCase(unfreezeVirtualCard.fulfilled, (state) => {
        if (state.selectedCard) {
          state.selectedCard.status = "ACTIVE";
        }
      });

    /* -------------------------
       GLOBAL MATCHERS (AFTER)
    -------------------------- */

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

/* =========================
   EXPORTS
========================= */

export const { clearVirtualCardError, clearSelectedVirtualCard } =
  virtualCardsSlice.actions;

export default virtualCardsSlice.reducer;
