export {};

declare global {
  interface Window {
    ENV: {
      CONVEX_URL: string;
    };
  }
}
