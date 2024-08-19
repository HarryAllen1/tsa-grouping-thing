import { Logging } from '@google-cloud/logging';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProtoPath, load } from 'google-proto-files';

export const GET: RequestHandler = async () => {
	const logging = new Logging({
		projectId: 'tsa-grouping-thing',
	});

	const [logs] = await logging.getEntries({ orderBy: 'timestamp desc' });
	const parsedLogs = [];

	for (const log of logs) {
		const payload = (log.metadata as { payload: string }).payload;
		if (
			payload === 'protoPayload' &&
			Buffer.isBuffer(log.metadata[payload]?.value)
		) {
			const protopath = getProtoPath('../google/cloud/audit/audit_log.proto');
			const root = await load(protopath);
			const type = root.lookupType('google.cloud.audit.AuditLog');
			const value = type.decode(log.metadata[payload]?.value).toJSON();
			parsedLogs.push(value);
		}
	}

	return json({
		logs: parsedLogs,
	});
};
