import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#172033", brand: "#5B5CE2", mint: "#23B18A" }, boxShadow: { card: "0 1px 2px rgba(23,32,51,.04), 0 8px 26px rgba(23,32,51,.06)" } } }, plugins: [] } satisfies Config;
