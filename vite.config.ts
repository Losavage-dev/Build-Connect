import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Только LAN: задайте в .env строку DEV_SERVER_HOST=10.202.27.47 — в терминале останется один Network-URL,
  // сервер слушает только этот интерфейс (при смене Wi‑Fi/IP обновите значение). Без переменной — host "::" (все интерфейсы).
  const devHost = env.DEV_SERVER_HOST?.trim() || "::";

  return {
  server: {
    host: devHost,
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
