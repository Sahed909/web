import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const restaurant_id = searchParams.get("restaurant_id");

  try {
    if (!restaurant_id) {
      return Response.json(
        { error: "restaurant_id is required" },
        { status: 400 },
      );
    }

    const orders = await sql`
      SELECT * FROM orders
      WHERE restaurant_id = ${restaurant_id}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    if (orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      const allItems = await sql`
        SELECT * FROM order_items
        WHERE order_id = ANY(${orderIds})
      `;

      const ordersWithItems = orders.map((order) => ({
        ...order,
        items: allItems.filter((item) => item.order_id === order.id),
      }));

      return Response.json(ordersWithItems);
    }

    return Response.json([]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { qr_code_id, restaurant_id, customer_name, notes, total, items } =
      await request.json();

    if (!restaurant_id || !customer_name || !items || items.length === 0) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Insert the order first
    const orderResult = await sql`
      INSERT INTO orders (qr_code_id, restaurant_id, customer_name, notes, total, status)
      VALUES (${qr_code_id || null}, ${restaurant_id}, ${customer_name}, ${notes || null}, ${total}, 'pending')
      RETURNING *
    `;
    const order = orderResult[0];

    // Then insert each order item sequentially
    for (const item of items) {
      await sql`
        INSERT INTO order_items (order_id, menu_item_id, item_name, item_price, quantity, subtotal)
        VALUES (${order.id}, ${item.menu_item_id}, ${item.item_name}, ${item.item_price}, ${item.quantity}, ${item.subtotal})
      `;
    }

    return Response.json(order);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }
}
