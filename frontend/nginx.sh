 #!/bin/bash

find '/usr/share/nginx/html' -name '*.js' -exec sed -i -e 's,BACKEND_BASE_URL,'"$BACKEND_BASE_URL"',g' {} \;
find '/usr/share/nginx/html' -name '*.js' -exec sed -i -e 's,FRONTEND_BASE_URL,'"$FRONTEND_BASE_URL"',g' {} \;

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

cat <<EOF > /usr/share/nginx/html/en-US/assets/env.js
window.env = {
    MELVIN_IMPRINT_URL: "$(get_env_variable "imprint" "en")",
    MELVIN_PRIVACY_URL: "$(get_env_variable "privacy" "en")",
};
EOF

cat <<EOF > /usr/share/nginx/html/de-DE/assets/env.js
window.env = {
    MELVIN_IMPRINT_URL: "$(get_env_variable "imprint" "de")",
    MELVIN_PRIVACY_URL: "$(get_env_variable "privacy" "de")",
};
EOF

exec nginx -g "daemon off;"