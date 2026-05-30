import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  const qrId = params.qrId;

  try {
    const qrCodeResult = await sql`SELECT * FROM qr_codes WHERE id = ${qrId}`;
    const qrCode = qrCodeResult[0];

    if (!qrCode) {
      return Response.json({ error: "Invalid QR Code" }, { status: 404 });
    }

    if (
      !qrCode.is_active ||
      (qrCode.expires_at && new Date(qrCode.expires_at) < new Date())
    ) {
      return Response.json(
        { error: "This QR Code has expired" },
        { status: 403 },
      );
    }

    const restaurantResult =
      await sql`SELECT * FROM restaurants WHERE id = ${qrCode.restaurant_id}`;
    const restaurant = restaurantResult[0];

    const menuItems = await sql`
      SELECT * FROM menu_items
      WHERE restaurant_id = ${qrCode.restaurant_id} AND is_available = TRUE
      ORDER BY category ASC, name ASC
    `;

    return Response.json({ restaurant, qrCode, menuItems });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch menu" }, { status: 500 });
  }
}
