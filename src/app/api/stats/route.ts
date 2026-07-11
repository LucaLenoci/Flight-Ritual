import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "../../../infrastructure/composition-root";
import { serializeStatsSnapshot } from "../_lib/serializers";
import { withSession } from "../_lib/with-session";

export async function GET(request: NextRequest) {
  return withSession(request, async (userId) => {
    const { getUserStatistics } = getContainer();
    const stats = await getUserStatistics.execute(userId);
    return NextResponse.json(serializeStatsSnapshot(stats));
  });
}
