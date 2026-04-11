import { createCustomerOrderController } from "../controllers/customerOrders.controller";

type Handler = (req: unknown, res: unknown) => unknown;

interface RouterLike {
  post: (path: string, handler: Handler) => void;
}

/**
 * Registers customer order routes on a router-like object (Express-compatible).
 */
export function registerCustomerOrderRoutes(router: RouterLike): void {
  router.post("/customer-orders/checkout", createCustomerOrderController as Handler);
}
