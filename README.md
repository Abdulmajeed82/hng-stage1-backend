# HNG Stage 1 Backend - Profile Demographics API

[![Vercel](https://theregister.s3.amazonaws.com/theregister-production/uploads/2021/10/GettyImages-1276613989.jpg)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/hng-stage1-backend)

## Overview
This is a robust Express.js backend API for the HNG Stage 1 task. It creates and manages user profiles by integrating with external demographics APIs (Genderize.io, Agify.io, Nationalize.io) to predict gender, age, and nationality. Profiles are stored in MongoDB with full CRUD operations and advanced filtering.

**Key Features:**
- Idempotent profile creation (by lowercase name)
- Age group classification (child/teenager/adult/senior)
- Query filtering by gender, country_id, age_group
- UUID v7 for unique IDs
- CORS enabled for frontend integration
- Production-ready with helmet, dotenv
- Vercel deployment optimized

## Tech Stack
- **Runtime:** Node.js >= 20
- **Framework:** Express.js
- **Database:** MongoDB
- **Package Manager:** pnpm
- **External APIs:** Genderize, Agify, Nationalize
- **Security:** helmet, CORS
- **Deployment:** Vercel

## Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/yourusername/hng-stage1-backend.git
   cd hng-stage1-backend
   pnpm install
   ```

2. **Environment Setup**
   Create `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   PORT=3000
   ```

3. **Run Development Server**
   ```bash
   pnpm dev
   ```
   Production:
   ```bash
   pnpm start
   ```

Server runs on `http://localhost:3000`

## API Endpoints

### `POST /api/profiles`
**Create profile** (idempotent - returns existing if name exists)

**Request:**
```json
{
  "name": "John"
}
```

**Success Response (201):**
```json
{
  "status": "success",
  "data": {
    "id": "018f9d1b-9e4f-7a3c-8b2d-1e5f6a7b8c9d",
    "name": "john",
    "gender": "male",
    "gender_probability": 0.99,
    "sample_size": 12345,
    "age": 28,
    "age_group": "adult",
    "country_id": "US",
    "country_probability": 0.65,
    "created_at": "2024-01-01T12:00:00.000Z"
  }
}
```

**Errors:**
- 400: Missing/invalid name
- 502: External API failure
- 200: Profile already exists

### `GET /api/profiles`
**List profiles** (with optional filters)

**Query Params:**
- `?gender=male`
- `?country_id=US`
- `?age_group=adult`
- Combinations: `?gender=female&age_group=teenager`

**Response:**
```json
{
  "status": "success",
  "count": 5,
  "data": [...]
}
```

### `GET /api/profiles/:id`
**Get single profile**
```json
{
  "status": "success",
  "data": {...}
}
```
*404 if not found*

### `DELETE /api/profiles/:id`
**Delete profile**
*204 No Content* (404 if not found)

## Database Schema
```
profiles collection:
{
  id: uuid,
  name: string (lowercase),
  gender: string,
  gender_probability: number,
  sample_size: number,
  age: number,
  age_group: string,
  country_id: string,
  country_probability: number,
  created_at: ISODate
}
```

Database: `Abdulmajeed hng_stage1`

## Environment Variables
| Var | Required | Default | Description |
|-----|----------|---------|-------------|
| `MONGODB_URI` | ✅ | - | MongoDB connection string |
| `PORT` | ❌ | 3000 | Server port |

## Deployment (Vercel)

1. Push to GitHub
2. Import to Vercel
3. Add `MONGODB_URI` in Vercel Environment Variables
4. Deploy!

See `vercel.json` for config.

## Testing
```bash
# Create profile
curl -X POST http://localhost:3000/api/profiles \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice"}'

# List profiles
curl http://localhost:3000/api/profiles?gender=female

# Delete
curl -X DELETE http://localhost:3000/api/profiles/[ID]
```

## Scripts
- `pnpm start` - Production server
- `pnpm dev` - Development with nodemon

## Error Handling
- 400: Validation errors
- 404: Resource not found
- 422: Invalid data types
- 500: Server errors
- 502: External API failures

## Contributing
1. Fork & clone
2. `pnpm install`
3. Create feature branch
4. Submit PR

## License
ISC

---
**Built for HNG Stage 1** 🚀
">
</xai:function_call > 

Now updating TODO.md progress. 

<xai:function_call name="edit_file">
<parameter name="path">/home/emjay/Desktop/hng-stage1-backend/TODO.md
