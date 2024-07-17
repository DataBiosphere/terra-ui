export const jsonBody = (body: any) => ({
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json' },
});

export type JSONValue = string | number | boolean | JSONObject | JSONArray;

interface JSONObject {
  [x: string]: JSONValue;
}

type JSONArray = Array<JSONValue>;
