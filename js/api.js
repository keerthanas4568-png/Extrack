// Backend Base URL
const BASE_URL = "http://127.0.0.1:5000";

// Get JWT Token
function getToken() {
    return localStorage.getItem("access_token");
}

// Common headers for protected APIs
function getHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
    };
}