import { renderComponent } from '$lib/components/ui/data-table';
import type { ColumnDef } from '@tanstack/table-core';
import type { Timestamp } from 'firebase/firestore';
import DataTableDialog from './DataTableDialog.svelte';
import DataTableUserCell from './DataTableUserCell.svelte';

export interface FirestoreLog {
	updatedAt: Timestamp;
	updatedBy: string;
	function: string;
	data: Record<string, boolean | number | string | null>;
}

export const columns: ColumnDef<FirestoreLog>[] = [
	{
		id: 'updatedAt',
		header: 'Time',
		cell: ({ row }) => row.original.updatedAt.toDate().toLocaleString(),
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
		id: 'function',
		header: 'Function',
		cell: ({ row }) => row.original.function,
	},
	{
		id: 'actions',
		header: 'Actions',
		cell: ({ row }) =>
			renderComponent(DataTableDialog, {
				data: row.original.data,
			}),
	},
];
