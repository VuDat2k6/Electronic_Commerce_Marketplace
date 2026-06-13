import { createCustomerOrder } from "../services/order.service";

interface RequestLike {
  body?: {
    customerId?: string;
    items?: Array<{
      productId: string;
      quantity: number;
      unitPrice?: number;
      sellerId?: string;
    }>;
  };
}

interface ResponseLike {
  status: (code: number) => ResponseLike;
  json: (payload: unknown) => unknown;
}

export async function createCustomerOrderController(
  req: RequestLike,
  res: ResponseLike
): Promise<unknown> {
  try {
    const customerId = req.body?.customerId ?? "";
    const items = req.body?.items ?? [];

    const order = await createCustomerOrder({
      customerId,
      items,
    });

    return res.status(201).json({ order });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create order";

    return res.status(400).json({ error: message });
  }
}
