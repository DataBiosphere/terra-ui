export const basename = (path: string) => path.replace(/\/$/, '').split('/').at(-1);

export const dirname = (path: string) => {
  const parentPath = path.replace(/\/$/, '').split('/').slice(0, -1).join('/');
  return parentPath === '' ? '' : `${parentPath}/`;
};
