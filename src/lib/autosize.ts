import type { Action } from 'svelte/action';
import autosizeTextarea from 'autosize';

export const autosize: Action = (node) => {
	autosizeTextarea(node);

	return {
		destroy() {
			autosizeTextarea.destroy(node);
		},
	};
};
