export type Step = "welcome" | "record" | "mint" | "email" | "complete";

export interface Message {
  text: string;
  sender: "agent" | "user";
}
