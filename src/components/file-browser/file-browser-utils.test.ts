import { basename } from 'src/components/file-browser/file-browser-utils'


describe('basename', () => {
  it('returns file basename from path', () => {
    expect(basename('path/to/file.txt')).toBe('file.txt')
    expect(basename('file.txt')).toBe('file.txt')
  })

  it('returns directory basename from path', () => {
    expect(basename('path/to/directory/')).toBe('directory')
    expect(basename('directory/')).toBe('directory')

    expect(basename('')).toBe('')
    expect(basename('/')).toBe('')
  })
})
