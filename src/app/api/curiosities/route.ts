import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "../../../infrastructure/composition-root";
import { serializeUserCuriosities } from "../_lib/serializers";
import { withSession } from "../_lib/with-session";

export async function GET(request: NextRequest) {
  return withSession(request, async (userId) => {
    const { getUserCuriosities } = getContainer();
    const curiosities = await getUserCuriosities.execute(userId);
    return NextResponse.json(serializeUserCuriosities(curiosities));
  });
}
