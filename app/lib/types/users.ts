// User Search API Types

export interface SearchUserPayload {
  search: string;
}

export interface SearchedUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  account_number?: number;
  passport?: string;
  status?: string;
  [key: string]: any;
}
