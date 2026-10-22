import { robotsTxt } from '../utils/robots';
const headers = { 'Content-Type': 'text/plain; charset=utf-8' };
export const GET = () => new Response(robotsTxt(), { headers });
