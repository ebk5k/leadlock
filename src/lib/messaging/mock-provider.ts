import type { FollowUpEvent } from "@/types/domain";

export interface MessagingProvider {
  sendMessage(input: {
    leadName: string;
    channel: FollowUpEvent["channel"];
    content: string;
  }): Promise<{ status: FollowUpEvent["status"] }>;
}

export const mockMessagingProvider: MessagingProvider = {
  async sendMessage() {
    return { status: "sent" };
  }
};
