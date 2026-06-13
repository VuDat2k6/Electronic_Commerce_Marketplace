# K6 Load Check

## Van de
- Repo chua co script k6 rieng cho marketplace.
- May hien tai chua co lenh `k6`.
- Can kiem tra hieu nang o muc an toan, tranh tao don hang/ghi database hang loat.

## Pham vi
- Tao script k6 cho cac flow public/read-only va mot so endpoint an toan.
- Uu tien smoke/load nhe de khong bi backend rate limiter chan nham.
- Ghi lai cach chay va ket qua test.

## Huong xu ly
- Dung bien moi truong cho frontend/backend URL, VUs, duration va threshold.
- Mac dinh test:
  - Frontend homepage/search/shop/product page.
  - Backend `/health`, `/api/products`, `/api/search`, `/api/slugs/:slug`.
- Khong test checkout tao don hang bang k6 trong lan nay vi can sandbox/payment strategy rieng de tranh ghi du lieu that.

## Ket qua
- Da tao `tests/k6/marketplace-smoke.js`.
- Da them npm script `test:k6`.
- May da co k6 qua winget tai `C:\Program Files\k6\k6.exe`, nhung shell hien tai chua tu nhan PATH nen da chay truc tiep bang binary.
- Lenh da chay:
  - `k6 run --summary-export test-evidence/k6-marketplace-smoke-summary.json tests/k6/marketplace-smoke.js`
- Cau hinh mac dinh:
  - 2 VUs
  - 20s
  - frontend `http://localhost:3000`
  - backend `http://localhost:5000`
- Ket qua:
  - 3/3 thresholds pass.
  - `checks`: 100.00% pass, 306/306.
  - `http_req_failed`: 0.00%, 0/144.
  - `http_req_duration`: avg 32.92ms, p90 54.17ms, p95 69.42ms, max 553.87ms.
  - `http_reqs`: 144 requests, 7.05 req/s.
  - `iterations`: 18.
- Khong test checkout tao don hang bang k6 trong lan nay de tranh ghi du lieu that. Checkout nen co test k6 rieng voi sandbox DB/payment va cleanup strategy.
