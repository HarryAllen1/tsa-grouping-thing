import { renderComponent } from '$lib/components/ui/data-table';
import type { EventDoc } from '$lib/types';
import type { ColumnDef } from '@tanstack/table-core';
import DataTableUserCell from './DataTableUserCell.svelte';
import DataTableDialog from './DataTableDialog.svelte';
import type { Timestamp } from 'firebase/firestore';

export interface FirestoreLog {
	updatedAt: Timestamp;
	updatedBy: string;
	functionName: string;
	data: Record<string, boolean | number | string | null>;
}

export const columns: ColumnDef<FirestoreLog>[] = [
	{
		id: 'updatedAt',
		header: 'Time',
		cell: ({ row }) => {
			return row.original.updatedAt.toDate().toLocaleString();
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
		id: 'function',
		header: 'Function',
		cell: ({ row }) => row.original.functionName,
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
