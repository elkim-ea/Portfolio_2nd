import {
  createDefaultUserProfile,
  getUserProfile,
  updateUserProfileItem,
} from "../repositories/userProfileRepository.js";
import type {
  UpdateUserProfileInput,
  UserProfile,
} from "../types/userProfile.js";

export async function getOrCreateUserProfile(
  userId: string
): Promise<UserProfile> {
  const existing = await getUserProfile(userId);

  if (existing) {
    return existing;
  }

  try {
    return await createDefaultUserProfile(userId);
  } catch (error) {
    const retry = await getUserProfile(userId);

    if (retry) {
      return retry;
    }

    throw error;
  }
}

export async function updateUserProfile(
  userId: string,
  input: UpdateUserProfileInput
): Promise<UserProfile> {
  return updateUserProfileItem(userId, input);
}