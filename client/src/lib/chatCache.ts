import type { QueryClient } from "@tanstack/react-query";
import type { MessagePublic } from "@therapist/shared";

export function appendMessageToCache(
  queryClient: QueryClient,
  conversationId: string,
  message: MessagePublic
): void {
  queryClient.setQueryData<MessagePublic[]>(["messages", conversationId], (old) => {
    if (!old) return [message];
    if (old.some((m) => m.id === message.id)) return old;
    return [...old, message];
  });
  queryClient.invalidateQueries({ queryKey: ["conversations"] });
}
