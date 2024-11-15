import { db, type UserDoc } from '$lib';
import { renderComponent } from '$lib/components/ui/data-table';
import { Switch } from '$lib/components/ui/switch';
import type { ColumnDef } from '@tanstack/table-core';
import { doc, setDoc } from 'firebase/firestore';
import DataTableActions from './DataTableActions.svelte';
import DataTableSortButton from './DataTableSortButton.svelte';
import TShirtCell from './TShirtCell.svelte';
import EventsCell from './EventsCell.svelte';

export const columns: ColumnDef<UserDoc>[] = [
	{
		accessorKey: 'washingtonId',
		header: 'Washington ID',
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
					await setDoc(
						doc(db, 'users', row.original.email),
						{
							random: e,
							lastUpdatedBy: row.original.email ?? '',
						},
						{ merge: true },
					);
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
