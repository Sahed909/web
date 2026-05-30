import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const id = params.id;
    const qrResult = await sql`SELECT * FROM qr_codes WHERE id = ${id}`;
    const qr = qrResult[0];
    if (!qr) return new Response("QR code not found", { status: 404 });

    const restaurantResult =
      await sql`SELECT * FROM restaurants WHERE id = ${qr.restaurant_id}`;
    const restaurant = restaurantResult[0];

    const appUrl = process.env.NEXT_PUBLIC_CREATE_APP_URL || "";
    const orderUrl = `${appUrl}/order/${id}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=${encodeURIComponent(orderUrl)}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code — ${restaurant?.name || ""}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; text-align: center; color: #333; }
            .container { max-width: 450px; margin: 0 auto; border: 2px solid #eee; padding: 40px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            h1 { font-size: 24px; margin-bottom: 10px; }
            p { color: #666; margin-bottom: 30px; }
            img { width: 100%; max-width: 300px; height: auto; display: block; margin: 0 auto; }
            .footer { margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; font-size: 18px; font-weight: bold; }
            .type { font-size: 14px; color: #999; margin-top: 5px; }
            .btn { display: inline-block; padding: 12px 30px; background: #000; color: #fff; text-align: center; text-decoration: none; border-radius: 8px; margin-top: 40px; cursor: pointer; }
            @media print { .btn { display: none; } .container { border: none; box-shadow: none; } }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${restaurant?.name || "Our Menu"}</h1>
            <p>Scan to view menu & order</p>
            
            <img src="${qrImageUrl}" alt="QR Code" />

            <div class="footer">${qr.label}</div>
            <div class="type">${qr.type === "permanent" ? "Permanent QR" : "Temporary QR"}</div>
          </div>

          <button onclick="window.print()" class="btn">🖨 Print</button>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Failed to generate QR print page", { status: 500 });
  }
}
