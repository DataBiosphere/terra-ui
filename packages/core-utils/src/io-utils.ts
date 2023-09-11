export const readFileAsText = (file: File): Promise<string | null> => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    // reader.result is a string here because we call reader.readAsText
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};
