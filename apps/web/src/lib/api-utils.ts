import { NextResponse } from "next/server";
import { ZodError } from "zod";

type ApiResponse<T> = {
  success: true;
  data: T;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
};

export function apiSuccess<T>(
  data: T,
  pagination?: ApiResponse<T>["pagination"],
  status = 200
) {
  const body: ApiResponse<T> = { success: true, data };
  if (pagination) body.pagination = pagination;
  return NextResponse.json(body, { status });
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: { field: string; message: string }[]
) {
  const body: ApiError = {
    success: false,
    error: { code, message, ...(details && { details }) },
  };
  return NextResponse.json(body, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return apiError(
      "VALIDATION_ERROR",
      "Validation failed",
      400,
      error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }))
    );
  }

  console.error("API Error:", error);
  return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
}
