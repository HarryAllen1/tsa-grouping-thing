import { renderComponent } from '$lib/components/ui/data-table';
import type { EventDoc } from '$lib/types';
import type { ColumnDef } from '@tanstack/table-core';
import DataTableUserCell from './DataTableUserCell.svelte';
import DataTableDialog from './DataTableDialog.svelte';

export interface FirestoreLog {
	/** unix timestamp */
	updatedAt: number;
	beforeData: EventDoc;
	afterData: EventDoc;
	updatedBy: string;
}

export const columns: ColumnDef<FirestoreLog>[] = [
	{
		id: 'updatedAt',
		header: 'Time',
		cell: ({ row }) => {
			return new Date(row.original.updatedAt).toLocaleString();
		},
	},
	{
		id: 'updatedBy',
		header: 'User',
		cell: ({ row }) =>
			renderComponent(DataTableUserCell, {
				user: row.original.updatedBy,
			}),
	},
	{
		id: 'actions',
		header: 'Actions',
		cell: ({ row }) =>
			renderComponent(DataTableDialog, {
				beforeData: row.original.beforeData,
				afterData: row.original.afterData,
			}),
	},
];
