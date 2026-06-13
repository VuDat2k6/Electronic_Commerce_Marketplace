import http from "k6/http";
import { check, group, sleep } from "k6";

const FRONTEND_URL = (__ENV.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
const API_URL = (__ENV.API_URL || "http://localhost:5000").replace(/\/$/, "");
const PRODUCT_SLUG =
  __ENV.PRODUCT_SLUG || "sony-wh-1000xm5-wireless-headphones-gadget-pro";
const SEARCH_QUERY = __ENV.SEARCH_QUERY || "sony";

export const options = {
  scenarios: {
    marketplace_smoke: {
      executor: "constant-vus",
      vus: Number(__ENV.VUS || 2),
      duration: __ENV.DURATION || "20s",
    },
  },
  thresholds: {
    checks: ["rate>0.95"],
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2000"],
  },
};

function json(response) {
  try {
    return response.json();
  } catch {
    return null;
  }
}

function checkOk(response, name) {
  return check(response, {
    [`${name} returned 2xx`]: (res) => res.status >= 200 && res.status < 300,
    [`${name} finished under 2s`]: (res) => res.timings.duration < 2000,
  });
}

export default function () {
  let productSlug = PRODUCT_SLUG;

  group("backend public APIs", () => {
    const health = http.get(`${API_URL}/health`, {
      tags: { endpoint: "backend-health" },
    });
    checkOk(health, "GET /health");

    const products = http.get(`${API_URL}/api/products?page=1&limit=8`, {
      tags: { endpoint: "backend-products" },
    });
    checkOk(products, "GET /api/products");
    check(products, {
      "products response has items": (res) => {
        const body = json(res);
        const items = body?.products || body?.data || body;
        if (Array.isArray(items) && items.length > 0) {
          productSlug = items[0].slug || productSlug;
          return true;
        }
        return false;
      },
    });

    const search = http.get(
      `${API_URL}/api/search?query=${encodeURIComponent(SEARCH_QUERY)}`,
      { tags: { endpoint: "backend-search" } },
    );
    checkOk(search, "GET /api/search");

    const slug = http.get(`${API_URL}/api/slugs/${encodeURIComponent(productSlug)}`, {
      tags: { endpoint: "backend-product-slug" },
    });
    checkOk(slug, "GET /api/slugs/:slug");
  });

  group("frontend public pages", () => {
    checkOk(
      http.get(`${FRONTEND_URL}/`, { tags: { endpoint: "frontend-home" } }),
      "GET /",
    );

    checkOk(
      http.get(`${FRONTEND_URL}/shop`, { tags: { endpoint: "frontend-shop" } }),
      "GET /shop",
    );

    checkOk(
      http.get(`${FRONTEND_URL}/search?search=${encodeURIComponent(SEARCH_QUERY)}`, {
        tags: { endpoint: "frontend-search" },
      }),
      "GET /search",
    );

    checkOk(
      http.get(`${FRONTEND_URL}/product/${encodeURIComponent(productSlug)}`, {
        tags: { endpoint: "frontend-product" },
      }),
      "GET /product/:slug",
    );
  });

  sleep(Number(__ENV.SLEEP || 2));
}
