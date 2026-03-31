import { NextResponse } from "next/server";

import { employeeService } from "@/lib/services/employee-service";
import { employeeFormSchema } from "@/lib/validators/forms";

export async function GET() {
  const employees = await employeeService.getEmployees();

  return NextResponse.json({ success: true, employees });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const result = employeeFormSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: "Invalid employee submission." },
      { status: 400 }
    );
  }

  const employee = await employeeService.createEmployee({
    name: result.data.name,
    role: result.data.role,
    phone: result.data.phone,
    email: result.data.email || undefined,
    active: result.data.active
  });

  return NextResponse.json({ success: true, employee });
}
