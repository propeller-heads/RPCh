import { ethers } from "ethers";
import { RequestDB } from "./types";

const {
  // Secret key used for access token generation
  SECRET_KEY,
  // Wallet private key that will be completing the requests
  WALLET_PRIV_KEY,
  // Postgres db connection url
  DB_CONNECTION_URL,
  // Custom chain id to complete funding
  FORCE_CHAIN_ID,
  // Custom chain url that will be used to create the provider to complete funding
  FORCE_RPC_URL,
  // Custom ERC20 contract on custom chain which will be used for funding
  FORCE_SMART_CONTRACT_ADDRESS,
} = process.env;

const GNOSIS_CHAIN_ID = 100;

// Port that server will listen for requests
const PORT = process.env.PORT ? Number(process.env.PORT) : 3010;

// Number of confirmations that will be required for a transaction to be accepted
const CONFIRMATIONS = process.env.CONFIRMATIONS
  ? Number(process.env.CONFIRMATIONS)
  : 1;

// Max amount of tokens a access token can request
const MAX_AMOUNT_OF_TOKENS = process.env.MAX_AMOUNT_OF_TOKENS
  ? BigInt(process.env.MAX_AMOUNT_OF_TOKENS)
  : BigInt(100);

// Amount of milliseconds that a access token is valid
const TIMEOUT = process.env.TIMEOUT ? Number(process.env.TIMEOUT) : 30 * 60_000;

// A map of connection information for different Ethereum chains.
const CONNECTION_INFO: { [chainId: number]: ethers.utils.ConnectionInfo } = {
  [GNOSIS_CHAIN_ID]: { url: "https://primary.gnosis-chain.rpc.hoprtech.net" },
};

// A map of smart contract addresses for different Ethereum chains.
const SMART_CONTRACTS_PER_CHAIN: { [chainId: number]: string } = {
  [GNOSIS_CHAIN_ID]: "0x66225dE86Cac02b32f34992eb3410F59DE416698",
};

// Override chain ID, RPC URL, and smart contract address if provided.
if (FORCE_CHAIN_ID && FORCE_RPC_URL && FORCE_SMART_CONTRACT_ADDRESS) {
  CONNECTION_INFO[Number(FORCE_CHAIN_ID)] = { url: FORCE_RPC_URL };
  SMART_CONTRACTS_PER_CHAIN[Number(FORCE_CHAIN_ID)] =
    FORCE_SMART_CONTRACT_ADDRESS;
}

// An array of request statuses that are considered unresolved.
const UNRESOLVED_REQUESTS_STATUSES: RequestDB["status"][] = [
  "FRESH",
  "PENDING",
  "PROCESSING",
];

const METRIC_PREFIX = "funding_service";

export {
  SECRET_KEY,
  WALLET_PRIV_KEY,
  DB_CONNECTION_URL,
  PORT,
  CONFIRMATIONS,
  MAX_AMOUNT_OF_TOKENS,
  TIMEOUT,
  FORCE_CHAIN_ID,
  FORCE_RPC_URL,
  FORCE_SMART_CONTRACT_ADDRESS,
  CONNECTION_INFO,
  SMART_CONTRACTS_PER_CHAIN,
  UNRESOLVED_REQUESTS_STATUSES,
  METRIC_PREFIX,
};
