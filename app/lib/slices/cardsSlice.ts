import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  initiateCardPayment,
  fetchPhysicalCards,
  requestPhysicalCard,
  InitiatePaymentResponse,
  PhysicalCard,
  RequestPhysicalResponse,
} from "../thunks/cardsThunks"; // Adjust path

export interface CardsState {
  physicalCards: PhysicalCard[] | null;
  initiatePayment: InitiatePaymentResponse | null;
  requestPhysical: RequestPhysicalResponse | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CardsState = {
  physicalCards: null,
  initiatePayment: null,
  requestPhysical: null,
  isLoading: false,
  error: null,
};

const cardsSlice = createSlice({
  name: "cards",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearInitiatePayment: (state) => {
      state.initiatePayment = null;
    },
    clearRequestPhysical: (state) => {
      state.requestPhysical = null;
    },
    clearPhysicalCards: (state) => {
      state.physicalCards = null;
    },
  },
  extraReducers: (builder) => {
    /** -----------------------------------------
     * INITIATE CARD PAYMENT
     * ----------------------------------------- */
    builder
      .addCase(initiateCardPayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        initiateCardPayment.fulfilled,
        (state, action: PayloadAction<InitiatePaymentResponse>) => {
          state.isLoading = false;
          state.initiatePayment = action.payload;
          state.error = null;
        }
      )
      .addCase(initiateCardPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * FETCH PHYSICAL CARDS
     * ----------------------------------------- */
    builder
      .addCase(fetchPhysicalCards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchPhysicalCards.fulfilled,
        (state, action: PayloadAction<{ physicalCards: PhysicalCard[] }>) => {
          state.isLoading = false;
          state.physicalCards = action.payload.physicalCards;
          state.error = null;
        }
      )
      .addCase(fetchPhysicalCards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    /** -----------------------------------------
     * REQUEST PHYSICAL CARD
     * ----------------------------------------- */
    builder
      .addCase(requestPhysicalCard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        requestPhysicalCard.fulfilled,
        (state, action: PayloadAction<RequestPhysicalResponse>) => {
          state.isLoading = false;
          state.requestPhysical = action.payload;
          state.error = null;
        }
      )
      .addCase(requestPhysicalCard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addMatcher(
        (action) =>
          action.type === "auth/logout" ||
          action.type === "auth/setUserOnly" ||
          action.type === "auth/setCredentials" ||
          action.type === "auth/loginUser/pending" ||
          action.type === "auth/loginUser/fulfilled" ||
          action.type === "auth/logoutUser/fulfilled" ||
          action.type === "auth/verify-mfa-otp/fulfilled" ||
          action.type === "auth/verify-device/fulfilled",
        (state) => {
          state.error = null;
          state.isLoading = false;
        }
      );
  },
});

export const {
  clearError,
  clearInitiatePayment,
  clearRequestPhysical,
  clearPhysicalCards,
} = cardsSlice.actions;
export default cardsSlice.reducer;
