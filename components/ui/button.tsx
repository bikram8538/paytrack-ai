import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "secondary" | "ghost" | "danger" };
export const Button = forwardRef<HTMLButtonElement, Props>(({ className, variant = "default", ...props }, ref) => <button ref={ref} className={cn("inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50", { "bg-brand text-white hover:bg-indigo-600": variant === "default", "bg-slate-100 text-slate-700 hover:bg-slate-200": variant === "secondary", "text-slate-600 hover:bg-slate-100": variant === "ghost", "bg-red-50 text-red-600 hover:bg-red-100": variant === "danger" }, className)} {...props} />);
Button.displayName = "Button";
