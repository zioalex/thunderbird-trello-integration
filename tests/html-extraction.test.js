const { expect, describe, test } = require('@jest/globals');
require('./setup.js');

const { decodeHtmlEntities, htmlToMarkdown } = require('../background.js');

describe('HTML Extraction and Conversion', () => {
  describe('decodeHtmlEntities', () => {
    test('should decode common HTML entities', () => {
      expect(decodeHtmlEntities('&amp;')).toBe('&');
      expect(decodeHtmlEntities('&lt;')).toBe('<');
      expect(decodeHtmlEntities('&gt;')).toBe('>');
      expect(decodeHtmlEntities('&quot;')).toBe('"');
      expect(decodeHtmlEntities('&apos;')).toBe("'");
      expect(decodeHtmlEntities('&nbsp;')).toBe(' ');
    });

    test('should decode multiple entities in a string', () => {
      const input = 'You &amp; me &lt;3 &quot;coding&quot;';
      const expected = 'You & me <3 "coding"';
      expect(decodeHtmlEntities(input)).toBe(expected);
    });

    test('should decode special characters', () => {
      expect(decodeHtmlEntities('&ndash;')).toBe('–');
      expect(decodeHtmlEntities('&mdash;')).toBe('—');
      expect(decodeHtmlEntities('&hellip;')).toBe('...');
      expect(decodeHtmlEntities('&copy;')).toBe('©');
      expect(decodeHtmlEntities('&reg;')).toBe('®');
      expect(decodeHtmlEntities('&trade;')).toBe('™');
    });

    test('should decode numeric entities', () => {
      expect(decodeHtmlEntities('&#39;')).toBe("'");
      expect(decodeHtmlEntities('&#65;')).toBe('A');
      expect(decodeHtmlEntities('&#x41;')).toBe('A');
      expect(decodeHtmlEntities('&#x1F600;')).toBe('😀');
    });

    test('should handle text with no entities', () => {
      const plain = 'Just regular text';
      expect(decodeHtmlEntities(plain)).toBe(plain);
    });
  });

  describe('htmlToMarkdown', () => {
    test('should convert links to markdown format', () => {
      const html = '<a href="https://example.com">Click here</a>';
      const expected = '[Click here](https://example.com)';
      expect(htmlToMarkdown(html)).toBe(expected);
    });

    test('should convert bold text', () => {
      expect(htmlToMarkdown('<b>bold</b>')).toBe('**bold**');
      expect(htmlToMarkdown('<strong>strong</strong>')).toBe('**strong**');
    });

    test('should convert italic text', () => {
      expect(htmlToMarkdown('<i>italic</i>')).toBe('*italic*');
      expect(htmlToMarkdown('<em>emphasis</em>')).toBe('*emphasis*');
    });

    test('should convert headers', () => {
      expect(htmlToMarkdown('<h1>Header 1</h1>')).toContain('# Header 1');
      expect(htmlToMarkdown('<h2>Header 2</h2>')).toContain('## Header 2');
      expect(htmlToMarkdown('<h3>Header 3</h3>')).toContain('### Header 3');
    });

    test('should convert unordered lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('- Item 1');
      expect(result).toContain('- Item 2');
      expect(result).toContain('- Item 3');
    });

    test('should convert ordered lists', () => {
      const html = '<ol><li>First</li><li>Second</li><li>Third</li></ol>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('1. First');
      expect(result).toContain('2. Second');
      expect(result).toContain('3. Third');
    });

    test('should convert line breaks', () => {
      expect(htmlToMarkdown('Line1<br>Line2')).toBe('Line1\nLine2');
      expect(htmlToMarkdown('Line1<br/>Line2')).toBe('Line1\nLine2');
      expect(htmlToMarkdown('Line1<br />Line2')).toBe('Line1\nLine2');
    });

    test('should convert paragraphs', () => {
      const html = '<p>Paragraph 1</p><p>Paragraph 2</p>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('Paragraph 1');
      expect(result).toContain('Paragraph 2');
      expect(result.split('\n\n').length).toBeGreaterThan(1);
    });

    test('should convert code blocks', () => {
      const html = '<pre>code block</pre>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('```');
      expect(result).toContain('code block');
    });

    test('should convert inline code', () => {
      const html = 'Use <code>function()</code> here';
      expect(htmlToMarkdown(html)).toContain('`function()`');
    });

    test('should convert blockquotes', () => {
      const html = '<blockquote>This is a quote</blockquote>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('> This is a quote');
    });

    test('should handle complex nested HTML', () => {
      const html = `
        <p>Hello <b>world</b>!</p>
        <ul>
          <li>Item with <a href="http://example.com">link</a></li>
          <li>Item with <i>italic</i></li>
        </ul>
      `;
      const result = htmlToMarkdown(html);
      expect(result).toContain('Hello **world**!');
      expect(result).toContain('[link](http://example.com)');
      expect(result).toContain('*italic*');
    });

    test('should decode HTML entities in converted content', () => {
      const html = '<p>Tom &amp; Jerry &ndash; Best friends</p>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('Tom & Jerry – Best friends');
    });

    test('should remove remaining HTML tags', () => {
      const html = '<div><span>Text</span></div>';
      expect(htmlToMarkdown(html)).toBe('Text');
    });

    test('should clean up excessive whitespace', () => {
      const html = '<p>Text</p>\n\n\n\n<p>More text</p>';
      const result = htmlToMarkdown(html);
      expect(result).not.toMatch(/\n{4,}/);
    });

    test('should handle empty HTML', () => {
      expect(htmlToMarkdown('')).toBe('');
      expect(htmlToMarkdown('<p></p>')).toBe('');
    });

    test('should preserve text spacing', () => {
      const html = '<p>Word1   Word2</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('Word1 Word2'); // Multiple spaces collapsed to one
    });

    test('should handle HTML with inline styles and attributes', () => {
      const html = '<a href="http://example.com" style="color: blue;" target="_blank">Link</a>';
      expect(htmlToMarkdown(html)).toBe('[Link](http://example.com)');
    });

    test('should convert complex email HTML', () => {
      const html = `
        <div>
          <p>Hi Team,</p>
          <p>Please review the following:</p>
          <ul>
            <li><b>Task 1:</b> Complete the report</li>
            <li><b>Task 2:</b> Send <a href="mailto:john@example.com">email</a></li>
          </ul>
          <p>Thanks&nbsp;&amp;&nbsp;Regards,<br/>John</p>
        </div>
      `;
      const result = htmlToMarkdown(html);

      expect(result).toContain('Hi Team,');
      expect(result).toContain('Please review the following:');
      expect(result).toContain('**Task 1:**');
      expect(result).toContain('[email](mailto:john@example.com)');
      expect(result).toContain('Thanks & Regards');
    });
  });

  describe('Integration: Real-world email scenarios', () => {
    test('should handle typical email with formatting', () => {
      const html = `
        <html>
        <body>
          <p>Hi,</p>
          <p>I wanted to follow up on our <b>meeting discussion</b>.</p>
          <p>Action items:</p>
          <ol>
            <li>Review the <a href="https://docs.example.com">documentation</a></li>
            <li>Update the timeline</li>
            <li>Schedule follow-up</li>
          </ol>
          <p>Let me know if you have questions.</p>
          <p>Best,<br/>Alice</p>
        </body>
        </html>
      `;

      const result = htmlToMarkdown(html);

      expect(result).toContain('**meeting discussion**');
      expect(result).toContain('[documentation](https://docs.example.com)');
      expect(result).toContain('1. Review');
      expect(result).toContain('2. Update');
      expect(result).toContain('3. Schedule');
    });

    test('should handle email with quote and reply', () => {
      const html = `
        <p>I agree with your proposal.</p>
        <blockquote>
          <p>What do you think about the new design?</p>
        </blockquote>
      `;

      const result = htmlToMarkdown(html);

      expect(result).toContain('I agree with your proposal');
      expect(result).toContain('> What do you think about the new design?');
    });
  });
});
