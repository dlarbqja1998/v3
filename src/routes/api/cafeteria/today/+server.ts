import { json } from '@sveltejs/kit';
import { todayCafeteria } from '$lib/domain/seed';

export function GET() {
	return json({ cafeteria: todayCafeteria });
}
