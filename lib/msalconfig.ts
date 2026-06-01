// import { PublicClientApplication, Configuration } from "@azure/msal-browser";

// export const msalConfig: Configuration = {
//   auth: {
//     clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || "",
//     authority: "https://login.microsoftonline.com/common",
//     redirectUri: process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI || "",
//   },
//   cache: {
//     cacheLocation: "localStorage",
//     storeAuthStateInCookie: false,
//   },
// };

// export const loginRequest = {
//   scopes: ["openid", "profile", "email", "User.Read"],
// };

// export const msalInstance = new PublicClientApplication(msalConfig);


import { PublicClientApplication, Configuration, EventType } from "@azure/msal-browser";

// Dynamic redirect URI based on environment
const getRedirectUri = () => {
  if (typeof window !== "undefined") {
    // If we're running locally (localhost or 127.0.0.1), use localhost
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return `${window.location.protocol}//${window.location.host}`;
    }
  }
  // Otherwise use the environment variable (production)
  return process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI || "";
};

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || "",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: getRedirectUri(),
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["openid", "profile", "email", "User.Read"],
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL instance
if (typeof window !== "undefined") {
  msalInstance.initialize().then(() => {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
    }

    msalInstance.addEventCallback((event) => {
      if (
        event.eventType === EventType.LOGIN_SUCCESS &&
        event.payload &&
        "account" in event.payload &&
        event.payload.account
      ) {
        const account = event.payload.account;
        msalInstance.setActiveAccount(account);
      }
    });
  });
}
