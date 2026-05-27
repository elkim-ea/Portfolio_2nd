const defaultHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
};

export const ok = (body: unknown) => {
  return {
    statusCode: 200,
    headers: defaultHeaders,
    body: JSON.stringify(body),
  };
};

export const badRequest = (message: string) => {
  return {
    statusCode: 400,
    headers: defaultHeaders,
    body: JSON.stringify({ message }),
  };
};

export const serverError = (message = "Internal server error") => {
  return {
    statusCode: 500,
    headers: defaultHeaders,
    body: JSON.stringify({ message }),
  };
};