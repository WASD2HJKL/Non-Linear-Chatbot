import { defineUserSignupFields } from "wasp/server/auth";

function validateEmailForUser(data: any): string {
    return data.email;
}

function validateFirstName(data: any): string | undefined {
    const firstName = data.firstName;
    if (!firstName || firstName.trim() === "") {
        return undefined;
    }
    if (typeof firstName !== "string") {
        throw new Error("First name must be a string");
    }
    if (firstName.length > 50) {
        throw new Error("First name must be 50 characters or less");
    }
    return firstName.trim();
}

function validateLastName(data: any): string | undefined {
    const lastName = data.lastName;
    if (!lastName || lastName.trim() === "") {
        return undefined;
    }
    if (typeof lastName !== "string") {
        throw new Error("Last name must be a string");
    }
    if (lastName.length > 50) {
        throw new Error("Last name must be 50 characters or less");
    }
    return lastName.trim();
}

function validateUsername(data: any): string | undefined {
    const username = data.username;
    if (!username || username.trim() === "") {
        return undefined;
    }
    if (typeof username !== "string") {
        throw new Error("Username must be a string");
    }
    if (username.length < 3) {
        throw new Error("Username must be at least 3 characters");
    }
    if (username.length > 20) {
        throw new Error("Username must be 20 characters or less");
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new Error("Username can only contain letters, numbers, and underscores");
    }
    return username.trim();
}

export const userSignupFields = defineUserSignupFields({
    email: validateEmailForUser,
    firstName: validateFirstName,
    lastName: validateLastName,
    username: validateUsername,
});
