/**
 * Attempt to parse a JSON string and return the decoded value.
 * If the string cannot be parsed, return undefined.
 *
 * @param maybeJSONString - The string to attempt to parse.
 */
export const maybeParseJSON = (maybeJSONString: string): unknown => {
  try {
    return JSON.parse(maybeJSONString);
  } catch {
    return undefined;
  }
};

export const readFileAsText = (file: File): Promise<string | null> => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    // reader.result is a string here because we call reader.readAsText
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};
