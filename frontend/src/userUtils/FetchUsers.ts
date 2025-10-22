export async function fetchUsers() {
    const token = localStorage.getItem("auth_token");
    if (!token) {
        throw new Error("No auth token found");
    }

    const res = await fetch("/api/users/", {
        headers: {
        "Authorization": `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        console.error(`Error fetching users: ${res.status}`);
        throw new Error(`Failed to fetch users (${res.status})`);
    }
    return await res.json();
}