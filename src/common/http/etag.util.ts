import { createHash } from 'crypto';
import {stringify} from "@common/services/utils";

export function computeETag(body: unknown): string {
    const json = stringify(body);
    const hash = createHash('sha1').update(json ?? '').digest('hex');
    return `W/"${hash}"`;
}