// const BASE_URL = "http://3.220.216.48:3005/api/v2";
// const BASE_URL = "https://unvenial-uncomplaining-von.ngrok-free.dev/api/v2";
const BASE_URL = "https://api.ellingtonbank.com/api/v2";


//users endpoint
const REGISTER_USERS_ENDPOINT = `${BASE_URL}/users/register`;
const LOGIN_USERS_ENDPOINT = `${BASE_URL}/users/login`;
const VERIFY_OTP_USERS_ENDPOINT = (userId: string) =>
  `${BASE_URL}/users/${userId}/verify-otp`;
const RESEND_OTP_USERS_ENDPOINT = (userId: string) =>
  `${BASE_URL}/users/${userId}/resend-otp`;
const VERIFY_BVN_USERS_ENDPOINT = (userId: string) =>
  `${BASE_URL}/users/${userId}/verify-bvn`;
const VERIFY_FACIAL_USERS_ENDPOINT = (userId: string) =>
  `${BASE_URL}/users/${userId}/verify-facial`;
const CREATE_ACCOUNT_USERS_ENDPOINT = (userId: string) =>
  `${BASE_URL}/users/${userId}/create-account`;
const CREATE_TRANSACTION_PIN_USERS_ENDPOINT = (userId: string) =>
  `${BASE_URL}/users/${userId}/create-transaction-pin`;
const FORGET_PASSCODE_VERIFY_OTP_AUTH_ENDPOINT = `${BASE_URL}/auth/forgot-passcode/verify-otp`;

//auth
const SETUP_PASSCODE_AUTH_ENDPOINT = `${BASE_URL}/auth/setup-passcode`;
const LOGOUT_AUTH_ENDPOINT = `${BASE_URL}/auth/logout`;
const FORGET_PASSCODE_AUTH_ENDPOINT = `${BASE_URL}/auth/forgot-passcode`;
const FORGET_PASSCODE_RESET_AUTH_ENDPOINT = `${BASE_URL}/auth/forgot-passcode/reset`;
const CHANGE_PASSCODE_AUTH_ENDPOINT = `${BASE_URL}/auth/change-passcode`;

//profile
const GET_USER_PROFILE_ENDPOINT = `${BASE_URL}/users/me`;
const UPDATE_USER_PROFILE_ENDPOINT = `${BASE_URL}/users/me`;
const UPDATE_USER_ADDRESS_PROFILE_ENDPOINT = `${BASE_URL}/users/address`;
const UPDATE_USER_PROFILE_PASSWORD_ENDPOINT = `${BASE_URL}/users/profile/passport`;
export const CHANGE_TRANSACTION_PIN_USERS_ENDPOINT =
  `${BASE_URL}/users/change-transaction-pin`;


//kyc
const KYC_STATUS_ENDPOINT = `${BASE_URL}/kyc/status`;
const KYC_NIN_VERIFY_ENDPOINT = `${BASE_URL}/kyc/verify-nin`;
const KYC_NEXT_OF_KIN_ENDPOINT = `${BASE_URL}/kyc/next-of-kin`;
const KYC_SIGNATURE_ENDPOINT = `${BASE_URL}/kyc/signature`;
const KYC_SUMMARY_ENDPOINT = `${BASE_URL}/kyc/summary`;
const KYC_SUBMIT_ENDPOINT = `${BASE_URL}/kyc/submit`;
const KYC_UTILITY_BILL_ENDPOINT = `${BASE_URL}/kyc/utility-bill`;
const KYC_TIER3_ENDPOINT = `${BASE_URL}/kyc/tier3/submit`;
const KYC_UTILITY_BILL_URL_ENDPOINT = `${BASE_URL}/kyc/utility-bill-url`;

//account
const ACCOUNT_INFO_ENDPOINT = `${BASE_URL}/accounts/info`;
const ACCOUNT_VALIDATE_NIP_ENDPOINT = `${BASE_URL}/accounts/validate/nip`;
const ACCOUNT_VALIDATE_ELLINGLON_ENDPOINT = `${BASE_URL}/accounts/validate/ellington`;
const BENEFICIARIES_ENDPOINT = `${BASE_URL}/beneficiaries/transfer`;
const BANKS_ENDPOINT = `${BASE_URL}/utilities/banks`;
const TRANSFER_SAME_BANK = `${BASE_URL}/transfers/intra-bank`;
const TRANSFER_OTHER_BANK = `${BASE_URL}/transfers/inter-bank`;
export const FETCH_ACCOUNT_TRANSACTIONS = `${BASE_URL}/transactions/account`;


//cards
const CARD_INITIATE_PAYMENT_ENDPOINT = `${BASE_URL}/cards/initiate-payment`;
const CARD_FETCH_PHYSICAL_ENDPOINT = `${BASE_URL}/cards/physical-cards`;
const CARD_REQUEST_PHYSICAL_ENDPOINT = `${BASE_URL}/cards/physical-cards/request`;

//bills
const BILLS_DATA_OPTIONS_ENDPOINT = `${BASE_URL}/bills/data/options`;
const BILLS_VALIDATE_CUSTOMER_ENDPOINT = `${BASE_URL}/bills/data/validate-customer`;
const BILLS_PAY_ENDPOINT = `${BASE_URL}/bills/pay-bill`;
const BILLS_PROVIDERS_ENDPOINT = `${BASE_URL}/bills/get-providers`;
const BILLS_PACKAGES_ENDPOINT = `${BASE_URL}/bills/get-packages`;

// virtual cards
const VIRTUAL_CARD_REQUEST_ENDPOINT = `${BASE_URL}/virtual-cards/request`;
const VIRTUAL_CARDS_FETCH_ALL_ENDPOINT = `${BASE_URL}/virtual-cards/customer/all`;
const VIRTUAL_CARD_FETCH_ONE_ENDPOINT = (id: string) =>
  `${BASE_URL}/virtual-cards/customer/card/${id}`;
const VIRTUAL_CARD_FUND_ENDPOINT = `${BASE_URL}/virtual-cards/fund`;
const VIRTUAL_CARD_WITHDRAW_ENDPOINT = `${BASE_URL}/virtual-cards/withdraw`;
const VIRTUAL_CARD_FREEZE_ENDPOINT = (id: string) =>
  `${BASE_URL}/virtual-cards/customer/card/${id}/freeze`;
const VIRTUAL_CARD_UNFREEZE_ENDPOINT = (id: string) =>
  `${BASE_URL}/virtual-cards/customer/card/${id}/unfreeze`;

// loans
const LOAN_PRODUCTS_ENDPOINT = `${BASE_URL}/loans/products`;
const LOAN_COMMERCIAL_BANKS_ENDPOINT = `${BASE_URL}/loans/commercial-banks`;
const LOAN_CREDIT_CHECK_ENDPOINT = `${BASE_URL}/loans/credit-check`;
const LOAN_CALCULATE_ENDPOINT = `${BASE_URL}/loans/calculate`;
const LOAN_APPLY_ENDPOINT = `${BASE_URL}/loans/apply`;
const FETCH_USER_LOANS_ENDPOINT = `${BASE_URL}/loans`;
const FETCH_SINGLE_LOAN_ENDPOINT = (id: string) =>
  `${BASE_URL}/loans/${id}`;
  
const LOAN_DISBURSEMENT_WEBHOOK_ENDPOINT = `${BASE_URL}/webhooks/loans/disbursement`;


export {
  BASE_URL,
  REGISTER_USERS_ENDPOINT,
  LOGIN_USERS_ENDPOINT,
  VERIFY_OTP_USERS_ENDPOINT,
  RESEND_OTP_USERS_ENDPOINT,
  VERIFY_BVN_USERS_ENDPOINT,
  VERIFY_FACIAL_USERS_ENDPOINT,
  CREATE_ACCOUNT_USERS_ENDPOINT,
  CREATE_TRANSACTION_PIN_USERS_ENDPOINT,
  CHANGE_PASSCODE_AUTH_ENDPOINT,
  FORGET_PASSCODE_AUTH_ENDPOINT,
  FORGET_PASSCODE_RESET_AUTH_ENDPOINT,
  LOGOUT_AUTH_ENDPOINT,
  SETUP_PASSCODE_AUTH_ENDPOINT,
  GET_USER_PROFILE_ENDPOINT,
  UPDATE_USER_ADDRESS_PROFILE_ENDPOINT,
  UPDATE_USER_PROFILE_ENDPOINT,
  UPDATE_USER_PROFILE_PASSWORD_ENDPOINT,
  FORGET_PASSCODE_VERIFY_OTP_AUTH_ENDPOINT,
  KYC_NEXT_OF_KIN_ENDPOINT,
  KYC_NIN_VERIFY_ENDPOINT,
  KYC_SIGNATURE_ENDPOINT,
  KYC_STATUS_ENDPOINT,
  KYC_SUBMIT_ENDPOINT,
  KYC_SUMMARY_ENDPOINT,
  KYC_TIER3_ENDPOINT,
  KYC_UTILITY_BILL_ENDPOINT,
  KYC_UTILITY_BILL_URL_ENDPOINT,
  ACCOUNT_INFO_ENDPOINT,
  ACCOUNT_VALIDATE_ELLINGLON_ENDPOINT,
  ACCOUNT_VALIDATE_NIP_ENDPOINT,
  BENEFICIARIES_ENDPOINT,
  CARD_FETCH_PHYSICAL_ENDPOINT,
  CARD_INITIATE_PAYMENT_ENDPOINT,
  CARD_REQUEST_PHYSICAL_ENDPOINT,
  BANKS_ENDPOINT,
  TRANSFER_OTHER_BANK,
  TRANSFER_SAME_BANK,
  BILLS_DATA_OPTIONS_ENDPOINT,
  BILLS_VALIDATE_CUSTOMER_ENDPOINT,
  BILLS_PACKAGES_ENDPOINT,
  BILLS_PAY_ENDPOINT,
  BILLS_PROVIDERS_ENDPOINT,
  VIRTUAL_CARD_REQUEST_ENDPOINT,
  VIRTUAL_CARDS_FETCH_ALL_ENDPOINT,
  VIRTUAL_CARD_FETCH_ONE_ENDPOINT,
  VIRTUAL_CARD_FUND_ENDPOINT,
  VIRTUAL_CARD_WITHDRAW_ENDPOINT,
  VIRTUAL_CARD_FREEZE_ENDPOINT,
  VIRTUAL_CARD_UNFREEZE_ENDPOINT,
  LOAN_PRODUCTS_ENDPOINT,
  LOAN_COMMERCIAL_BANKS_ENDPOINT,
  LOAN_CREDIT_CHECK_ENDPOINT,
  LOAN_CALCULATE_ENDPOINT,
  LOAN_APPLY_ENDPOINT,
  FETCH_USER_LOANS_ENDPOINT,
  FETCH_SINGLE_LOAN_ENDPOINT,
  LOAN_DISBURSEMENT_WEBHOOK_ENDPOINT,
};
