import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  WALLET_BONUS_BALANCE_ENDPOINT,
  WALLET_WITHDRAW_ENDPOINT,
} from "../api";

interface ApiResponse<T = any> {
  status: string;
  success: boolean;
  data?: T;
  message?: string;
}

export interface BonusWalletBalance {
  walletNumber: string;
  balance: number;
  currency: string;
}

export interface WalletWithdrawPayload {
  amount: number;
  reference: string;
}

export interface WalletWithdrawResponse {
  [key: string]: any;
}

export const fetchBonusWalletBalance = createAsyncThunk<
  BonusWalletBalance,
  void,
  { rejectValue: string }
>("wallet/fetchBonusBalance", async (_, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as any).auth.token;

    const res = await fetch(WALLET_BONUS_BALANCE_ENDPOINT, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = (await res.json()) as ApiResponse<BonusWalletBalance>;

    if (!res.ok || !data.success || !data.data) {
      return rejectWithValue(
        data?.message || (data as any)?.data?.message || "Failed to fetch wallet balance"
      );
    }

    return data.data;
  } catch (error: any) {
    return rejectWithValue(
      error?.message || "Wallet balance fetch error"
    );
  }
});

export const withdrawBonusWallet = createAsyncThunk<
  WalletWithdrawResponse,
  WalletWithdrawPayload,
  { rejectValue: string }
>("wallet/withdraw", async (payload, { getState, rejectWithValue }) => {
  try {
    const token = (getState() as any).auth.token;
    const idempotencyKey = `bonus-${payload.reference}`;

    const res = await fetch(WALLET_WITHDRAW_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        "idempotency-key": idempotencyKey,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as ApiResponse<WalletWithdrawResponse>;

    if (!res.ok || !data.success) {
      return rejectWithValue(
        data?.message || (data as any)?.data?.message || "Wallet withdrawal failed"
      );
    }

    return data.data || {};
  } catch (error: any) {
    return rejectWithValue(
      error?.message || "Wallet withdrawal error"
    );
  }
});
