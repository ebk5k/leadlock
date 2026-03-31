import { NextResponse } from "next/server";

import { leadService } from "@/lib/services/lead-service";
import { demoFormSchema } from "@/lib/validators/forms";

export async function POST(request: Request) {
  const payload = await request.json();
  const result = demoFormSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json({ success: false, message: "Invalid lead submission." }, { status: 400 });
  }

  const lead = await leadService.createLead(result.data);

  return NextResponse.json({ success: true, lead });
}
