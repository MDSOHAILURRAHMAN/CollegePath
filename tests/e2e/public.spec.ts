import { expect, test } from "@playwright/test";

test("public homepage links into the college directory", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /find the right college/i })).toBeVisible();
  await page.getByRole("link", { name: /browse the directory/i }).click();
  await expect(page).toHaveURL(/\/colleges$/);
  await expect(page.getByRole("heading", { name: /explore your options/i })).toBeVisible();
});

test("directory filters are shareable through query parameters", async ({ page }) => {
  await page.goto("/colleges");
  await page.getByLabel("State").selectOption("Karnataka");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/state=Karnataka/);
});

test("login and registration tabs remain usable on mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await page.getByRole("tab", { name: "Create account" }).click();
  await expect(page.getByLabel("Full name")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});