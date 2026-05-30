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

    const codes = await sql`
      SELECT * FROM qr_codes
      WHERE restaurant_id = ${restaurant_id}
      ORDER BY created_at DESC
    `;
    return Response.json(codes);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch QR codes" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { restaurant_id, label, type, expires_in_hours } =
      await request.json();

    if (!restaurant_id || !type) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    let expires_at = null;
    if (type === "time_based" && expires_in_hours) {
      expires_at = new Date(
        Date.now() + expires_in_hours * 60 * 60 * 1000,
      ).toISOString();
    }

    const newQr = await sql`
      INSERT INTO qr_codes (restaurant_id, label, type, expires_at)
      VALUES (${restaurant_id}, ${label || "Menu QR"}, ${type}, ${expires_at})
      RETURNING *
    `;

    return Response.json(newQr[0]);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to create QR code" },
      { status: 500 },
    );
  }
}
