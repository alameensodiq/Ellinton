import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import accountReducer from "./slices/accountSlice";
import kycReducer from "./slices/kycSlice";
import beneficiaryReducer from "./slices/beneficiarySlice";
import cardsReducer from "./slices/cardsSlice";
import transferReducer from "./slices/transferSlice";
import billsReducer from "./slices/billsSlice"; 
import virtualCardsReducer from "./slices/virtualCardsSlice";


export const store = configureStore({
  reducer: {
    auth: authReducer,
    accounts: accountReducer,
    kyc: kycReducer,
    beneficiaries: beneficiaryReducer,
    cards: cardsReducer,
    transfers: transferReducer,
    virtualCards: virtualCardsReducer,
    bills: billsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
