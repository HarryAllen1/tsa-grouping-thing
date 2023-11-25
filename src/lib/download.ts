export const downloadURL = (url: string, filename: string) =>
	Object.assign(document.createElement('a'), {
		href: url,
		download: filename,
		target: '_blank',
		rel: 'noopener',
	}).click();
