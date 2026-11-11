# Camp Passport

A playful learning tracker that works like a personal passport: finish a lesson and collect a stamp. You can share a progress card as a PNG and, once every lesson is done, optionally save a personal learning record on Arc Testnet.

Built with [Arc Studio](https://studio.arc.io)

## Features

- Editable passport with nickname, camp name and starting date
- Add, rename, reorder and delete lessons, with optional links and private notes
- Stamps appear with an animation as lessons are completed; completion can be undone
- Shareable PNG progress card (notes are never included)
- JSON export and import for backups
- Optional camp souvenir recorded on Arc Testnet (a personal learning record, not an official certificate)

Progress is stored in this browser only.

## Tech stack

React, TypeScript, Vite, Tailwind CSS, Framer Motion, wagmi, viem, ConnectKit, and a small Solidity contract built with Foundry.

## Development

Prerequisites: Bun.

```bash
bun install
bun run dev
bun run build
bun run check
```

### Environment variables

- `VITE_CAMP_SOUVENIR_ADDRESS`: address of the deployed souvenir contract on Arc Testnet. Without it, the souvenir feature runs as a labeled demo and nothing is sent.
- `RPC_PROXY_BASE_URL`, `RPC_PROXY_TOKEN`, `RPC_PROXY_CHAINS`: optional outside Arc Studio. Provisioned by Arc Studio for backend RPC access; this app does not use them.

### Contract

`contracts/CampSouvenir.sol` stores one souvenir per wallet and camp name. Build it with `forge build`.
