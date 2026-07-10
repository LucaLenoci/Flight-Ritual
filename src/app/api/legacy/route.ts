import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "../../../infrastructure/composition-root";
import { serializeFlightMemory, serializeUserCollection } from "../_lib/serializers";
import { withSession } from "../_lib/with-session";

export async function GET(request: NextRequest) {
  return withSession(request, async (userId) => {
    const { getUserLegacy } = getContainer();
    const view = await getUserLegacy.execute(userId);

    return NextResponse.json({
      memories: view.memories.map(serializeFlightMemory),
      collection: serializeUserCollection(view.collection),
      stats: view.stats,
    });
  });
}
