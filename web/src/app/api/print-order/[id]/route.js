import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const id = params.id;
    const orderResult = await sql`SELECT * FROM orders WHERE id = ${id}`;
    const order = orderResult[0];
    if (!order) return new Response("Order not found", { status: 404 });

    const items = await sql`SELECT * FROM order_items WHERE order_id = ${id}`;
    const restaurantResult =
      await sql`SELECT * FROM restaurants WHERE id = ${order.restaurant_id}`;
    const restaurant = restaurantResult[0];

    const itemRows = items
      .map(
        (item) => `
          <tr>
            <td>${item.item_name}</td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right;">৳${Number(item.item_price).toFixed(0)}</td>
            <td style="text-align: right;">৳${Number(item.subtotal).toFixed(0)}</td>
          </tr>
        `,
      )
      .join("");

    const time = new Date(order.created_at).toLocaleString("en-BD", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order #${order.id} — ${restaurant?.name || ""}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; color: #333; }
            h1 { font-size: 20px; margin-bottom: 5px; text-align: center; }
            .info { text-align: center; font-size: 14px; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { border-bottom: 2px solid #eee; text-align: left; padding: 8px 4px; font-size: 14px; }
            td { padding: 8px 4px; border-bottom: 1px solid #eee; font-size: 14px; }
            .total-row td { border-top: 2px solid #333; font-weight: bold; font-size: 16px; padding-top: 15px; }
            .customer { margin-bottom: 10px; border-top: 1px dashed #ccc; padding-top: 10px; }
            .customer p { margin: 4px 0; font-size: 14px; }
            .btn { display: block; width: 100%; padding: 12px; background: #000; color: #fff; text-align: center; text-decoration: none; border-radius: 8px; margin-top: 30px; }
            @media print { .btn { display: none; } }
          </style>
        </head>
        <body>
          <h1>${restaurant?.name || "Restaurant"}</h1>
          <div class="info">Order #${order.id} &nbsp;·&nbsp; ${time}</div>
          
          <div class="customer">
            <p><strong>Customer:</strong> ${order.customer_name}</p>
            ${order.notes ? `<p><strong>Note:</strong> ${order.notes}</p>` : ""}
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
              <tr class="total-row">
                <td colspan="3">Total</td>
                <td style="text-align: right;">৳${Number(order.total).toFixed(0)}</td>
              </tr>
            </tbody>
          </table>

          <a href="javascript:window.print()" class="btn">🖨 Print</a>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Failed to generate print page", { status: 500 });
  }
}
