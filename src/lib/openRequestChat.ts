import type { NavigateFunction } from "react-router-dom";

export function openRequestChat(navigate: NavigateFunction, requestId: string) {
  navigate(`/chat/${requestId}`);
}
