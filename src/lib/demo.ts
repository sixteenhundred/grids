/** Shared demo-login constants (used by both server actions and layouts). */
export const DEMO_COOKIE = "grid_demo";
export const DEMO_USER = {
  id: "demo-john",
  name: process.env.DEMO_NAME ?? "John Hope",
  email: process.env.DEMO_EMAIL ?? "joingrid@demo.com",
};
