 #!/bin/bash

set -e; # Exit on error

get_env_variable () {
    local variable_name="$1"
    local language="$2"

    local env_var_default="MELVIN_${variable_name^^}_URL"
    local env_var_language="MELVIN_${language^^}_${variable_name^^}_URL"

    if [[ -n "${!env_var_language:-}" ]]; then
        echo "${!env_var_language:-}"
    elif [[ -n "${!env_var_default:-}" ]]; then
        echo "${!env_var_default:-}"
    else 
        echo "Warning: Environment variable '$env_var_default' is not set." >&2
        echo ""
    fi
}

get_base_url () {
    local base_type="$1"
    local env_var="MELVIN_${base_type^^}_BASE_URL"
    local deprecated_var="${base_type^^}_BASE_URL"

    if [[ -n "${!env_var:-}" ]]; then
        echo "${!env_var:-}"
    elif [[ -n "${!deprecated_var:-}" ]]; then
        echo "${!deprecated_var:-}"
        echo "Warning: '$deprecated_var' is deprecated! Please use '$env_var' instead." >&2
    else
        echo "ERROR: Required environment variable '$env_var' is not set!" >&2
        exit 1 # Exit with error
    fi
}

backend_base_url="$(get_base_url "backend")" 
frontend_base_url="$(get_base_url "frontend")"



cat <<EOF > /usr/share/nginx/html/en-US/assets/env.js
window.env = {
    MELVIN_IMPRINT_URL: "$(get_env_variable "imprint" "en")",
    MELVIN_PRIVACY_URL: "$(get_env_variable "privacy" "en")",
    MELVIN_SIGN_LANGUAGE_URL: "$(get_env_variable "sign_language" "en")",
    MELVIN_EASY_LANGUAGE_URL: "$(get_env_variable "easy_language" "en")
    MELVIN_ACCESSIBILITY_STATEMENT_URL: "$(get_env_variable "accessibility_statement" "en")",
    MELVIN_BACKEND_BASE_URL: "$backend_base_url",
    MELVIN_FRONTEND_BASE_URL: "$frontend_base_url",
    MELVIN_DISABLE_LANDING_PAGE: "$MELVIN_DISABLE_LANDING_PAGE",
    MELVIN_DISABLE_TUTORIAL_VIDEOS: "$MELVIN_DISABLE_TUTORIAL_VIDEOS"
    MELVIN_DISABLE_INSTALLATION_PAGE: "$MELVIN_DISABLE_INSTALLATION_PAGE",
    MELVIN_CONTACT_EMAIL: "$MELVIN_CONTACT_EMAIL"
};
EOF

cat <<EOF > /usr/share/nginx/html/de-DE/assets/env.js
window.env = {
    MELVIN_IMPRINT_URL: "$(get_env_variable "imprint" "de")",
    MELVIN_PRIVACY_URL: "$(get_env_variable "privacy" "de")",
    MELVIN_SIGN_LANGUAGE_URL: "$(get_env_variable "sign_language" "de")",
    MELVIN_EASY_LANGUAGE_URL: "$(get_env_variable "easy_language" "de")
    MELVIN_ACCESSIBILITY_STATEMENT_URL: "$(get_env_variable "accessibility_statement" "de")",
    MELVIN_BACKEND_BASE_URL: "$backend_base_url",
    MELVIN_FRONTEND_BASE_URL: "$frontend_base_url",
    MELVIN_DISABLE_LANDING_PAGE: "$MELVIN_DISABLE_LANDING_PAGE",
    MELVIN_DISABLE_TUTORIAL_VIDEOS: "$MELVIN_DISABLE_TUTORIAL_VIDEOS"
    MELVIN_DISABLE_INSTALLATION_PAGE: "$MELVIN_DISABLE_INSTALLATION_PAGE",
    MELVIN_CONTACT_EMAIL: "$MELVIN_CONTACT_EMAIL"
};
EOF

exec nginx -g "daemon off;"