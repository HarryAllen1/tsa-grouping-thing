import { renderComponent } from '$lib/components/ui/data-table';
import { Switch } from '$lib/components/ui/switch';
import { db } from '$lib/firebase';
import type { UserDoc } from '$lib/types';
import type { ColumnDef } from '@tanstack/table-core';
import { doc, updateDoc } from 'firebase/firestore';
import DataTableActions from './DataTableActions.svelte';
import DataTableSortButton from './DataTableSortButton.svelte';
import EventsCell from './EventsCell.svelte';
import TShirtCell from './TShirtCell.svelte';

export const columns: ColumnDef<UserDoc>[] = [
	{
		accessorKey: 'washingtonId',
		header: ({ column }) =>
			renderComponent(DataTableSortButton, {
				text: 'Washington ID',
				onclick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
			}),
	},
	{
		accessorKey: 'name',
		header: ({ column }) =>
			renderComponent(DataTableSortButton, {
				text: 'Name',
				onclick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
			}),
	},
	{
		accessorKey: 'random',
		header: ({ column }) =>
			renderComponent(DataTableSortButton, {
				text: 'Switch',
				onclick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
			}),
		cell: ({ row }) =>
			renderComponent(Switch, {
				checked: row.original.random,
				onCheckedChange: async (e) => {
					await updateDoc(doc(db, 'users', row.original.email), {
						random: e,
						lastUpdatedBy: row.original.email ?? '',
					});
				},
			}),
	},
	{
		accessorKey: 'tShirtSize',
		header: 'T-Shirt Size',
		cell: ({ row }) =>
			renderComponent(TShirtCell, {
				user: row.original,
			}),
	},
	{
		accessorKey: 'events',
		header: 'Events',
		cell: ({ row }) =>
			renderComponent(EventsCell, {
				user: row.original,
			}),
	},
	{
		id: 'actions',
		cell: ({ row }) =>
			renderComponent(DataTableActions, {
				user: row.original,
			}),
	},
];
