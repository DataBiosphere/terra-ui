export const basename = (path: string) => path.replace(/\/$/, '').split('/').at(-1)
