import { expect, test, type Locator, type Page } from '@playwright/test';

const openTerminal = async (page: Page): Promise<Locator> => {
  await page.goto('/');
  const input = page.getByLabel('Terminal input');
  await expect(input).toBeEnabled({ timeout: 20000 });
  return input;
};

const runCommand = async (input: Locator, command: string) => {
  await input.fill(command);
  await input.press('Enter');
};

test.describe('Terminal CLI', () => {
  test('shows help output', async ({ page }) => {
    const input = await openTerminal(page);

    await runCommand(input, 'help');

    await expect(page.getByText('Show this help message', { exact: false })).toBeVisible();
  });

  test('shows about me output', async ({ page }) => {
    const input = await openTerminal(page);

    await runCommand(input, 'aboutme');

    await expect(page.getByText('Dev/DevOps Engineer', { exact: false })).toBeVisible();
  });

  test('lists skills by category', async ({ page }) => {
    const input = await openTerminal(page);

    await runCommand(input, 'skills');

    await expect(page.getByText('CI/CD & Automation')).toBeVisible();
    await expect(page.getByText('GitHub Actions')).toBeVisible();
  });

  test('shows skill details for multi-word skills', async ({ page }) => {
    const input = await openTerminal(page);

    await runCommand(input, 'skill github actions');

    await expect(page.getByRole('heading', { name: 'GitHub Actions' })).toBeVisible();
    await expect(page.getByText('Advanced', { exact: false })).toBeVisible();
  });

  test('lists projects with categories', async ({ page }) => {
    const input = await openTerminal(page);

    await runCommand(input, 'projects');

    await expect(page.getByText('auto-scaler-cloud')).toBeVisible();
    await expect(page.getByText('Kubernetes GitOps Pipeline')).toBeVisible();
  });

  test('shows project details', async ({ page }) => {
    const input = await openTerminal(page);

    await runCommand(input, 'project auto-scaler-cloud');

    await expect(page.getByText('Auto-Scaling Cloud Infrastructure')).toBeVisible();
  });

  test('shows experience timeline', async ({ page }) => {
    const input = await openTerminal(page);

    await runCommand(input, 'experience');

    await expect(page.getByText('Senior DevOps Engineer', { exact: false })).toBeVisible();
    await expect(page.getByText('FutureTech Inc.', { exact: false })).toBeVisible();
  });

  test('shows education history', async ({ page }) => {
    const input = await openTerminal(page);

    await runCommand(input, 'education');

    await expect(page.getByText('Bangkok Institute of Technology', { exact: false })).toBeVisible();
    await expect(page.getByText('B.Sc. in Computer Engineering', { exact: false })).toBeVisible();
  });

  test('shows resume summary and download link', async ({ page }) => {
    const input = await openTerminal(page);

    await runCommand(input, 'resume');

    await expect(page.getByText('Dev/DevOps Engineer', { exact: false })).toBeVisible();
    const resumeLink = page.getByRole('link', { name: /download resume/i });
    await expect(resumeLink).toHaveAttribute('href', 'https://example.com/resume.pdf');
  });

  test('shows contact links', async ({ page }) => {
    const input = await openTerminal(page);

    await runCommand(input, 'contact');

    await expect(page.getByText('hello@devterminal.dev', { exact: false })).toBeVisible();
    const githubLink = page.getByRole('link', { name: /github.com\/dev-user/i });
    await expect(githubLink).toHaveAttribute('href', 'https://github.com');
    const linkedInLink = page.getByRole('link', { name: /linkedin.com\/in\/dev-user/i });
    await expect(linkedInLink).toHaveAttribute('href', 'https://www.linkedin.com');
  });

  test('validates ask formatting without quotes', async ({ page }) => {
    const input = await openTerminal(page);

    await runCommand(input, 'ask hello');

    await expect(page.getByText('Please enclose your question in double quotes.', { exact: false })).toBeVisible();
  });

  test('renders coffee ascii response', async ({ page }) => {
    const input = await openTerminal(page);

    await runCommand(input, 'coffee');

    await expect(page.getByText('Coffee deployed.', { exact: false })).toBeVisible();
  });

  test('renders cat ascii response', async ({ page }) => {
    const input = await openTerminal(page);

    await runCommand(input, 'cat');

    await expect(page.getByText('⢀⡴', { exact: false })).toBeVisible();
  });

  test('handles unknown command with suggestion', async ({ page }) => {
    const input = await openTerminal(page);

    await runCommand(input, 'projecs');

    const suggestionLine = page.locator('p', { hasText: 'Command not found: projecs' });
    await expect(suggestionLine).toBeVisible();
    await expect(suggestionLine).toContainText('Did you mean');
    await expect(suggestionLine).toContainText('projects');
  });

  test('clears terminal history', async ({ page }) => {
    const input = await openTerminal(page);

    await runCommand(input, 'help');
    await expect(page.getByText('Show this help message', { exact: false })).toBeVisible();

    await runCommand(input, 'clear');
    await expect(page.getByText('Show this help message', { exact: false })).toHaveCount(0);
  });

  test('supports command history navigation', async ({ page }) => {
    const input = await openTerminal(page);

    await runCommand(input, 'skills');
    await runCommand(input, 'contact');

    await page.keyboard.press('ArrowUp');
    await expect(input).toHaveValue('contact');

    await page.keyboard.press('ArrowUp');
    await expect(input).toHaveValue('skills');
  });

  test('autocompletes unique commands', async ({ page }) => {
    const input = await openTerminal(page);

    await input.fill('resu');
    await page.keyboard.press('Tab');

    await expect(input).toHaveValue('resume');
  });

  test('shows suggestions list for multiple matches', async ({ page }) => {
    const input = await openTerminal(page);

    await input.fill('pro');
    await expect(page.getByText('suggestions:', { exact: false })).toBeVisible();

    await page.getByRole('button', { name: 'projects' }).click();
    await expect(input).toHaveValue('projects');
  });

  test('quick action buttons fill the input', async ({ page }) => {
    const input = await openTerminal(page);

    await page.getByRole('button', { name: 'contact' }).click();
    await expect(input).toHaveValue('contact');
  });

  test('help command buttons set the input', async ({ page }) => {
    const input = await openTerminal(page);

    await runCommand(input, 'help');
    await page.getByRole('button', { name: 'projects' }).click();

    await expect(input).toHaveValue('projects');
  });
});
