export interface User {
  id: number;
  google_id?: string; // For Google users
  email?: string;
  name?: string;
  picture?: string;
  is_guest: boolean;
  guest_name?: string;
  created_at: Date;
  last_login: Date;
}
