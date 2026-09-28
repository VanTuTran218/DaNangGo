import type { User } from '@/types/user';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

let mockSessionUser: User | null = null;

export async function getSession(): Promise<{ user: User | null }> {
  await delay(800);
  return { user: mockSessionUser };
}

export async function logout(): Promise<{ success: boolean }> {
  await delay(400);
  mockSessionUser = null;
  return { success: true };
}

export function _setMockUser(user: User | null) {
  mockSessionUser = user;
}

export function _getMockUser() {
  return mockSessionUser;
}
