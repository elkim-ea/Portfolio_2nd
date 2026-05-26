import type { ZodError } from "zod";

export const formatZodError = (error: ZodError): string => {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".") || "body";
      return `${path}: ${issue.message}`;
    })
    .join(", ");
};