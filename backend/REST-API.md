# Auth / Login

POST /auth/login
POST /auth/refresh-token
POST /auth/register
POST /auth/verify-email
POST /auth/guest { inviteLink }

# Project

GET /projects
POST /projects
GET /projects/:projectId
PATCH /projects/:projectId
DELETE /projects/:projectId

POST /projects/join { inviteLink }

# CaptionList

POST /projects/:projectId/caption-lists
GET /projects/:projectId/caption-lists

GET /caption-lists/:captionListId
PATCH /caption-lists/:captionListId
DELETE /caption-lists/:captionListId

# Captions

GET /caption-lists/:captionListId/captions
POST /caption-lists/:captionListId/captions

PATCH /caption-lists/:captionListId/captions/:captionId
DELETE /caption-lists/:captionListId/captions/:captionId
