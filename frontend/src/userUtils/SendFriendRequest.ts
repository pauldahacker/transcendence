import { getUserIdFromToken } from "@/userUtils/TokenUtils"


export async function sendFriendRequest(userId: number): Promise<{ message: string }> {
    const token = localStorage.getItem("auth_token");
    if (!token) throw new Error("Not logged in");

    const res = await fetch(`/api/users/${userId}/friend-request`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({}),  // send empty JSON
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to send friend request: ${res.status} ${errText}`);
    }

    return await res.json();
}
