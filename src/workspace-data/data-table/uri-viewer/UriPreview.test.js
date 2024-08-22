import { canRender, isFilePreviewable, isHtml, isImage, isPdf, isText } from './UriPreview';

describe('File Utilities', () => {
  describe('isImage', () => {
    it('should return true for image content types', () => {
      expect(isImage({ contentType: 'image/jpeg', name: 'photo.jpg' })).toBe(true);
      expect(isImage({ contentType: 'image/png', name: 'image.png' })).toBe(true);
    });

    it('should return true for image file extensions', () => {
      expect(isImage({ contentType: 'application/octet-stream', name: 'icon.svg' })).toBe(true);
      expect(isImage({ contentType: 'application/octet-stream', name: 'picture.bmp' })).toBe(true);
    });

    it('should return false for non-image types or names', () => {
      expect(isImage({ contentType: 'text/plain', name: 'document.txt' })).toBe(false);
      expect(isImage({ contentType: 'application/json', name: 'data.json' })).toBe(false);
      expect(isText({ contentType: 'application/octet-stream', name: 'icon.svg.gz' })).toBe(false);
    });
  });

  describe('isText', () => {
    it('should return true for text content types', () => {
      expect(isText({ contentType: 'text/plain', name: 'readme.txt' })).toBe(true);
      expect(isText({ contentType: 'application/json', name: 'config.json' })).toBe(true);
      expect(isText({ contentType: 'text/x-vcard', name: 'file.vcf.gz' })).toBe(true);
    });

    it('should return true for text file extensions', () => {
      expect(isText({ contentType: 'application/octet-stream', name: 'file.csv' })).toBe(true);
      expect(isText({ contentType: 'application/octet-stream', name: 'log.log' })).toBe(true);
    });

    it('should return false for non-text types or names', () => {
      expect(isText({ contentType: 'image/jpeg', name: 'photo.jpg' })).toBe(false);
      expect(isText({ contentType: 'application/pdf', name: 'document.pdf' })).toBe(false);
      expect(isText({ contentType: 'application/octet-stream', name: 'file.csv.gz' })).toBe(false);
    });
  });

  describe('isHtml', () => {
    test('should return true for HTML content type', () => {
      expect(isHtml({ contentType: 'text/html', name: 'example.html' })).toBe(true);
    });

    test('should return true for .html file extension', () => {
      expect(isHtml({ contentType: '', name: 'example.html' })).toBe(true);
    });

    test('should return false for non-HTML content type and file extension', () => {
      expect(isHtml({ contentType: 'application/json', name: 'example.json' })).toBe(false);
    });
  });

  describe('isPdf', () => {
    test('should return true for PDF content type', () => {
      expect(isPdf({ contentType: 'application/pdf', name: 'example.pdf' })).toBe(true);
    });

    test('should return true for .pdf file extension', () => {
      expect(isPdf({ contentType: '', name: 'example.pdf' })).toBe(true);
    });

    test('should return false for non-PDF content type and file extension', () => {
      expect(isPdf({ contentType: 'text/plain', name: 'example.txt' })).toBe(false);
    });
  });

  describe('canRender', () => {
    it('should return true for renderable content types', () => {
      expect(canRender({ contentType: 'text/html', name: 'page.html' })).toBe(true);
      expect(canRender({ contentType: 'application/pdf', name: 'document.pdf' })).toBe(true);
    });

    it('should return true for renderable file extensions', () => {
      expect(canRender({ contentType: 'application/octet-stream', name: 'manual.pdf' })).toBe(true);
      expect(canRender({ contentType: 'application/octet-stream', name: 'website.html' })).toBe(true);
    });

    it('should return false for non-renderable types or names', () => {
      expect(canRender({ contentType: 'image/jpeg', name: 'photo.jpg' })).toBe(false);
      expect(canRender({ contentType: 'application/json', name: 'data.json' })).toBe(false);
      expect(canRender({ contentType: 'application/octet-stream', name: 'manual.pdf.gz' })).toBe(false);
    });
  });

  describe('isFilePreviewable', () => {
    it('should return true for previewable binary files', () => {
      expect(isFilePreviewable({ size: 500000000, contentType: 'application/pdf', name: 'file.pdf' })).toBe(true);
    });

    it('should return true for previewable text files', () => {
      expect(isFilePreviewable({ size: 1000, contentType: 'text/plain', name: 'readme.txt' })).toBe(true);
    });

    it('should return true for previewable image files under size limit', () => {
      expect(isFilePreviewable({ size: 100000000, contentType: 'image/jpeg', name: 'photo.jpg' })).toBe(true);
    });

    it('should return false for non-previewable files over size limit', () => {
      expect(isFilePreviewable({ size: 2000000000, contentType: 'image/png', name: 'large-image.png' })).toBe(false);
    });

    it('should return false for non-previewable files of other types', () => {
      expect(isFilePreviewable({ size: 500000000, contentType: 'video/mp4', name: 'video.mp4' })).toBe(false);
      expect(isFilePreviewable({ size: 1000, contentType: 'application/octet-stream', name: 'file.vcf.gz' })).toBe(false);
    });
  });
});
