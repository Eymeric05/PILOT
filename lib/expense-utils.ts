import { Expense, UserRole } from "@/types";

/**
 * Calcule le montant à afficher pour une dépense partagée
 */
export function getDisplayAmount(expense: Expense, currentUser: UserRole): string {
  if (expense.isShared) {
    const amount = parseFloat(expense.amount);
    const sharedAmount = amount / 2;
    return sharedAmount.toFixed(2);
  }
  return parseFloat(expense.amount).toFixed(2);
}

/**
 * Formate un montant pour l'affichage
 */
export function formatAmount(amount: string | number): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(numAmount);
}

/**
 * Filtre les dépenses par mois
 */
export function filterExpensesByMonth(
  expenses: Expense[],
  year: number,
  month: number
): Expense[] {
  return expenses.filter((expense) => {
    const expenseDate = new Date(expense.expenseDate);
    return (
      expenseDate.getFullYear() === year &&
      expenseDate.getMonth() === month
    );
  });
}

/**
 * Calcule le total des dépenses pour un mois
 */
export function calculateMonthlyTotal(
  expenses: Expense[],
  currentUser: UserRole
): number {
  return expenses.reduce((total, expense) => {
    if (expense.isShared) {
      return total + parseFloat(expense.amount) / 2;
    }
    // Si la dépense n'est pas partagée, on compte seulement si c'est l'utilisateur qui a payé
    if (expense.paidBy === currentUser) {
      return total + parseFloat(expense.amount);
    }
    return total;
  }, 0);
}

/**
 * Formate une date au format "JOUR MOIS ANNEE" en français
 */
export function formatExpenseDate(date: Date | string): string {
  const expenseDate = typeof date === 'string' ? new Date(date) : date
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ]
  const day = expenseDate.getDate()
  const month = months[expenseDate.getMonth()]
  const year = expenseDate.getFullYear()
  return `${day} ${month} ${year}`
}