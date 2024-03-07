export const API_URL =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:5173"
    : "https://stock.iqinfy.com";
