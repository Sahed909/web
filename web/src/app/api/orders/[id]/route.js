import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const id = params.id;
    const orderResult = await sql`SELECT * FROM orders WHERE id = ${id}`;
    const order = orderResult[0];
    if (!order)
      return Response.json({ error: "Order not found" }, { status: 404 });

    const items = await sql`SELECT * FROM order_items WHERE order_id = ${id}`;
    return Response.json({ ...order, items });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const id = params.id;
    const { status } = await request.json();

    if (!id || !status) {
      return Response.json(
        { error: "ID and status are required" },
        { status: 400 },
      );
    }

    const updatedOrder = await sql`
      UPDATE orders
      SET status = ${status}
      WHERE id = ${id}
      RETURNING *
    `;

    return Response.json(updatedOrder[0]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = params.id;
    if (!id) {
      return Response.json({ error: "ID is required" }, { status: 400 });
    }
    await sql`DELETE FROM orders WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
