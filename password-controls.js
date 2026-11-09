"use strict";

/*
  IEGH DocuHub Password Controls

  - Password visibility
  - Voluntary account password changes
  - Mandatory first-login password changes
*/

(() => {
  const MIN_LENGTH = 8;
  const MAX_LENGTH = 128;

  const SUPABASE_URL =
    "https://wuhshzfxdhsxpehbhuvn.supabase.co";

  const FIRST_LOGIN_ENDPOINT =
    SUPABASE_URL +
    "/functions/v1/complete-first-login";

  function makeVisibilityCheckbox(input) {
    if (!input || input.dataset.visibilityAdded) return;

    input.dataset.visibilityAdded = "true";

    const wrapper = document.createElement("label");

    wrapper.style.cssText = [
      "display:flex",
      "align-items:center",
      "gap:10px",
      "margin:10px 0 16px",
      "cursor:pointer"
    ].join(";");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    checkbox.style.cssText = [
      "width:22px",
      "height:22px",
      "min-height:22px",
      "flex-shrink:0",
      "margin:0"
    ].join(";");

    const text = document.createElement("span");
    text.textContent = "Show Password";

    checkbox.addEventListener("change", () => {
      input.type = checkbox.checked
        ? "text"
        : "password";
    });

    wrapper.append(checkbox, text);
    input.insertAdjacentElement("afterend", wrapper);
  }

  function validatePassword(password) {
    if (
      password.length < MIN_LENGTH ||
      password.length > MAX_LENGTH
    ) {
      return "Password must be 8 to 128 characters.";
    }

    if (!/[A-Za-z]/.test(password)) {
      return "Password must include at least one letter.";
    }

    if (!/[0-9]/.test(password)) {
      return "Password must include at least one number.";
    }

    return null;
  }

  function getClient() {
    const client = window.supabaseClientForPasswords;

    if (!client) {
      throw new Error("Authentication is unavailable.");
    }

    return client;
  }

  async function getAuthenticatedSession() {
    const client = getClient();

    const { data, error } =
      await client.auth.getSession();

    if (error || !data.session) {
      throw new Error(
        "Please sign in again before changing your password."
      );
    }

    return {
      client,
      session: data.session
    };
  }

  function addPasswordChangeForm() {
    const accountPage =
      document.getElementById("accountPage");

    if (!accountPage) return;

    const form = document.createElement("form");
    form.id = "changePasswordForm";

    form.innerHTML = `
      <div class="account-details">
        <h3>Change My Password</h3>

        <p class="muted">
          Use 8 to 128 characters, including
          at least one letter and one number.
        </p>

        <label for="accountNewPassword">
          New Password
        </label>
        <input
          id="accountNewPassword"
          type="password"
          autocomplete="new-password"
          minlength="8"
          maxlength="128"
          required
        >

        <label for="accountConfirmPassword">
          Confirm New Password
        </label>
        <input
          id="accountConfirmPassword"
          type="password"
          autocomplete="new-password"
          minlength="8"
          maxlength="128"
          required
        >

        <div class="actions">
          <button
            type="submit"
            id="changePasswordButton">
            Update Password
          </button>
        </div>

        <p
          id="passwordChangeStatus"
          class="muted"
          role="status"
          aria-live="polite">
        </p>
      </div>
    `;

    const existingActions =
      accountPage.querySelector(".actions");

    if (existingActions) {
      accountPage.insertBefore(
        form,
        existingActions
      );
    } else {
      accountPage.append(form);
    }

    const newPassword =
      document.getElementById("accountNewPassword");

    const confirmPassword =
      document.getElementById("accountConfirmPassword");

    const status =
      document.getElementById("passwordChangeStatus");

    const button =
      document.getElementById("changePasswordButton");

    makeVisibilityCheckbox(newPassword);
    makeVisibilityCheckbox(confirmPassword);

    form.addEventListener("submit", async event => {
      event.preventDefault();

      const password = newPassword.value;
      const confirmation = confirmPassword.value;

      const validationError =
        validatePassword(password);

      if (validationError) {
        status.textContent = validationError;
        status.className = "bad";
        return;
      }

      if (password !== confirmation) {
        status.textContent = "Passwords do not match.";
        status.className = "bad";
        return;
      }

      if (!navigator.onLine) {
        status.textContent =
          "Connect to the internet to change your password.";
        status.className = "bad";
        return;
      }

      button.disabled = true;
      button.textContent = "Updating...";
      status.textContent = "Updating your password...";
      status.className = "muted";

      try {
        const { client } =
          await getAuthenticatedSession();

        const { error } =
          await client.auth.updateUser({
            password
          });

        if (error) throw error;

        form.reset();

        status.textContent =
          "Password updated successfully!";
        status.className = "good";

      } catch (error) {
        status.textContent =
          "Password change failed: " +
          error.message;
        status.className = "bad";

      } finally {
        button.disabled = false;
        button.textContent = "Update Password";
      }
    });
  }

  function addFirstLoginForm() {
    const loginPanel =
      document.getElementById("loginPanel");

    if (!loginPanel) return;

    const panel = document.createElement("section");

    panel.id = "firstLoginPasswordPanel";
    panel.className = "panel hidden";

    panel.innerHTML = `
      <h2>Set Your Personal Password</h2>

      <p class="muted">
        Welcome to IEGH DocuHub.
        Before accessing the investigation workspace,
        you must replace your temporary password.
      </p>

      <form id="firstLoginPasswordForm">

        <label for="firstLoginCurrentPassword">
          Temporary Password
        </label>
        <input
          id="firstLoginCurrentPassword"
          type="password"
          autocomplete="current-password"
          required
        >

        <label for="firstLoginNewPassword">
          New Password
        </label>
        <input
          id="firstLoginNewPassword"
          type="password"
          autocomplete="new-password"
          minlength="8"
          maxlength="128"
          required
        >

        <label for="firstLoginConfirmPassword">
          Confirm New Password
        </label>
        <input
          id="firstLoginConfirmPassword"
          type="password"
          autocomplete="new-password"
          minlength="8"
          maxlength="128"
          required
        >

        <p class="muted">
          Your new password must contain 8 to 128
          characters, including at least one letter
          and one number.
        </p>

        <div class="actions">
          <button
            id="firstLoginSubmitButton"
            type="submit">
            Save New Password
          </button>
        </div>

        <p
          id="firstLoginPasswordStatus"
          class="muted"
          role="status"
          aria-live="polite">
        </p>

      </form>

      <div class="actions">
        <button
          id="firstLoginSignOut"
          type="button"
          class="secondary">
          Sign Out
        </button>
      </div>
    `;

    loginPanel.insertAdjacentElement(
      "afterend",
      panel
    );

    const form =
      document.getElementById(
        "firstLoginPasswordForm"
      );

    const currentPassword =
      document.getElementById(
        "firstLoginCurrentPassword"
      );

    const newPassword =
      document.getElementById(
        "firstLoginNewPassword"
      );

    const confirmPassword =
      document.getElementById(
        "firstLoginConfirmPassword"
      );

    const status =
      document.getElementById(
        "firstLoginPasswordStatus"
      );

    const button =
      document.getElementById(
        "firstLoginSubmitButton"
      );

    makeVisibilityCheckbox(currentPassword);
    makeVisibilityCheckbox(newPassword);
    makeVisibilityCheckbox(confirmPassword);

    window.IEGHPasswordControls = {
      showFirstLogin() {
        document.getElementById(
          "loginPanel"
        ).classList.add("hidden");

        document.getElementById(
          "navigation"
        ).classList.add("hidden");

        document.getElementById(
          "mainMenu"
        ).classList.add("hidden");

        document.querySelectorAll(
          ".page"
        ).forEach(page => {
          page.classList.add("hidden");
        });

        panel.classList.remove("hidden");
      },

      hideFirstLogin() {
        panel.classList.add("hidden");
        form.reset();
        status.textContent = "";
        status.className = "muted";
      }
    };

    form.addEventListener("submit", async event => {
      event.preventDefault();

      const current = currentPassword.value;
      const next = newPassword.value;
      const confirmation = confirmPassword.value;

      const validationError =
        validatePassword(next);

      if (validationError) {
        status.textContent = validationError;
        status.className = "bad";
        return;
      }

      if (next !== confirmation) {
        status.textContent =
          "New passwords do not match.";
        status.className = "bad";
        return;
      }

      if (current === next) {
        status.textContent =
          "Choose a password different from your temporary password.";
        status.className = "bad";
        return;
      }

      if (!navigator.onLine) {
        status.textContent =
          "An internet connection is required.";
        status.className = "bad";
        return;
      }

      button.disabled = true;
      button.textContent = "Saving...";
      status.textContent =
        "Updating your password...";
      status.className = "muted";

      try {
        const { client, session } =
          await getAuthenticatedSession();

        const response = await fetch(
          FIRST_LOGIN_ENDPOINT,
          {
            method: "POST",
            mode: "cors",
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
              "Authorization":
                "Bearer " + session.access_token
            },
            body: JSON.stringify({
              current_password: current,
              new_password: next
            })
          }
        );

        const result = await response.json();

        if (!response.ok || result.success !== true) {
          throw new Error(
            result.error ||
            "Unable to complete password setup."
          );
        }

        form.reset();

        status.textContent =
          "Password updated successfully. Opening DocuHub...";
        status.className = "good";

        /*
          Refresh the authenticated session and
          return to the normal DocuHub login flow.
        */
        await client.auth.signOut();

        window.location.reload();

      } catch (error) {
        status.textContent =
          "Password change failed: " +
          error.message;
        status.className = "bad";

      } finally {
        button.disabled = false;
        button.textContent =
          "Save New Password";
      }
    });

    document.getElementById(
      "firstLoginSignOut"
    ).addEventListener("click", async () => {
      try {
        const client = getClient();
        await client.auth.signOut();
      } finally {
        window.location.reload();
      }
    });
  }

  function initialize() {
    makeVisibilityCheckbox(
      document.getElementById("password")
    );

    makeVisibilityCheckbox(
      document.getElementById("newPassword")
    );

    addPasswordChangeForm();
    addFirstLoginForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );
  } else {
    initialize();
  }
})();
