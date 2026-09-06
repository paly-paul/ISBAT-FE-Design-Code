const { chromium } = require('playwright')
const path = require('path')

const OUT_DIR = path.resolve(__dirname, 'shots')
require('fs').mkdirSync(OUT_DIR, { recursive: true })

const BASE = 'http://127.0.0.1:3010'
const USER = 'JOAN'
const PASS = 'password1234;'

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, name), fullPage: true })
  console.log('SCREENSHOT:', name)
}

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  const consoleErrors = []
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
  page.on('pageerror', err => consoleErrors.push('PAGEERROR: ' + err.message))

  const netFailures = []
  page.on('response', res => {
    if (res.url().includes('/api/') && res.status() >= 400) {
      netFailures.push(`${res.status()} ${res.url()}`)
    }
  })

  console.log('nav login')
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await shot(page, '01-login-portal.png')

  // Portal selector: Staff vs Student. JOAN looks like a staff user (per
  // earlier screenshot showing Finance module access) — go straight to the
  // staff login route.
  await page.goto(`${BASE}/login/staff`, { waitUntil: 'networkidle' })
  await shot(page, '02-login-staff-form.png')

  // Fill whichever ID/password fields exist.
  const idInput = page.locator('input').first()
  await idInput.fill(USER)
  const pwInput = page.locator('input[type="password"]').first()
  await pwInput.fill(PASS)
  await shot(page, '03-login-filled.png')

  const submitBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In"), button:has-text("Continue")').first()
  await submitBtn.click()
  await page.waitForLoadState('networkidle')
  await shot(page, '04-after-login-submit.png')
  console.log('URL after submit:', page.url())

  // If an OTP step appears, use the mock OTP 123456 (per CLAUDE.md).
  if (page.url().includes('/login/otp')) {
    const otpInputs = page.locator('input')
    const count = await otpInputs.count()
    if (count > 1) {
      const digits = '123456'.split('')
      for (let i = 0; i < count && i < digits.length; i++) await otpInputs.nth(i).fill(digits[i])
    } else {
      await otpInputs.first().fill('123456')
    }
    await shot(page, '05-otp-filled.png')
    const otpSubmit = page.locator('button[type="submit"], button:has-text("Verify"), button:has-text("Continue")').first()
    await otpSubmit.click()
    await page.waitForLoadState('networkidle')
    await shot(page, '06-after-otp.png')
  }

  console.log('URL now:', page.url())

  console.log('nav payment-refund')
  await page.goto(`${BASE}/finance/payment-refund`, { waitUntil: 'networkidle' })
  await shot(page, '07-payment-refund-page.png')
  console.log('URL:', page.url())

  await browser.close()
  console.log('CONSOLE_ERRORS:', JSON.stringify(consoleErrors, null, 2))
  console.log('NET_FAILURES:', JSON.stringify(netFailures, null, 2))
}

main().catch(err => { console.error('FATAL:', err); process.exit(1) })
