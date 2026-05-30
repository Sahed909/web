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

    const items = await sql`
      SELECT * FROM menu_items
      WHERE restaurant_id = ${restaurant_id}
      ORDER BY category ASC, name ASC
    `;
    return Response.json(items);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch menu items" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const {
      restaurant_id,
      name,
      description,
      price,
      quantity,
      category,
      image_url,
      is_available,
    } = await request.json();

    if (!restaurant_id || !name || price === undefined) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const newItem = await sql`
      INSERT INTO menu_items (restaurant_id, name, description, price, quantity, category, image_url, is_available)
      VALUES (${restaurant_id}, ${name}, ${description || null}, ${price}, ${quantity || 0}, ${category || null}, ${image_url || null}, ${is_available !== undefined ? is_available : true})
      RETURNING *
    `;

    return Response.json(newItem[0]);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to create menu item" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      price,
      quantity,
      category,
      image_url,
      is_available,
    } = body;

    if (!id) {
      return Response.json(
        { error: "Menu item ID is required" },
        { status: 400 },
      );
    }

    const updatedItem = await sql`
      UPDATE menu_items
      SET
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        price = COALESCE(${price}, price),
        quantity = COALESCE(${quantity}, quantity),
        category = COALESCE(${category}, category),
        image_url = COALESCE(${image_url}, image_url),
        is_available = COALESCE(${is_available}, is_available)
      WHERE id = ${id}
      RETURNING *
    `;

    return Response.json(updatedItem[0]);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to update menu item" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { error: "Menu item ID is required" },
        { status: 400 },
      );
    }

    await sql`DELETE FROM menu_items WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to delete menu item" },
      { status: 500 },
    );
  }
}
