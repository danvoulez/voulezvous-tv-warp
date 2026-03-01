// AUTO-GENERATED FILE - DO NOT EDIT

export type SessionMode =
  | "broadcast"
  | "party"
  | "sniffers"
  | "random"
  | "private_call"
  | "meeting"
  | "live_public"
  | "mirror";

export type SessionState = "creating" | "active" | "ending" | "ended" | "failed";

export type EventType =
  | "presence.update"
  | "session.created"
  | "match.found"
  | "chat.message"
  | "consent.request"
  | "consent.response";
