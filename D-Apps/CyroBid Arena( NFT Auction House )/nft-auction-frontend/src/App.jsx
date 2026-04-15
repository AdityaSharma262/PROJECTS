import { useState, useEffect } from 'react';
import Web3 from 'web3';
import { MyNftABI, contractAddress } from './MyNftABI';
import { nftAuctionAddress, nftAuctionABI } from './nftAuctionABI';


const getRemainingTime = (endTime) => {
  const currentTime = Math.floor(Date.now() / 1000);
  const remainingTime = endTime - currentTime;
  if (remainingTime <= 0) return "Auction ended, Wait for Seller to settle the auction.";
  const hours = String(Math.floor(remainingTime / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((remainingTime % 3600) / 60)).padStart(2, '0');
  const seconds = String(remainingTime % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

function App() {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [uri, setUri] = useState('');
  const [contract, setContract] = useState(null);
  const [tokenId, setTokenId] = useState(null);
  const [nftList, setNftList] = useState([]);
  const [auctionContract, setAuctionContract] = useState(null);
  const [auctionTokenId, setAuctionTokenId] = useState('');
  const [auctionMinBid, setAuctionMinBid] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('');
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [bidAmount, setBidAmount] = useState({});
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));


  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3Instance.eth.getAccounts();
        setWeb3(web3Instance);
        setAccount(accounts[0]);
      } catch (error) {
        console.error("User denied account access:", error);
      }
    } else {
      alert("Install MetaMask!");
    }
  };

  useEffect(() => {
    const autoConnect = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        const accounts = await web3Instance.eth.getAccounts();
        if (accounts.length > 0) {
          setWeb3(web3Instance);
          setAccount(accounts[0]);
        }
      }
    };
    autoConnect();
  }, []);

  useEffect(() => {
    if (web3) {
      setContract(new web3.eth.Contract(MyNftABI, contractAddress));
      setAuctionContract(new web3.eth.Contract(nftAuctionABI, nftAuctionAddress));
    }
  }, [web3]);

  useEffect(() => {
    if (auctionContract && contract) {
      const interval = setInterval(() => {
        loadLiveAuctions();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [auctionContract, contract]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getTokenId = async () => {
    if (contract) {
      const count = await contract.methods.tokenCount().call();
      setTokenId(count);
    }
  };

  const mintNFT = async () => {
    if (contract) {
      await contract.methods.mint(uri).send({ from: account });
    }
  };

  const loadAllNFTs = async () => {
    if (contract) {
      const count = Number(await contract.methods.tokenCount().call());
      const items = [];
      for (let i = 1; i <= count; i++) {
        try {
          const uri = await contract.methods.tokenURI(i.toString()).call();
          items.push({ tokenId: i, uri });
        } catch (error) {
          console.warn(`Token ID ${i} may not exist.`);
        }
      }
      setNftList(items);
    }
  };

  const createAuction = async () => {
    if (!contract || !auctionContract || !account) return;
    const tokenId = auctionTokenId;
    const existingAuction = await auctionContract.methods.auctions(contractAddress, tokenId).call();
    const now = Math.floor(Date.now() / 1000);
    const hasAuctionEnded =
      existingAuction.seller !== '0x0000000000000000000000000000000000000000' &&
      Number(existingAuction.endTime) < now;

    if (!hasAuctionEnded && existingAuction.seller !== '0x0000000000000000000000000000000000000000') {
      console.log("❌ Auction already exists and has not ended.");
      return;
    }

    const owner = await contract.methods.ownerOf(tokenId).call();
    if (owner.toLowerCase() !== account.toLowerCase()) {
      console.log("❌ You do NOT own this token.");
      return;
    }

    await contract.methods.approve(nftAuctionAddress, tokenId).send({ from: account });
    const minBidInWei = web3.utils.toWei(auctionMinBid, 'ether');

    await auctionContract.methods.createAuction(
      minBidInWei,
      auctionDuration,
      tokenId,
      contractAddress
    ).send({ from: account });

    console.log("✅ Auction created successfully");
    await loadLiveAuctions();
  };

  const loadLiveAuctions = async () => {
  try {
    const total = await contract.methods.tokenCount().call();
    const activeAuctions = [];

    const now = Math.floor(Date.now() / 1000);
    const zeroAddress = "0x0000000000000000000000000000000000000000";

    for (let tokenId = 1; tokenId <= total; tokenId++) {
      const auction = await auctionContract.methods.getAuction(contractAddress, tokenId).call();

      const isAuctionValid = auction.seller !== zeroAddress;
      const hasBids = auction.highestBidder !== zeroAddress && auction.highestBid !== "0";

      const isActive = !auction.ended && Number(auction.endTime) > now;
      const isEndedWithBids = Number(auction.endTime) <= now && hasBids && !auction.ended;

      // ✅ Keep only if auction is either active OR ended but still needs settling
      if (!isAuctionValid || (!isActive && !isEndedWithBids)) continue;

      // Fetch NFT metadata
      const tokenURI = await contract.methods.tokenURI(tokenId).call();
      let metadata = {};
      if (tokenURI.endsWith('.json')) {
        metadata = await fetch(tokenURI).then((res) => res.json());
      } else {
        metadata.image = tokenURI;
      }

      activeAuctions.push({
        tokenId,
        nftAddress: contractAddress,
        auction,
        uri: tokenURI,
        metadata,
        highestBid: auction.highestBid,
        creationTime: Number(auction.endTime) - Number(auction.duration), // Calculate creation time
      });
    }

    // Sort by creation time (newest first)
    activeAuctions.sort((a, b) => b.creationTime - a.creationTime);
    setLiveAuctions(activeAuctions);
  } catch (error) {
    console.error("❌ Error loading auctions:", error);
  }
};


  const placeBid = async (nftAddress, tokenId, bidAmountInEth) => {
    if (!auctionContract || !account) return;
    if (!bidAmountInEth || isNaN(bidAmountInEth) || Number(bidAmountInEth) <= 0) {
      alert("❌ Enter a valid bid.");
      return;
    }

    try {
      const valueInWei = web3.utils.toWei(bidAmountInEth.toString(), 'ether');
      await auctionContract.methods.bid(nftAddress, tokenId).send({
        from: account,
        value: valueInWei,
      });
      console.log("✅ Bid placed");
    } catch (error) {
      console.error("❌ Error placing bid:", error);
    }
    await loadLiveAuctions();
  };

  const settleAuction = async (nftAddress, tokenId) => {
    try {
      await auctionContract.methods.endAuction(nftAddress, tokenId).send({ from: account });
      console.log("✅ Auction settled");
      await loadLiveAuctions();
    } catch (error) {
      console.error("❌ Error settling auction:", error);
    }
  };

  return (
    <div className="main-wrapper">
      <h1>NFT Auction House</h1>
      <button onClick={connectWallet}>{account ? "Wallet Connected" : "Connect Wallet"}</button>
      {account && <p>Connected Account: {account}</p>}

      <div className="app-layout">
        {/* Left Column - Mint & Create Auction */}
        <div className="left-column">
          <div className="card">
            <h2>Mint NFT</h2>
            <input type="text" placeholder="Enter URI" value={uri} onChange={(e) => setUri(e.target.value)} />
            <button onClick={mintNFT}>Mint NFT</button>
            <button onClick={getTokenId}>Get your Token ID</button>
            <p>Token ID: {tokenId}</p>
          </div>

          <div className="card">
            <h2>Create Auction</h2>
            <input type="number" placeholder="Token ID" value={auctionTokenId} onChange={(e) => setAuctionTokenId(e.target.value)} />
            <input type="number" placeholder="Min Bid (ETH)" value={auctionMinBid} onChange={(e) => setAuctionMinBid(e.target.value)} />
            <input type="number" placeholder="Duration (seconds)" value={auctionDuration} onChange={(e) => setAuctionDuration(e.target.value)} />
            <button onClick={createAuction}>Create Auction</button>
          </div>
        </div>

        {/* Right Column - Live Auctions */}
        <div className="right-column">
          <div className="card">
            <h2>Live Auctions</h2>
            {liveAuctions.length === 0 ? (
              <p>No live auctions currently.</p>
            ) : (
              <div className="auction-grid">
                {liveAuctions.map((item, index) => (
                  <div key={index} className="auction-card">
                    <p><strong>Token ID:</strong> {item.tokenId}</p>
                    <p><strong>Min Bid:</strong> {web3.utils.fromWei(item.auction.minBid, 'ether')} ETH</p>
                    <p><strong>Highest Bid:</strong> {web3.utils.fromWei(item.auction.highestBid, 'ether')} ETH</p>
                    <p><strong>Ends In:</strong> {getRemainingTime(Number(item.auction.endTime))}</p>
                    {item.metadata?.image && <img src={item.metadata.image} alt="NFT" style={{ width: '100px' }} />}

                    {currentTime < Number(item.auction.endTime) ? (
                      <>
                        <h3>Place Bid</h3>
                        <input
                          type="text"
                          placeholder="Bid in ETH"
                          value={bidAmount[item.tokenId] || ''}
                          onChange={(e) => setBidAmount({ ...bidAmount, [item.tokenId]: e.target.value })}
                        />
                        <button onClick={() => placeBid(item.nftAddress, item.tokenId, bidAmount[item.tokenId])}>Place Bid</button>
                      </>
                    ) : (
                      // Show settle button if auction has ended and seller is current user
                      !item.auction.ended && account.toLowerCase() === item.auction.seller.toLowerCase() && (
                        <button onClick={() => settleAuction(item.nftAddress, item.tokenId)}>
                          Settle Auction
                        </button>
                      )
                    )}

                    <p><strong>Seller:</strong> {item.auction.seller}</p>
                    <p><strong>Highest Bidder:</strong> {item.auction.highestBidder}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section - All NFTs Gallery */}
      <div className="bottom-section">
        <div className="card">
          <h2>NFT Gallery</h2>
          <button onClick={loadAllNFTs} className="load-nfts-btn">Load All NFTs</button>
          {nftList.length > 0 && (
            <div className="auction-grid">
              {nftList.map(nft => (
                <div key={nft.tokenId} className="auction-card">
                  <p><strong>Token ID:</strong> {nft.tokenId}</p>
                  <p><strong>Token URI:</strong> {nft.uri}</p>
                  {nft.uri.startsWith("http") && <img src={nft.uri} alt="NFT" style={{ width: '100px' }} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
