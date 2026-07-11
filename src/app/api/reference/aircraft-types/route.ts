import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "../../../../infrastructure/composition-root";
import { serializeAircraftType } from "../../_lib/serializers";
import { withSession } from "../../_lib/with-session";

/** Small curated catalog — listed in full for a dropdown rather than searched. */
export async function GET(request: NextRequest) {
  return withSession(request, async () => {
    const { aircraftTypeReferenceProvider } = getContainer();
    const aircraftTypes = await aircraftTypeReferenceProvider.listAll();
    return NextResponse.json({ aircraftTypes: aircraftTypes.map(serializeAircraftType) });
  });
}
