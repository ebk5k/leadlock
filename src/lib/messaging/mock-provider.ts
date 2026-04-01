import type { FollowUpEvent, ResolvedBusinessProviderConfig } from "@/types/domain";

export interface MessagingProvider {
  sendMessage(input: {
    leadName: string;
    channel: FollowUpEvent["channel"];
    content: string;
  }, config: ResolvedBusinessProviderConfig): Promise<{ status: FollowUpEvent["status"] }>;
}

export const mockMessagingProvider: MessagingProvider = {
  async sendMessage() {
    return { status: "sent" };
  }
};
