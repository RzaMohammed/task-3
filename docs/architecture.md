# Architecture Overview

## System Components

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Frontend   │────▶│   Backend    │────▶│   AI Service    │
│   (React)    │     │  (Node.js)   │     │   (Python)      │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
                    ┌──────┴───────┐
                    │              │
              ┌─────▼────┐  ┌─────▼──────┐
              │ Database  │  │ Blockchain  │
              │ (Postgres)│  │  (Solana)   │
              └──────────┘  └────────────┘
```

## Data Flow

1. User uploads evidence via Frontend
2. Backend validates and stores the file
3. AI Service analyzes evidence for authenticity
4. Hash is computed and recorded on Solana blockchain
5. Verification results are returned to the user

## Key Design Decisions

- **Microservices**: Each component runs independently for scalability
- **Blockchain**: Immutable audit trail for evidence integrity
- **AI Analysis**: Automated tampering detection
- **Hash-based verification**: Content-addressable evidence storage
