export const jsonBody = (body: any) => ({
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json' },
});
