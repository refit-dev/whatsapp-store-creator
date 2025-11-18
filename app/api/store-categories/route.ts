import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { saveStoreCategories } from "@/lib/store-categories";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { storeId, categoryIds, primaryCategoryId } = body;

    // Validate input
    if (!storeId || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid input. storeId and categoryIds are required." },
        { status: 400 }
      );
    }

    // Save categories
    const result = await saveStoreCategories(
      storeId,
      categoryIds,
      primaryCategoryId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to save categories" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Error in store categories API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
