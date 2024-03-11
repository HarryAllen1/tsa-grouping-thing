import MarkdownIt from 'markdown-it';

export const md = new MarkdownIt({
	linkify: true,
	html: true,
});

export const noHtmlMd = new MarkdownIt({
	linkify: true,
	html: false,
});
