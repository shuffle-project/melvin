find '/usr/share/nginx/html' -name '*.js' -exec sed -i -e 's,BACKEND_BASE_URL,'"$BACKEND_BASE_URL"',g' {} \;
find '/usr/share/nginx/html' -name '*.js' -exec sed -i -e 's,FRONTEND_BASE_URL,'"$FRONTEND_BASE_URL"',g' {} \;

cat <<EOF > /usr/share/nginx/html/assets/env.js
window.env = {
    MELVIN_IMPRINT_URL: "${MELVIN_IMPRINT_URL}",
    MELVIN_PRIVACY_URL: "${MELVIN_PRIVACY_URL}",
    MELVIN_DE_IMPRINT_URL: "${MELVIN_DE_IMPRINT_URL}",
    MELVIN_DE_PRIVACY_URL: "${MELVIN_DE_PRIVACY_URL}",
};
EOF

exec nginx -g "daemon off;"