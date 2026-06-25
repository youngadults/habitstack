// E2E tests for Stackr PWA
// Tests run against the preview server (adapter-node) in local mode (no Supabase)

import { test, expect } from '@playwright/test';

// Helper: wait for the app to hydrate (SSR is disabled)
async function waitForApp(page: import('@playwright/test').Page) {
	await page.goto('/');
	// Wait for the app shell to render (client-side hydration)
	await page.waitForSelector('nav', { timeout: 15000 });
}

test.describe('Stackr App', () => {
	test('loads the app and shows empty state', async ({ page }) => {
		await waitForApp(page);
		await expect(page.getByText('No stacks yet')).toBeVisible({ timeout: 10000 });
		await expect(page.getByRole('button', { name: 'Create Your First Stack' })).toBeVisible();
	});

	test('can create a new stack', async ({ page }) => {
		await waitForApp(page);

		// Click create button
		await page.getByRole('button', { name: 'Create Your First Stack' }).click();

		// Fill in the modal
		await expect(page.getByText('Create New Stack')).toBeVisible();
		await page.locator('#new-stack-name').fill('Morning Routine');
		await page.locator('#new-stack-trigger').fill('After I make coffee');

		// Select a color (first one)
		await page.getByRole('button', { name: /Select indigo color/ }).click();

		// Create the stack (exact match to avoid "Create Your First Stack")
		await page.getByRole('button', { name: 'Create', exact: true }).click();

		// Modal should close and stack should appear
		await expect(page.getByText('Morning Routine')).toBeVisible();
		await expect(page.getByText('After I make coffee')).toBeVisible();
	});

	test('can add a habit to a stack', async ({ page }) => {
		await waitForApp(page);

		// Create a stack first
		await page.getByRole('button', { name: 'Create Your First Stack' }).click();
		await page.locator('#new-stack-name').fill('Evening Wind-Down');
		await page.locator('#new-stack-trigger').fill('After I brush my teeth');
		await page.getByRole('button', { name: 'Create', exact: true }).click();

		// Add a habit
		await page.getByText('+ Add habit').click();
		await page.locator('input[placeholder="New habit..."]').fill('Read for 20 minutes');
		await page.getByRole('button', { name: 'Add', exact: true }).click();

		// Habit should appear
		await expect(page.getByText('Read for 20 minutes')).toBeVisible();
	});

	test('can toggle a habit completion', async ({ page }) => {
		await waitForApp(page);

		// Create stack and habit
		await page.getByRole('button', { name: 'Create Your First Stack' }).click();
		await page.locator('#new-stack-name').fill('Test Stack');
		await page.locator('#new-stack-trigger').fill('After trigger');
		await page.getByRole('button', { name: 'Create', exact: true }).click();

		await page.getByText('+ Add habit').click();
		await page.locator('input[placeholder="New habit..."]').fill('Test habit');
		await page.getByRole('button', { name: 'Add', exact: true }).click();

		// Toggle the habit — click the habit row button
		const habitRow = page.getByRole('button', { name: /Test habit/ });
		await habitRow.click();

		// Should show completed state (checkmark SVG)
		await expect(page.locator('svg.text-white').first()).toBeVisible();
	});

	test('can navigate to Stacks page', async ({ page }) => {
		await waitForApp(page);

		// Navigate via nav link (not "No stacks yet" heading)
		await page.getByRole('link', { name: 'Stacks' }).click();
		await expect(page).toHaveURL(/\/stacks/);
	});

	test('can navigate to Stats page', async ({ page }) => {
		await waitForApp(page);

		await page.getByRole('link', { name: 'Stats' }).click();
		await expect(page).toHaveURL(/\/stats/);
	});

	test('can navigate to Achievements page', async ({ page }) => {
		await waitForApp(page);

		await page.getByRole('link', { name: 'Awards' }).click();
		await expect(page).toHaveURL(/\/achievements/);
	});

	test('nav bar is visible on all pages', async ({ page }) => {
		await waitForApp(page);
		await expect(page.locator('nav')).toBeVisible();

		await page.getByRole('link', { name: 'Stacks' }).click();
		await expect(page.locator('nav')).toBeVisible();

		await page.getByRole('link', { name: 'Stats' }).click();
		await expect(page.locator('nav')).toBeVisible();

		await page.getByRole('link', { name: 'Awards' }).click();
		await expect(page.locator('nav')).toBeVisible();
	});
});