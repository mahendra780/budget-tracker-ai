import {
  LayoutDashboard,
  Repeat,
  ReceiptText,
  Target,
  User,
  WalletCards,
} from "lucide-react";

export const navigationLinks = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/transactions",
    label: "Transactions",
    icon: ReceiptText,
  },
  {
    to: "/budgets",
    label: "Budgets",
    icon: WalletCards,
  },
  {
    to: "/goals",
    label: "Goals",
    icon: Target,
  },
  {
    to: "/recurring",
    label: "Recurring",
    icon: Repeat,
  },
  {
    to: "/profile",
    label: "Profile",
    icon: User,
  },
];

export const routeTitles = {
  ...Object.fromEntries(
    navigationLinks.map(({ label, to }) => [to, label])
  ),
  "/budgets/history": "Budget History",
};
