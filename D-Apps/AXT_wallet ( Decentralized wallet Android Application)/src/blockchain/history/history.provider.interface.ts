import { NetworkConfig } from '../networks/network.types';
import { FetchHistoryResult } from './history.types';

/**
 * Pluggable history provider interface contract.
 * Concrete adapters (Explorer, Indexer, Subgraphs, Alchemy, etc.) implement this interface.
 * The core TransactionHistoryService and UI remain completely decoupled from specific APIs.
 */
export interface IHistoryProvider {
  /** Identifier name of the provider adapter */
  readonly name: string;

  /**
   * Fetches paginated on-chain transaction history (both native and ERC-20 transfers)
   * for the given wallet address on the specified network.
   *
   * @param address - User's wallet address
   * @param network - Active network configuration
   * @param page - 1-based page number
   * @param pageSize - Number of items per page
   */
  fetchHistory(
    address: string,
    network: NetworkConfig,
    page: number,
    pageSize: number
  ): Promise<FetchHistoryResult>;
}
