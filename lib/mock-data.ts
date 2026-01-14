import { Expense, Category, UserRole } from "@/types";

export const mockCategories: Category[] = [
  { id: "1", name: "Alimentation", icon: "🍔", createdAt: new Date() },
  { id: "2", name: "Transport", icon: "🚗", createdAt: new Date() },
  { id: "3", name: "Logement", icon: "🏠", createdAt: new Date() },
  { id: "4", name: "Santé", icon: "💊", createdAt: new Date() },
  { id: "5", name: "Shopping", icon: "🛍️", createdAt: new Date() },
  { id: "6", name: "Loisirs", icon: "🎬", createdAt: new Date() },
  { id: "7", name: "Autres", icon: "📦", createdAt: new Date() },
];

// Générer des dates pour le mois courant
const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth()

export const mockExpenses: Expense[] = [
  {
    id: "1",
    name: "EDF",
    amount: "120.00",
    categoryId: "3",
    paidBy: "user1",
    isShared: true,
    logoUrl: null,
    description: "Facture électricité",
    expenseDate: new Date(currentYear, currentMonth, 15),
    createdAt: new Date(currentYear, currentMonth, 15),
    updatedAt: new Date(currentYear, currentMonth, 15),
  },
  {
    id: "2",
    name: "Carrefour",
    amount: "85.50",
    categoryId: "1",
    paidBy: "user2",
    isShared: true,
    logoUrl: null,
    expenseDate: new Date(currentYear, currentMonth, 18),
    createdAt: new Date(currentYear, currentMonth, 18),
    updatedAt: new Date(currentYear, currentMonth, 18),
  },
  {
    id: "3",
    name: "Uber",
    amount: "25.00",
    categoryId: "2",
    paidBy: "user1",
    isShared: false,
    logoUrl: null,
    expenseDate: new Date(currentYear, currentMonth, 20),
    createdAt: new Date(currentYear, currentMonth, 20),
    updatedAt: new Date(currentYear, currentMonth, 20),
  },
];
