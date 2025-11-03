Edamam API proxy

This backend exposes a POST /generateMeal endpoint that proxies requests to the Edamam Recipe Search API.

Required environment variables (set in .env at the backend root):

- EDAMAM_APP_ID - your Edamam app id
- EDAMAM_APP_KEY - your Edamam app key

How to call:

- POST /generateMeal
  - Headers: Authorization: Bearer <jwt-token>
  - Body (json): { dietPreference: string, calories: number | undefined, totalMeals: number, healthSpec: string | undefined }

Response:
- 200: { hits: [ ... ] }  // array of recipe hits from Edamam
- 500: { message: 'Server misconfiguration: Edamam keys missing' } or other error

Notes:
- This proxy prevents browser CORS issues and keeps your Edamam keys on the server.
- If you don't want auth on this endpoint, remove `verifyToken` from the route in index.js.
