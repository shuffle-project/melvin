find '/usr/share/nginx/html' -name '*.js' -exec sed -i -e 's,BACKEND_BASE_URL,'"$BACKEND_BASE_URL"',g' {} \;
find '/usr/share/nginx/html' -name '*.js' -exec sed -i -e 's,FRONTEND_BASE_URL,'"$FRONTEND_BASE_URL"',g' {} \;
nginx -g "daemon off;"