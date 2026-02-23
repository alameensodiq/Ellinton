// Savings API Types

export interface SavingsProduct {
  tenure: number;
  code: string;
  rate: number;
  name: string;
}

export interface SavingsEstimate {
  estimatedInterest?: number;
  totalAmount?: number;
  maturityAmount?: number;
}

export interface SavingsParticipant {
  userId: string;
  accountNumber: string;
  userName: string;
}

export interface CreateSavingsPayload {
  name: string;
  productCode: string;
  amount: number;
  frequency: string;
  tenure: number;
  startDate: string;
  endDate: string;
  dayOfWeek?: string;
  dateInMonth?: number;
  debitSource: string;
  maturityAction: string;
  cardPan?: string;
  cardExpiryDate?: string;
  cardCvv?: string;
  cardHolderName?: string;
  targetAmount?: number;
  participants?: SavingsParticipant[];
}

export interface Saving {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  status: string;
  savings_rate_id: string;
  user_id: string;
  currency: string;
  frequency: string;
  amount: number;
  start_date: string;
  interest_rate: number;
  end_date: string;
  debit_source: string;
  target_amount?: number;
  participants?: SavingsParticipant[];
  tenure: number;
  virtual_account_number: string;
  card_token?: string;
  day_of_week?: string;
  date_in_month?: number;
  expected_maturity_amount: number;
  maturity_action?: string;
}

export interface SavingsTransaction {
  id: number;
  type: string;
  narration: string;
  opening_balance?: number;
  closing_balance?: number;
  reference: string;
  amount: number;
  charged_amount: number;
  charged_fee: number;
  currency: string;
  account_number: string;
  status: string;
  source: string;
  account_to_debit?: string;
  transfer_reference: string;
  other_account: string;
  other_bank: string;
  other_bank_code?: string;
  account_name?: string;
  other_account_name?: string;
  payment_code?: string;
  customer_id?: string;
  customer_email?: string;
  transaction_date?: string;
  created_at: string;
  updated_at: string;
}

export interface TopUpSavingsPayload {
  savingsId: number;
  amount: number;
  uniqueRef: string;
}

export interface WithdrawSavingsPayload {
  savingsId: number;
  amount: number;
  uniqueRef: string;
}

export interface CalculateEstimatePayload {
  amount: number;
  type: string;
  tenure: number;
  frequency: string;
}
