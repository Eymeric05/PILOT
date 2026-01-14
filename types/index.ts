export type UserRole = "user1" | "user2";

export interface Expense {
  id: string;
  name: string;
  amount: string;
  categoryId?: string | null;
  paidBy: UserRole;
  isShared: boolean;
  logoUrl?: string | null;
  description?: string | null;
  expenseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  icon?: string | null;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
