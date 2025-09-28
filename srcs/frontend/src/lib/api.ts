/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   api.ts                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/09/28 18:26:38 by rzhdanov          #+#    #+#             */
/*   Updated: 2025/09/29 00:38:47 by rzhdanov         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

export const API_BASE = "https://localhost"; // dev gateway

export function getAccessToken(): string | null {
  return localStorage.getItem("accessToken");
}

export function authHeaders(): Record<string, string> {
  const t = getAccessToken();
  return t ? { authorization: `Bearer ${t}` } : {};
}

export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`POST ${path} failed: ${resp.status} ${text}`);
  }
  return resp.json() as Promise<T>;
}
