import { defineUserSignupFields } from "wasp/server/auth";

interface GoogleProfile {
    email?: string;
    given_name?: string;
    family_name?: string;
}

interface GoogleAuthData {
    profile?: GoogleProfile;
}

function validateEmailForGoogle(data: GoogleAuthData): string {
    if (!data.profile?.email) {
        throw new Error("Email is required from Google profile");
    }
    return data.profile.email;
}

function validateFirstNameForGoogle(data: GoogleAuthData): string | undefined {
    const firstName = data.profile?.given_name;
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

function validateLastNameForGoogle(data: GoogleAuthData): string | undefined {
    const lastName = data.profile?.family_name;
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

function validateUsernameForGoogle(data: GoogleAuthData): string {
    if (!data.profile?.email) {
        throw new Error("Email is required from Google profile for username");
    }
    return data.profile.email;
}

export const userSignupFields = defineUserSignupFields({
    email: validateEmailForGoogle,
    firstName: validateFirstNameForGoogle,
    lastName: validateLastNameForGoogle,
    username: validateUsernameForGoogle,
});

export function config() {
    return {
        scopes: ["profile", "email"],
    };
}
