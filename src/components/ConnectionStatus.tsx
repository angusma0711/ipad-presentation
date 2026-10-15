import type { Connection } from '../types/presentation';
export function ConnectionStatus({ status }: {
    status: Connection;
}) { return <span className={`connection ${status === 'Connected' ? 'connected' : ''}`} role="status"><span aria-hidden="true">●</span> {status}</span>; }
