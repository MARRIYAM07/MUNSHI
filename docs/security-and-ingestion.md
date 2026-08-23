# Encryption and ingestion notes

Sensitive values use application-side envelope encryption. Every value gets a random 256-bit data key and AES-256-GCM nonce; the data key is then wrapped with the server master key using AES-256-GCM. Only the serialized ciphertext envelope enters `bytea` columns. `pgcrypto` remains enabled for secure randomness, password hashing in local seeds, and forwarding-token digests; values are not double-encrypted in Postgres.

Set `FIELD_ENCRYPTION_KEY` to 32 random bytes encoded as base64 (for example, `openssl rand -base64 32`) in Vercel's encrypted, server-only environment variables. Never prefix it with `NEXT_PUBLIC_`. For this small team, Vercel is the simplest operational choice because encryption happens in Next.js. Supabase Vault becomes useful when database functions themselves need a secret; moving the key there now would require sending plaintext or keys across the application/database boundary and would not improve this design. Plan key rotation before production data accumulates.

Gmail OAuth requests only `gmail.readonly`. That scope technically permits reading the mailbox; Munshi enforces its narrower promise in code by fetching/searching the editable `GMAIL_SENDERS` allowlist and rechecking every `From` header. Configure the Google Cloud OAuth consent screen with the same disclosure—route handlers cannot control its text.

Raw SMS/email bodies are encrypted and erased from staging after successful categorization. Failed encrypted payloads remain for parser debugging; add a scheduled retention job before production (no retention duration was supplied).

For Pakistan-first ingestion, the Android forwarder is the default: messages already land on the user's device and it avoids depending on inbound-number coverage and sender routing. Each connection receives a token once; only its SHA-256 digest is stored. Toggling pauses ingestion without deleting configuration, while disconnecting destroys the token/configuration.
