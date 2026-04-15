// Import ABIs
import ApolloIDTokenABI from "./ApolloIDToken.json";
import ApolloIDRegistryABI from "./ApolloIDRegistry.json";
import ApolloIDRegistrarCoreABI from "./ApolloIDRegistrar.json";
import IApolloIDABI from "./IApolloID.json";
import ApolloIDResolverABI from "./ApolloIDResolver.json";

export const CONTRACT_ADDRESSES = {
  bnb: {
    ApolloIDToken: "0xd1A80747Ca49010026d4ba8F9B457C18f9BFa7Ea",
    ApolloIDRegistry: "0x317c278195c6Cd9B46A76C957A93Ad1283e1AF64",
    ApolloIDRegistrar: "0x11F05DeF1945Ae4915B1Af935AADAd488C8a638C",
    ApolloIDResolver: "0xaDcB08918Aab4d6B6BB726Af48e38F36BFf9A50f",
  },
};

const ApolloIDRegistrarABI = [
  ...ApolloIDRegistrarCoreABI,
  ...IApolloIDABI,
];

export const CONTRACT_ABIS = {
  ApolloIDToken: ApolloIDTokenABI,
  ApolloIDRegistry: ApolloIDRegistryABI,
  ApolloIDRegistrar: ApolloIDRegistrarABI,
  ApolloIDResolver: ApolloIDResolverABI,
};

// chainId → Name mapping
export const CHAIN_NAME = {
  97: "bnb",
};