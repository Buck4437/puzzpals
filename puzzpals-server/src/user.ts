export function randomUserID(token: string): string {
  return 'user_' + token + '_' + Math.random().toString(18).substring(2, 10);
}