"use strict";

/*
  IEGH DocuHub Password Controls
  Login visibility, account password changes,
  and investigator creation visibility.
*/

(() => {
  const MIN_LENGTH = 8;
  const MAX_LENGTH = 128;

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
      input.type = checkbox.checked ? "text" : "password";
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

  function addPasswordChangeForm() {
    const accountPage = document.getElementById("accountPage");
    if (!accountPage) return;

    const form = document.createElement("form");
    form.id = "changePasswordForm";

    form.innerHTML = `
      <div class="account-details">
        <h3>Change My Password</h3>

        <p class="muted">
          Use at least 8 characters, including
          one number.
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

    const existingActions = accountPage.querySelector(".actions");

    if (existingActions) {
      accountPage.insertBefore(form, existingActions);
    } else {
      accountPage.append(form);
    }

    const newPassword = document.getElementById(
      "accountNewPassword"
    );

    const confirmPassword = document.getElementById(
      "accountConfirmPassword"
    );

    makeVisibilityCheckbox(newPassword);
    makeVisibilityCheckbox(confirmPassword);

    const status = document.getElementById(
      "passwordChangeStatus"
    );

    const button = document.getElementById(
      "changePasswordButton"
    );

    form.addEventListener("submit", async event => {
      event.preventDefault();

      const password = newPassword.value;
      const confirmation = confirmPassword.value;

      const validationError = validatePassword(password);

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
        const client = window.supabaseClientForPasswords;

        if (!client) {
          throw new Error(
            "Authentication is unavailable."
          );
        }

        const { data: sessionData, error: sessionError } =
          await client.auth.getSession();

        if (
          sessionError ||
          !sessionData.session
        ) {
          throw new Error(
            "Please sign in again before changing your password."
          );
        }

        const { error } = await client.auth.updateUser({
          password
        });

        if (error) throw error;

        form.reset();

        status.textContent =
          "Password updated successfully!";
        status.className = "good";

      } catch (error) {
        status.textContent =
          "Password change failed: " + error.message;
        status.className = "bad";

      } finally {
        button.disabled = false;
        button.textContent = "Update Password";
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
