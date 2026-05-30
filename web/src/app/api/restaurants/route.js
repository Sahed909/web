import sql from "@/app/api/utils/sql";
import { getAuthUser } from "@/app/api/utils/getAuthUser";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const mine = searchParams.get("mine");

  try {
    // Return the restaurant for the currently authenticated user
    if (mine === "true") {
      const user = await getAuthUser(request);
      if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const restaurants = await sql`
        SELECT * FROM restaurants WHERE user_id = ${user.id} LIMIT 1
      `;
      return Response.json(restaurants[0] || null);
    }

    if (id) {
      const restaurants = await sql`SELECT * FROM restaurants WHERE id = ${id}`;
      return Response.json(restaurants[0] || null);
    }

    const restaurants = await sql`SELECT * FROM restaurants`;
    return Response.json(restaurants);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { name } = await request.json();
    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const user = await getAuthUser(request);

    // If user is authenticated, check if they already have a restaurant
    if (user) {
      const existing = await sql`
        SELECT * FROM restaurants WHERE user_id = ${user.id} LIMIT 1
      `;
      if (existing[0]) {
        // Update name of their existing restaurant instead of creating a new one
        const updated = await sql`
          UPDATE restaurants SET name = ${name} WHERE user_id = ${user.id} RETURNING *
        `;
        return Response.json(updated[0]);
      }
    }

    const newRestaurant = await sql`
      INSERT INTO restaurants (name, user_id)
      VALUES (${name}, ${user?.id ?? null})
      RETURNING *
    `;

    return Response.json(newRestaurant[0]);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to create restaurant" },
      { status: 500 },
    );
  }
}
