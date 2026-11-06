import { z } from "zod";

export const preferenceKeys = ["food_spicy", "food_mild", "food_light", "food_local", "food_seafood", "avoid_seafood", "vegetarian", "vegan", "allergy_peanut", "allergy_seafood", "allergy_milk", "allergy_egg", "avoid_gluten", "beach", "photos", "quiet", "avoid_crowds", "avoid_walking", "pace_gentle", "pace_active", "stay_budget", "stay_premium", "taxi", "motorbike", "walk", "usually_children", "usually_seniors"] as const;
export const preferenceKeySchema = z.enum(preferenceKeys);
export type PreferenceKey = z.infer<typeof preferenceKeySchema>;
export const preferenceLabels: Record<PreferenceKey, string> = {
  food_spicy: "Thích ăn cay", food_mild: "Không ăn cay", food_light: "Thích món thanh đạm", food_local: "Thích ẩm thực địa phương", food_seafood: "Thích hải sản", avoid_seafood: "Không ăn hải sản", vegetarian: "Ăn chay", vegan: "Ăn thuần chay", allergy_peanut: "Dị ứng đậu phộng", allergy_seafood: "Dị ứng hải sản", allergy_milk: "Dị ứng sữa", allergy_egg: "Dị ứng trứng", avoid_gluten: "Tránh gluten", beach: "Thích biển", photos: "Thích chụp ảnh", quiet: "Thích nơi yên tĩnh", avoid_crowds: "Tránh nơi đông khách", avoid_walking: "Hạn chế đi bộ", pace_gentle: "Thích lịch nhẹ", pace_active: "Thích lịch năng động", stay_budget: "Ưu tiên lưu trú tiết kiệm", stay_premium: "Ưu tiên lưu trú cao cấp", taxi: "Ưu tiên taxi", motorbike: "Ưu tiên xe máy", walk: "Ưu tiên đi bộ", usually_children: "Thường đi cùng trẻ em", usually_seniors: "Thường đi cùng người lớn tuổi",
};
export const intentKinds = ["SEARCH", "ITINERARY", "MODIFY_ITINERARY", "COMPARE", "WEATHER", "EVENT", "PLACE_INFO", "FOLLOW_UP", "OFF_TOPIC", "PROFILE", "BUDGET", "DIRECTIONS", "FEEDBACK"] as const;
export const confirmedContextSchema = z.object({
  days: z.number().int().min(1).max(100).nullable(), nights: z.number().int().min(0).max(99).nullable(),
  guests: z.number().int().min(1).max(100).nullable(), budget: z.number().positive().max(1e9).nullable(),
  reserve: z.number().min(0).max(1e9).nullable().default(null), hasLodging: z.boolean().nullable().default(null), dayUse: z.boolean().nullable().default(null),
  budgetScope: z.enum(["total", "perPerson", "perDay", "perRoomPerNight"]).nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(), district: z.string().max(100).nullable(),
  transport: z.enum(["car", "motorbike", "taxi", "walk", "bus"]).nullable(),
  arrivalTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullable(), departureTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullable(),
  dietaryRestrictions: z.array(preferenceKeySchema).max(30), preferences: z.array(preferenceKeySchema).max(30), excludedPlaces: z.array(z.string().max(100)).max(60),
}).strict();
export type ConfirmedContext = z.infer<typeof confirmedContextSchema>;
export const emptyContext = (): ConfirmedContext => ({ days: null, nights: null, guests: null, budget: null, reserve: null, hasLodging: null, dayUse: null, budgetScope: null, startDate: null, district: null, transport: null, arrivalTime: null, departureTime: null, dietaryRestrictions: [], preferences: [], excludedPlaces: [] });
export const dialogueSchema = z.object({ context: confirmedContextSchema, needs: z.array(z.enum(["food", "sight", "stay"])).max(3), pendingQuestions: z.array(z.string().max(250)).max(3), profilePending: z.array(preferenceKeySchema).max(30), sessionPreferences: z.array(preferenceKeySchema).max(30).default([]), ignoreSaved: z.boolean().default(false) }).strict();
export type Dialogue = z.infer<typeof dialogueSchema>;
export interface ProfileSuggestion { key: PreferenceKey; label: string; sensitive: boolean }
export interface ChatSource { url: string; label: string; checkedOn: string; scope: string }
export interface ResponseMetadata {
  intent: typeof intentKinds[number]; secondaryIntents: string[]; needsClarification: boolean; questions: string[];
  confirmedContext: ConfirmedContext; profileSuggestions: ProfileSuggestion[]; sources: ChatSource[]; warnings: string[];
}
