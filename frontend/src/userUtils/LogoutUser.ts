export function logout(){
    localStorage.removeItem("auth_token");
    alert("You've logged out succesfully");
    window.location.hash = "#/";
}