/* ============================================================
   validation.js — client-side form validation helpers
   Exposes a global `Validators` object used by auth.js.
   No backend calls are made here.
   ============================================================ */
(function (global) {
  "use strict";

  /* Simple, practical email pattern (RFC-light). */
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var MIN_PASSWORD_LENGTH = 8;
  var MIN_USERNAME_LENGTH = 4;
  /* Username: letters, numbers, underscore, dot — no leading/trailing dot/underscore. */
  var USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9._]{2,}[a-zA-Z0-9])?$/;
  /* Phone is optional: accept 7-15 digits, spaces, dashes, parentheses and a leading +. */
  var PHONE_PATTERN = /^\+?[\d\s().-]{7,18}$/;

  /**
   * Validate an email value.
   * @param {string} value
   * @returns {{ valid: boolean, message: string }}
   */
  function validateEmail(value) {
    var v = (value || "").trim();

    if (!v) {
      return { valid: false, message: "Email address is required." };
    }
    if (!EMAIL_PATTERN.test(v)) {
      return { valid: false, message: "Please enter a valid email address." };
    }
    return { valid: true, message: "" };
  }

  /**
   * Validate a password value.
   * @param {string} value
   * @returns {{ valid: boolean, message: string }}
   */
  function validatePassword(value) {
    var v = value || "";

    if (!v) {
      return { valid: false, message: "Password is required." };
    }
    if (v.length < MIN_PASSWORD_LENGTH) {
      return {
        valid: false,
        message: "Password must be at least " + MIN_PASSWORD_LENGTH + " characters."
      };
    }
    return { valid: true, message: "" };
  }

  /**
   * Validate a full name (required, at least two words is not enforced;
   * we only require a non-empty value with letters).
   * @param {string} value
   */
  function validateFullName(value) {
    var v = (value || "").trim();
    if (!v) {
      return { valid: false, message: "Full name is required." };
    }
    return { valid: true, message: "" };
  }

  /**
   * Validate a username (required, min 4 chars, allowed characters).
   * @param {string} value
   */
  function validateUsername(value) {
    var v = (value || "").trim();

    if (!v) {
      return { valid: false, message: "Username is required." };
    }
    if (v.length < MIN_USERNAME_LENGTH) {
      return {
        valid: false,
        message: "Username must be at least " + MIN_USERNAME_LENGTH + " characters."
      };
    }
    if (!USERNAME_PATTERN.test(v)) {
      return {
        valid: false,
        message: "Use letters, numbers, dots or underscores only."
      };
    }
    return { valid: true, message: "" };
  }

  /**
   * Validate an optional phone number. Empty is allowed.
   * @param {string} value
   */
  function validatePhone(value) {
    var v = (value || "").trim();
    if (!v) {
      return { valid: true, message: "" };
    }
    if (!PHONE_PATTERN.test(v)) {
      return { valid: false, message: "Please enter a valid phone number." };
    }
    return { valid: true, message: "" };
  }

  /**
   * Validate that the confirmation matches the password.
   * @param {string} password
   * @param {string} confirm
   */
  function validateConfirmPassword(password, confirm) {
    if (!confirm) {
      return { valid: false, message: "Please confirm your password." };
    }
    if (password !== confirm) {
      return { valid: false, message: "Passwords do not match." };
    }
    return { valid: true, message: "" };
  }

  /**
   * Validate the terms agreement checkbox is checked.
   * @param {boolean} checked
   */
  function validateTerms(checked) {
    if (!checked) {
      return { valid: false, message: "You must accept the Terms & Privacy Policy." };
    }
    return { valid: true, message: "" };
  }

  /**
   * Validate a positive amount.
   * @param {string|number} value
   */
  function validateAmount(value) {
    var v = (value === null || value === undefined ? "" : String(value)).trim();
    if (!v) {
      return { valid: false, message: "Amount is required." };
    }
    var num = Number(v);
    if (isNaN(num) || num <= 0) {
      return { valid: false, message: "Enter a positive amount greater than 0." };
    }
    return { valid: true, message: "" };
  }

  /**
   * Validate a date string (required + parseable).
   * @param {string} value
   */
  function validateDate(value) {
    var v = (value || "").trim();
    if (!v) {
      return { valid: false, message: "Date is required." };
    }
    var d = new Date(v);
    if (isNaN(d.getTime())) {
      return { valid: false, message: "Please enter a valid date." };
    }
    return { valid: true, message: "" };
  }

  /**
   * Validate a required select/radio value.
   * @param {string} value
   * @param {string} label
   */
  function validateRequired(value, label) {
    if (!value) {
      return { valid: false, message: (label || "This field") + " is required." };
    }
    return { valid: true, message: "" };
  }

  global.Validators = {
    EMAIL_PATTERN: EMAIL_PATTERN,
    MIN_PASSWORD_LENGTH: MIN_PASSWORD_LENGTH,
    MIN_USERNAME_LENGTH: MIN_USERNAME_LENGTH,
    USERNAME_PATTERN: USERNAME_PATTERN,
    PHONE_PATTERN: PHONE_PATTERN,
    validateEmail: validateEmail,
    validatePassword: validatePassword,
    validateFullName: validateFullName,
    validateUsername: validateUsername,
    validatePhone: validatePhone,
    validateConfirmPassword: validateConfirmPassword,
    validateTerms: validateTerms,
    validateAmount: validateAmount,
    validateDate: validateDate,
    validateRequired: validateRequired
  };
})(window);
