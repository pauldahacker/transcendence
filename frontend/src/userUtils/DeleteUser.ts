export async function deleteUser(userId: number) {
	const token = localStorage.getItem("auth_token");
	if (!token) throw new Error("No auth token found");
  
	const res = await fetch(`/api/users/${userId}`, {
	  method: "DELETE",
	  headers: {
		"Authorization": `Bearer ${token}`,
		
	  },
	});
  
	if (!res.ok) {
	  const errText = await res.text();
	  throw new Error(`Error deleting user (${res.status}): ${errText}`);
	}
  
	const data = await res.json();
	console.log(data.message);
	return data;
  }