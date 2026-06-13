# Seller analytics 30-day chart UI fix

## Van de

Trong seller analytics, section `Revenue in the Last 30 Days` hien thi nhu mot duong xanh mong o day chart, label ngay bi nghieng/tran khoi card. User thay chart bi loi du du lieu API da co doanh thu.

## Root cause

- UI hien moi ngay 0 revenue bang bar xanh `min-h-[2px]`, tao cam giac thanh mot duong xanh lien tuc.
- Label ngay rotate 45 do va translate ra ngoai card, gay tran/chen layout.
- Chart khong co grid/scale/tong doanh thu 30 ngay, kho doc khi chi co 1-2 ngay co doanh thu.
- API da dung: `dailyRevenue` co non-zero cho `2026-05-30` va `2026-05-31`.

## Huong sua

- Tao chart UI ro rang hon bang div/CSS, khong them dependency.
- Zero revenue bars dung mau gray nhe, non-zero bars dung gradient green va co min height hop ly.
- Them grid lines, tong revenue 30 ngay, va tooltip hover.
- Chi hien label moc ngay theo khoang, khong rotate/tran layout.
- Giu response contract cua API.

## Kiem thu du kien

- API data non-zero hien thanh cot ro rang.
- Label khong tran khoi card.
- Card khong con duong xanh lien tuc khi ngay revenue = 0.
- E2E analytics pass.

## Fix da ap dung

- `app/(seller)/seller/analytics/page.tsx`
  - Them `RevenueBarChart`.
  - Them 30-day total va peak day.
  - Them y-axis labels va dashed grid lines.
  - Zero revenue days dung bar xam mong thay vi bar xanh.
  - Non-zero days dung green gradient va min height 8% de de nhin.
  - Date labels chi hien theo moc 5 ngay va khong rotate/tran khoi card.
- `e2e/seller-analytics.spec.ts`
  - Them assertion cho `30-day total` va `Peak day`.

## Kiem thu da chay

- Kiem tra API dailyRevenue:
  - `2026-05-30`: `17.980.000`
  - `2026-05-31`: `31.990.000`
  - max day: `31.990.000`
- `npx eslint -- "app/(seller)/seller/analytics/page.tsx" e2e/seller-analytics.spec.ts` passed.
- `npx tsc --noEmit --pretty false` passed.
- `npx playwright test e2e/seller-analytics.spec.ts --project=chromium --reporter=line --workers=1` passed, 2 tests.
- Screenshot chart moi:
  - `test-evidence/seller-analytics-chart/seller-analytics-30-day-chart-fixed.png`
- Health check:
  - Frontend `/` -> 200.
  - Backend `/health` -> 200.
